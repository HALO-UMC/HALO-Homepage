import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const chromePort = process.env.CHROME_DEBUG_PORT || "9223";
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
const outputDirectory =
  process.env.QA_OUTPUT_DIR ||
  "C:/Users/Public/Documents/ESTsoft/CreatorTemp/halo-editorial-qa";

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }

      for (const listener of this.listeners.get(message.method) || []) {
        listener(message.params);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const listeners = this.listeners.get(method) || [];
        this.listeners.set(
          method,
          listeners.filter((item) => item !== listener),
        );
        resolve(params);
      };
      this.on(method, listener);
    });
  }

  close() {
    this.socket.close();
  }
}

async function createTab() {
  const response = await fetch(
    `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error(`Chrome debugging endpoint returned ${response.status}`);
  return response.json();
}

async function evaluate(client, expression, awaitPromise = false) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        "Browser evaluation failed",
    );
  }
  return result.result.value;
}

async function waitForPaint(client) {
  await evaluate(
    client,
    `Promise.all([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    ])`,
    true,
  );
}

async function waitForImages(client) {
  await evaluate(
    client,
    `Promise.all([...document.images].map((image) => {
      image.loading = 'eager';
      if (image.complete) return true;
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      });
    }))`,
    true,
  );
}

async function setViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 480,
    screenWidth: width,
    screenHeight: height,
  });
}

async function navigate(client, pathname, width, height) {
  navigate.sequence = (navigate.sequence || 0) + 1;
  await setViewport(client, width, height);
  const loaded = client.once("Page.loadEventFired");
  const separator = pathname.includes("?") ? "&" : "?";
  await client.send("Page.navigate", {
    url: `${baseUrl}${pathname}${separator}__qa=${navigate.sequence}`,
  });
  await loaded;
  const rendered = await evaluate(
    client,
    `new Promise((resolve) => {
      const started = performance.now();
      const check = () => {
        if (document.querySelector('#root')?.firstElementChild) return resolve(true);
        if (performance.now() - started > 5000) return resolve(false);
        requestAnimationFrame(check);
      };
      check();
    })`,
    true,
  );
  if (!rendered) throw new Error(`React root timeout at ${pathname}`);
  await waitForPaint(client);
}

async function waitForPath(client, expectedPath) {
  return evaluate(
    client,
    `new Promise((resolve) => {
      const started = performance.now();
      const check = () => {
        if (location.pathname === ${JSON.stringify(expectedPath)}) return resolve(true);
        if (performance.now() - started > 3000) return resolve(false);
        requestAnimationFrame(check);
      };
      check();
    })`,
    true,
  );
}

async function screenshot(client, fileName) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filePath = path.join(outputDirectory, fileName);
  await writeFile(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

const tab = await createTab();
const client = new CdpClient(tab.webSocketDebuggerUrl);
const runtimeErrors = [];
const apiRequests = [];
await client.connect();
await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
  client.send("Network.enable"),
]);
client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
  runtimeErrors.push(
    exceptionDetails.exception?.description || exceptionDetails.text || "Unknown runtime error",
  );
});
client.on("Network.requestWillBeSent", ({ request }) => {
  if (request.url.includes("/api/kiri-preregister") && request.method === "POST") {
    apiRequests.push(request.url);
  }
});

await mkdir(outputDirectory, { recursive: true });
const failures = [];
const report = { screenshots: [], pages: {}, navigation: {}, form: {}, apiRequests };

await navigate(client, "/", 1440, 1000);
await waitForImages(client);
report.pages.companyDesktop = await evaluate(
  client,
  `(() => {
    const business = document.querySelector('.editorial-footer__business')?.textContent || '';
    const hero = document.querySelector('.company-hero');
    const services = document.querySelector('#services');
    const slider = document.querySelector('.company-activity-slider');
    const haloPageButton = document.querySelector('.service-feature--halo .service-feature__page-button');
    const kiriPageButton = document.querySelector('.service-feature--kiri .service-feature__page-button');
    const playStoreButton = document.querySelector('.service-feature__store-badge');
    const releaseButton = document.querySelector('.service-feature__release-button');
    return {
      path: location.pathname,
      title: document.title,
      hero: Boolean(document.querySelector('#company-hero-title')),
      heroHeading: document.querySelector('#company-hero-title')?.textContent.trim(),
      heroDescription: document.querySelector('.company-hero__copy > p')?.textContent.trim(),
      heroServiceHref: document.querySelector('.company-hero__cta')?.getAttribute('href'),
      headerServiceHref: document.querySelector('.company-header__desktop a[href="#services"]')?.getAttribute('href'),
      servicesImmediatelyAfterHero: hero?.nextElementSibling === services,
      slider: {
        count: Number(slider?.dataset.slideCount || 0),
        controls: Boolean(slider?.querySelector('.company-activity-slider__controls')),
        empty: Boolean(slider?.querySelector('.company-activity-slider__empty'))
      },
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      haloHref: haloPageButton?.getAttribute('href'),
      kiriHref: kiriPageButton?.getAttribute('href'),
      playStore: {
        href: playStoreButton?.getAttribute('href'),
        target: playStoreButton?.getAttribute('target'),
        badgeSrc: playStoreButton?.querySelector('img')?.getAttribute('src')
      },
      releaseHref: releaseButton?.getAttribute('href'),
      haloLogoSrc: document.querySelector('.service-feature__app-logo--halo')?.getAttribute('src'),
      kiriLogoSrc: document.querySelector('.service-feature__app-logo--kiri')?.getAttribute('src'),
      backgrounds: {
        page: getComputedStyle(document.querySelector('.company-page')).backgroundColor,
        header: getComputedStyle(document.querySelector('.company-header')).backgroundColor,
        services: getComputedStyle(services).backgroundColor,
        partnership: getComputedStyle(document.querySelector('.company-partnership')).backgroundColor,
        footer: getComputedStyle(document.querySelector('.editorial-footer--company')).backgroundColor
      },
      business,
      images: [...document.querySelectorAll('.company-services img')].map((image) => ({
        src: image.getAttribute('src'),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: image.getBoundingClientRect().width,
        renderedHeight: image.getBoundingClientRect().height
      }))
    };
  })()`,
);
assert(report.pages.companyDesktop.path === "/", "기본 경로에 기업 페이지가 표시되지 않습니다.", failures);
assert(report.pages.companyDesktop.hero, "기업 첫 화면이 표시되지 않습니다.", failures);
assert(
  report.pages.companyDesktop.heroHeading === "작은 안녕으로, 가족의 내일을 잇습니다.",
  "기업 히어로 핵심 문구가 요청한 내용과 다릅니다.",
  failures,
);
assert(
  report.pages.companyDesktop.heroDescription ===
    "HALO는 서로에게 건네는 인사와 평안한 일상을 뜻하는 ‘안녕’에서 시작합니다.",
  "기업 히어로 보조 문구가 요청한 내용과 다릅니다.",
  failures,
);
assert(
  report.pages.companyDesktop.servicesImmediatelyAfterHero,
  "서비스 소개가 히어로 바로 다음에 배치되지 않았습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.heroServiceHref === "#services" &&
    report.pages.companyDesktop.headerServiceHref === "#services",
  "히어로 또는 헤더의 서비스 앵커가 올바르지 않습니다.",
  failures,
);
assert(
  (report.pages.companyDesktop.slider.count >= 2 && report.pages.companyDesktop.slider.controls) ||
    (report.pages.companyDesktop.slider.count === 0 && report.pages.companyDesktop.slider.empty),
  "활동 사진 슬라이더가 사진 또는 명확한 준비 상태를 제공하지 않습니다.",
  failures,
);
assert(report.pages.companyDesktop.haloHref === "/halo", "HALO 서비스 링크가 /halo가 아닙니다.", failures);
assert(report.pages.companyDesktop.kiriHref === "/kiri", "KIRI 서비스 링크가 /kiri가 아닙니다.", failures);
assert(
  report.pages.companyDesktop.playStore.href ===
    "https://play.google.com/store/apps/details?id=com.umc.halo" &&
    report.pages.companyDesktop.playStore.target === "_blank" &&
    report.pages.companyDesktop.playStore.badgeSrc === "/images/badges/google-play-ko.png",
  "HALO Google Play 배지 링크가 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.releaseHref === "/kiri#kiri-preregister",
  "KIRI 사전 출시 알림 링크가 준비 영역을 가리키지 않습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.haloLogoSrc === "/logotypo.svg" &&
    report.pages.companyDesktop.kiriLogoSrc === "/images/kiri/kiri-logo.svg",
  "서비스별 실제 앱 로고가 올바르게 표시되지 않습니다.",
  failures,
);
assert(
  Object.values(report.pages.companyDesktop.backgrounds).every(
    (color) => color === "rgb(250, 250, 250)",
  ),
  "기업 페이지의 헤더·본문·푸터 배경이 #FAFAFA로 통일되지 않았습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.scrollWidth <= report.pages.companyDesktop.innerWidth,
  "기업 데스크톱 화면에 가로 넘침이 있습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.images.every((image) => image.complete && image.naturalWidth > 0),
  "기업 서비스 영역 이미지 중 로드되지 않은 자산이 있습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.business.includes("624-21-02643"),
  "기업 푸터 사업자 정보가 누락됐습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "company-desktop.png"));
report.pages.companyDesktop.serviceInteraction = await evaluate(
  client,
  `(async () => {
    const haloLink = document.querySelector('.service-feature--halo .service-feature__page-button');
    const kiriLink = document.querySelector('.service-feature--kiri .service-feature__page-button');
    haloLink?.focus();
    const haloFocused = document.activeElement === haloLink;
    kiriLink?.focus();
    return {
      haloFocused,
      kiriFocused: document.activeElement === kiriLink,
      haloHref: haloLink?.getAttribute('href'),
      kiriHref: kiriLink?.getAttribute('href')
    };
  })()`,
  true,
);
assert(
  report.pages.companyDesktop.serviceInteraction.haloFocused &&
    report.pages.companyDesktop.serviceInteraction.kiriFocused &&
    report.pages.companyDesktop.serviceInteraction.haloHref === "/halo" &&
    report.pages.companyDesktop.serviceInteraction.kiriHref === "/kiri",
  "기업 서비스 비주얼 링크에 키보드 포커스를 이동할 수 없습니다.",
  failures,
);
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#services'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-services-desktop.png"));
await evaluate(client, `(() => { const target = document.querySelector('.service-feature--kiri'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-desktop.png"));

await navigate(client, "/", 390, 844);
await waitForImages(client);
report.screenshots.push(await screenshot(client, "company-mobile.png"));
await evaluate(client, `document.querySelector('.company-header__menu-button')?.click()`);
await waitForPaint(client);
report.pages.companyMobile = await evaluate(
  client,
  `({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    expanded: document.querySelector('.company-header__menu-button')?.getAttribute('aria-expanded'),
    menuOpen: document.querySelector('.company-mobile-menu')?.classList.contains('is-open'),
    htmlLocked: document.documentElement.classList.contains('editorial-menu-open')
  })`,
);
assert(report.pages.companyMobile.scrollWidth <= 390, "기업 모바일 화면에 가로 넘침이 있습니다.", failures);
assert(report.pages.companyMobile.expanded === "true", "기업 모바일 메뉴가 열리지 않습니다.", failures);
assert(report.pages.companyMobile.htmlLocked, "모바일 메뉴에서 배경 스크롤이 잠기지 않습니다.", failures);
report.screenshots.push(await screenshot(client, "company-mobile-menu.png"));
await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
await waitForPaint(client);
assert(
  (await evaluate(client, `document.querySelector('.company-header__menu-button')?.getAttribute('aria-expanded')`)) === "false",
  "Escape 키로 기업 모바일 메뉴가 닫히지 않습니다.",
  failures,
);
await waitForImages(client);
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#services'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.pages.companyMobile.services = await evaluate(
  client,
  `(() => ({
    haloLogoWidth: document.querySelector('.service-feature__app-logo--halo')?.getBoundingClientRect().width,
    kiriLogoWidth: document.querySelector('.service-feature__app-logo--kiri')?.getBoundingClientRect().width,
    actionHeights: [...document.querySelectorAll('.service-feature__page-button, .service-feature__release-button, .service-feature__store-badge')].map((element) => element.getBoundingClientRect().height),
    heroHeight: document.querySelector('.company-activity-slider__viewport')?.getBoundingClientRect().height,
    heroWidth: document.querySelector('.company-activity-slider__viewport')?.getBoundingClientRect().width
  }))()`,
);
assert(
  report.pages.companyMobile.services.haloLogoWidth > 150 &&
    report.pages.companyMobile.services.kiriLogoWidth > 130,
  "기업 모바일 서비스 로고가 지나치게 작습니다.",
  failures,
);
assert(
  report.pages.companyMobile.services.actionHeights.every((height) => height >= 44),
  "기업 모바일 서비스 버튼의 터치 영역이 44px보다 작습니다.",
  failures,
);
assert(
  report.pages.companyMobile.services.heroHeight <= 520 &&
    report.pages.companyMobile.services.heroWidth <= 360,
  "기업 모바일 히어로 배너 크기가 과도합니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "company-services-mobile.png"));
await evaluate(client, `(() => { const target = document.querySelector('.service-feature--kiri'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-mobile.png"));

await navigate(client, "/", 1280, 800);
await evaluate(client, `document.documentElement.style.scrollBehavior = 'auto'`);
await evaluate(client, `document.querySelector('.service-feature__release-button')?.click()`);
await waitForPath(client, "/kiri");
await evaluate(
  client,
  `new Promise((resolve) => {
    const started = performance.now();
    const check = () => {
      const target = document.querySelector('#kiri-preregister');
      if (location.hash === '#kiri-preregister' && target && target.getBoundingClientRect().top >= 0 && target.getBoundingClientRect().top < 120) {
        return resolve(true);
      }
      if (performance.now() - started > 3000) return resolve(false);
      requestAnimationFrame(check);
    };
    check();
  })`,
  true,
);
report.navigation.kiriReleaseAnchor = await evaluate(
  client,
  `(() => ({
    path: location.pathname,
    hash: location.hash,
    targetTop: document.querySelector('#kiri-preregister')?.getBoundingClientRect().top
  }))()`,
);
assert(
  report.navigation.kiriReleaseAnchor.path === "/kiri" &&
    report.navigation.kiriReleaseAnchor.hash === "#kiri-preregister" &&
    report.navigation.kiriReleaseAnchor.targetTop >= 0 &&
    report.navigation.kiriReleaseAnchor.targetTop < 120,
  "회사 홈페이지의 KIRI 사전 출시 버튼이 준비 영역으로 이동하지 않습니다.",
  failures,
);

await navigate(client, "/webeditorial", 1280, 800);
report.navigation.legacyCompany = await waitForPath(client, "/");
await navigate(client, "/webeditorial/kiri", 1280, 800);
report.navigation.legacyKiri = await waitForPath(client, "/kiri");
assert(report.navigation.legacyCompany, "/webeditorial이 /로 리다이렉트되지 않습니다.", failures);
assert(report.navigation.legacyKiri, "/webeditorial/kiri가 /kiri로 리다이렉트되지 않습니다.", failures);

await evaluate(client, `sessionStorage.setItem('halo_splash_seen', 'true')`);
await navigate(client, "/halo", 1440, 1000);
await waitForImages(client);
report.pages.halo = await evaluate(
  client,
  `(() => {
    const footer = document.querySelector('footer');
    return {
      path: location.pathname,
      hasHome: Boolean(document.querySelector('#top')),
      hasEditorialShell: Boolean(document.querySelector('.editorial-shell')),
      logoHref: document.querySelector('header a[aria-label="HALO 앱 홈페이지"]')?.getAttribute('href'),
      sectionHref: document.querySelector('header nav a[href*="#"]')?.getAttribute('href'),
      downloadHref: footer?.querySelector('a[href="/download"]')?.getAttribute('href'),
      termsHref: footer?.querySelector('a[href="/terms"]')?.getAttribute('href'),
      companyHref: footer?.querySelector('a[href="/"]')?.getAttribute('href'),
      business: footer?.textContent || '',
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth
    };
  })()`,
);
assert(report.pages.halo.path === "/halo" && report.pages.halo.hasHome, "기존 HALO 앱 홈이 /halo에 표시되지 않습니다.", failures);
assert(!report.pages.halo.hasEditorialShell, "HALO 앱 페이지에 기업 레이아웃 CSS 구조가 섞였습니다.", failures);
assert(report.pages.halo.logoHref === "/halo", "HALO 앱 로고가 /halo로 연결되지 않습니다.", failures);
assert(
  report.pages.halo.sectionHref?.startsWith("#") || report.pages.halo.sectionHref?.startsWith("/halo#"),
  "HALO 내부 섹션 링크가 /halo 기준이 아닙니다.",
  failures,
);
assert(report.pages.halo.downloadHref === "/download", "HALO 다운로드 링크가 깨졌습니다.", failures);
assert(report.pages.halo.termsHref === "/terms", "HALO 약관 링크가 깨졌습니다.", failures);
assert(report.pages.halo.companyHref === "/", "HALO 앱에서 회사 홈 링크가 누락됐습니다.", failures);
assert(report.pages.halo.business.includes("624-21-02643"), "HALO 앱 푸터 사업자 정보가 누락됐습니다.", failures);
assert(report.pages.halo.scrollWidth <= report.pages.halo.innerWidth, "HALO 앱 데스크톱 화면에 가로 넘침이 있습니다.", failures);
report.screenshots.push(await screenshot(client, "halo-desktop.png"));

for (const route of ["/download", "/terms", "/privacy", "/content-policy", "/marketing"]) {
  await navigate(client, route, 1280, 800);
  const state = await evaluate(
    client,
    `({ path: location.pathname, logoHref: document.querySelector('header a[aria-label="HALO 앱 홈페이지"]')?.getAttribute('href') })`,
  );
  report.navigation[route] = state;
  assert(state.path === route, `${route} 경로가 표시되지 않습니다.`, failures);
  assert(state.logoHref === "/halo", `${route}에서 HALO 앱 홈 복귀 링크가 올바르지 않습니다.`, failures);
}

await navigate(client, "/kiri", 1440, 1000);
await waitForImages(client);
report.pages.kiriDesktop = await evaluate(
  client,
  `(() => ({
    path: location.pathname,
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    companyHref: document.querySelector('.kiri-header__company')?.getAttribute('href'),
    logoHref: document.querySelector('.kiri-header__brand')?.getAttribute('href'),
    showcase: {
      tabCount: document.querySelectorAll('.kiri-showcase__tabs [role="tab"]').length,
      selectedLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      panelTitle: document.querySelector('.kiri-showcase__copy h3')?.textContent.trim(),
      imageSrc: document.querySelector('.kiri-showcase__panel img')?.getAttribute('src')
    },
    images: [...document.querySelectorAll('img[src^="/images/kiri/"]')].map((image) => {
      const naturalRatio = image.naturalWidth / image.naturalHeight;
      const renderedRatio = image.offsetWidth / image.offsetHeight;
      const rect = image.getBoundingClientRect();
      return {
        src: image.getAttribute('src'),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        ratioDifference: Number.isFinite(renderedRatio) ? Math.abs(naturalRatio - renderedRatio) : 999
      };
    }),
    form: {
      visible: Boolean(document.querySelector('.kiri-form')),
      email: Boolean(document.querySelector('#kiri-email')),
      nickname: Boolean(document.querySelector('#kiri-nickname')),
      deviceCount: document.querySelectorAll('input[name="device"]').length,
      trial: Boolean(document.querySelector('input[name="familyTrial"]')),
      privacy: Boolean(document.querySelector('input[name="privacyAgreed"]')),
      disabled: document.querySelector('.kiri-submit')?.disabled,
      buttonText: document.querySelector('.kiri-submit')?.textContent.trim(),
      preparing: document.querySelector('.kiri-form__preparing')?.textContent || '',
      labels: [...document.querySelectorAll('.kiri-form label')].map((label) => label.textContent.trim())
    },
    business: document.querySelector('.editorial-footer__business')?.textContent || ''
  }))()`,
);
assert(report.pages.kiriDesktop.path === "/kiri", "KIRI 페이지가 /kiri에 표시되지 않습니다.", failures);
assert(report.pages.kiriDesktop.logoHref === "/kiri", "KIRI 로고 링크가 /kiri가 아닙니다.", failures);
assert(report.pages.kiriDesktop.companyHref === "/", "KIRI에서 회사 홈 링크가 올바르지 않습니다.", failures);
assert(report.pages.kiriDesktop.scrollWidth <= report.pages.kiriDesktop.innerWidth, "KIRI 데스크톱 화면에 가로 넘침이 있습니다.", failures);
assert(report.pages.kiriDesktop.showcase.tabCount === 4, "KIRI 쇼케이스 탭이 4개가 아닙니다.", failures);
assert(
  report.pages.kiriDesktop.showcase.selectedLabel === "질문" &&
    report.pages.kiriDesktop.showcase.imageSrc === "/images/kiri/kiri-question.png",
  "KIRI 쇼케이스의 초기 질문 화면이 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.images.every(
    (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && image.ratioDifference < 0.04,
  ),
  "KIRI 실제 자산 중 로드 또는 비율이 올바르지 않은 이미지가 있습니다.",
  failures,
);
assert(report.pages.kiriDesktop.form.visible, "서버 설정 없이 KIRI 폼 UI가 표시되지 않습니다.", failures);
assert(report.pages.kiriDesktop.form.email && report.pages.kiriDesktop.form.nickname, "KIRI 폼 입력란이 누락됐습니다.", failures);
assert(
  report.pages.kiriDesktop.form.labels.some((label) => label.startsWith("불러드릴 이름")),
  "KIRI 불러드릴 이름 입력란이 누락됐습니다.",
  failures,
);
assert(report.pages.kiriDesktop.form.deviceCount === 4, "KIRI 사용 기기 선택지가 4개가 아닙니다.", failures);
assert(report.pages.kiriDesktop.form.trial && report.pages.kiriDesktop.form.privacy, "KIRI 선택·동의 UI가 누락됐습니다.", failures);
assert(report.pages.kiriDesktop.form.disabled, "KIRI 제출 버튼이 비활성화되지 않았습니다.", failures);
assert(report.pages.kiriDesktop.form.buttonText === "접수 준비 중", "KIRI 비활성 버튼 문구가 올바르지 않습니다.", failures);
assert(
  report.pages.kiriDesktop.form.preparing.includes("입력 후 설정이 준비되면 신청할 수 있어요") ||
    report.pages.kiriDesktop.form.preparing.includes("접수 설정을 마치면 신청 내용을 서버에 저장할 수 있어요"),
  "KIRI 접수 설정 안내가 누락됐습니다.",
  failures,
);
assert(report.pages.kiriDesktop.business.includes("624-21-02643"), "KIRI 푸터 사업자 정보가 누락됐습니다.", failures);
report.screenshots.push(await screenshot(client, "kiri-desktop-hero.png"));
report.pages.kiriDesktop.formInteraction = await evaluate(
  client,
  `(async () => {
    const setInput = (selector, value) => {
      const input = document.querySelector(selector);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setInput('#kiri-email', 'kiri-smoke@example.test');
    setInput('#kiri-nickname', '브라우저 확인');
    document.querySelector('input[name="device"][value="ios"]')?.click();
    document.querySelector('input[name="familyTrial"]')?.click();
    document.querySelector('input[name="privacyAgreed"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 40));
    return {
      email: document.querySelector('#kiri-email')?.value,
      nickname: document.querySelector('#kiri-nickname')?.value,
      device: document.querySelector('input[name="device"]:checked')?.value,
      familyTrial: document.querySelector('input[name="familyTrial"]')?.checked,
      privacyAgreed: document.querySelector('input[name="privacyAgreed"]')?.checked
    };
  })()`,
  true,
);
assert(report.pages.kiriDesktop.formInteraction.email === "kiri-smoke@example.test", "KIRI 이메일 입력이 반영되지 않습니다.", failures);
assert(report.pages.kiriDesktop.formInteraction.nickname === "브라우저 확인", "KIRI 이름 입력이 반영되지 않습니다.", failures);
assert(report.pages.kiriDesktop.formInteraction.device === "ios", "KIRI 기기 선택이 반영되지 않습니다.", failures);
assert(report.pages.kiriDesktop.formInteraction.familyTrial, "KIRI 체험단 선택이 반영되지 않습니다.", failures);
assert(report.pages.kiriDesktop.formInteraction.privacyAgreed, "KIRI 필수 동의 선택이 반영되지 않습니다.", failures);
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-experience'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "kiri-desktop-experience.png"));
report.pages.kiriDesktop.showcaseKeyboard = await evaluate(
  client,
  `(async () => {
    const firstTab = document.querySelector('[data-experience-index="0"]');
    firstTab?.focus();
    firstTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    return {
      selectedLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      focusedLabel: document.activeElement?.textContent.trim(),
      imageSrc: document.querySelector('.kiri-showcase__panel img')?.getAttribute('src')
    };
  })()`,
  true,
);
assert(
  report.pages.kiriDesktop.showcaseKeyboard.selectedLabel === "활동 발견" &&
    report.pages.kiriDesktop.showcaseKeyboard.focusedLabel === "활동 발견" &&
    report.pages.kiriDesktop.showcaseKeyboard.imageSrc === "/images/kiri/kiri-places.png",
  "KIRI 쇼케이스의 방향키 탐색이 동작하지 않습니다.",
  failures,
);
await evaluate(client, `document.querySelector('[data-experience-index="2"]')?.click()`);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 240))`, true);
await waitForImages(client);
report.pages.kiriDesktop.showcaseClick = await evaluate(
  client,
  `({
    selectedLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
    imageSrc: document.querySelector('.kiri-showcase__panel img')?.getAttribute('src')
  })`,
);
assert(
  report.pages.kiriDesktop.showcaseClick.selectedLabel === "일정" &&
    report.pages.kiriDesktop.showcaseClick.imageSrc === "/images/kiri/kiri-schedule.png",
  "KIRI 쇼케이스 클릭 시 일정 화면으로 바뀌지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-desktop-experience-selected.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-preregister'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "kiri-desktop-form.png"));

await evaluate(client, `document.querySelector('.kiri-form')?.requestSubmit()`);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 250))`, true);
report.form.apiRequestCountAfterSubmitAttempt = apiRequests.length;
assert(apiRequests.length === 0, "비활성 사전예약 폼이 API 요청을 보냈습니다.", failures);

await navigate(client, "/kiri", 390, 844);
await waitForImages(client);
report.pages.kiriMobile = await evaluate(
  client,
  `({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    formVisible: Boolean(document.querySelector('.kiri-form')),
    phoneWidths: [...document.querySelectorAll('.kiri-phone img')].map((image) => image.getBoundingClientRect().width),
    tabCount: document.querySelectorAll('.kiri-showcase__tabs [role="tab"]').length,
    tabHeights: [...document.querySelectorAll('.kiri-showcase__tabs [role="tab"]')].map((tab) => tab.getBoundingClientRect().height)
  })`,
);
assert(report.pages.kiriMobile.scrollWidth <= 390, "KIRI 모바일 화면에 가로 넘침이 있습니다.", failures);
assert(report.pages.kiriMobile.formVisible, "KIRI 모바일에서 폼 UI가 표시되지 않습니다.", failures);
assert(report.pages.kiriMobile.phoneWidths.every((width) => width >= 260), "KIRI 모바일 앱 화면이 지나치게 작습니다.", failures);
assert(
  report.pages.kiriMobile.tabCount === 4 && report.pages.kiriMobile.tabHeights.every((height) => height >= 44),
  "KIRI 모바일 쇼케이스 탭의 개수 또는 터치 영역이 올바르지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-mobile-hero.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-experience'); if (target) window.scrollTo(0, target.offsetTop); document.querySelector('[data-experience-index="3"]')?.click(); })()`);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 240))`, true);
await waitForImages(client);
report.pages.kiriMobile.showcase = await evaluate(
  client,
  `({
    selectedLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
    imageSrc: document.querySelector('.kiri-showcase__panel img')?.getAttribute('src'),
    imageWidth: document.querySelector('.kiri-showcase__panel img')?.getBoundingClientRect().width
  })`,
);
assert(
  report.pages.kiriMobile.showcase.selectedLabel === "기록" &&
    report.pages.kiriMobile.showcase.imageSrc === "/images/kiri/kiri-record.png" &&
    report.pages.kiriMobile.showcase.imageWidth >= 260,
  "KIRI 모바일 쇼케이스에서 기록 화면을 선택할 수 없습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-mobile-experience-selected.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-preregister'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "kiri-mobile-form.png"));

for (const error of runtimeErrors) failures.push(`브라우저 런타임 오류: ${error}`);
report.failures = failures;

console.log(JSON.stringify(report, null, 2));
client.close();
if (failures.length > 0) process.exitCode = 1;
