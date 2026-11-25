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
  await waitForPaint(client);
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

async function reload(client) {
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.reload", { ignoreCache: true });
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
  if (!rendered) throw new Error("React root timeout after reload");
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
await client.connect();
await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
]);
client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
  runtimeErrors.push(
    exceptionDetails.exception?.description || exceptionDetails.text || "Unknown runtime error",
  );
});
await mkdir(outputDirectory, { recursive: true });
const failures = [];
const report = { screenshots: [], pages: {}, navigation: {} };

await navigate(client, "/", 1440, 1000);
await waitForImages(client);
report.pages.companyDesktop = await evaluate(
  client,
  `(() => {
    const business = document.querySelector('.editorial-footer__business')?.textContent || '';
    const hero = document.querySelector('.company-hero');
    const services = document.querySelector('#services');
    const slider = document.querySelector('.company-activity-slider');
    const haloPageButton = document.querySelector('.halo-legacy .service-feature__page-button');
    const kiriPageButton = document.querySelector('.halo-product .service-feature__page-button');
    const playStoreButton = document.querySelector('.halo-legacy .service-feature__store-badge');
    const appStoreButton = document.querySelector('.halo-product .service-feature__store-badge--app-store');
    return {
      path: location.pathname,
      title: document.title,
      hero: Boolean(document.querySelector('#company-hero-title')),
      heroHeading: document.querySelector('#company-hero-title')?.textContent.trim(),
      heroDescription: document.querySelector('.company-hero__copy > p')?.textContent.trim(),
      companyIntroduction: document.querySelector('#about .halo-lead')?.textContent.trim(),
      kiriIntroduction: document.querySelector('.halo-product .service-feature__copy > p')?.textContent.trim(),
      haloIntroduction: document.querySelector('.halo-legacy .service-feature__copy > p')?.textContent.trim(),
      timeline: [...document.querySelectorAll('.halo-timeline > li')].map((item) => item.textContent.trim()),
      currentMilestone: (() => {
        const item = document.querySelector('.halo-timeline > li.is-current');
        return item ? {
          text: item.textContent.trim(),
          background: getComputedStyle(item).backgroundColor,
          border: getComputedStyle(item).borderLeftColor,
        } : null;
      })(),
      heroServiceHref: document.querySelector('.company-hero__cta')?.getAttribute('href'),
      headerServiceHref: document.querySelector('.company-header__desktop a[href="#services"]')?.getAttribute('href'),
      aboutBeforeServices: hero?.nextElementSibling?.id === "about" && hero?.nextElementSibling?.nextElementSibling === services,
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
      appStore: {
        href: appStoreButton?.getAttribute('href'),
        target: appStoreButton?.getAttribute('target'),
        badgeSrc: appStoreButton?.querySelector('img')?.getAttribute('src')
      },
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
assert(
  report.pages.companyDesktop.title === "HALO | 함께하는 시간을 만듭니다.",
  "회사 페이지 브라우저 제목이 올바르지 않습니다.",
  failures,
);
assert(report.pages.companyDesktop.hero, "기업 첫 화면이 표시되지 않습니다.", failures);
assert(
  report.pages.companyDesktop.heroHeading === "함께하는 시간을 만듭니다.",
  "기업 히어로 핵심 문구가 요청한 내용과 다릅니다.",
  failures,
);
assert(
  report.pages.companyDesktop.heroDescription ===
    "디지털 서비스와 오프라인 경험을 통해 가족이 함께하는 시간을 만드는 기업입니다.",
  "기업 히어로 보조 문구가 요청한 내용과 다릅니다.",
  failures,
);
assert(
  report.pages.companyDesktop.companyIntroduction.includes("실제 사람들의 이야기를 듣고") &&
    report.pages.companyDesktop.companyIntroduction.includes("오프라인 프로그램") &&
    report.pages.companyDesktop.kiriIntroduction.includes("사진과 리뷰") &&
    report.pages.companyDesktop.haloIntroduction.includes("10개의 스토리북 테마"),
  "회사 소개 또는 서비스 핵심 정보가 페이지에 표시되지 않습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.timeline.length === 6 &&
    report.pages.companyDesktop.timeline.some((item) => item.includes("부산 UMC 데모데이 5위")) &&
    report.pages.companyDesktop.timeline.some((item) => item.includes("모두의 창업 진출")) &&
    report.pages.companyDesktop.timeline.some((item) => item.includes("끼리(KIRI) iOS 출시")) &&
    report.pages.companyDesktop.timeline.every((item) => !item.includes("Android 출시")) &&
    report.pages.companyDesktop.currentMilestone?.text.includes("현재") &&
    report.pages.companyDesktop.currentMilestone.background === "rgb(240, 249, 231)" &&
    report.pages.companyDesktop.currentMilestone.border === "rgb(155, 234, 81)",
  "연혁이 확인된 사업·출시 이력을 반영하지 않습니다.",
  failures,
);
assert(
  report.pages.companyDesktop.aboutBeforeServices,
  "기업 소개 후에 서비스 소개가 배치되지 않았습니다.",
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
  report.pages.companyDesktop.appStore.href ===
    "https://apps.apple.com/kr/app/%EB%81%BC%EB%A6%AC-kiri/id6835049058" &&
    report.pages.companyDesktop.appStore.target === "_blank" &&
    report.pages.companyDesktop.appStore.badgeSrc ===
      "/images/badges/app-store-ko.svg",
  "회사 홈페이지의 KIRI App Store 공식 배지 링크가 올바르지 않습니다.",
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
    (color) => ["rgb(255, 255, 255)", "rgb(247, 247, 245)"].includes(color),
  ),
  "기업 페이지의 헤더·본문·푸터에 화이트톤 배경이 적용되지 않았습니다.",
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
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#journey')?.scrollIntoView({ block: 'start' }); })()`);
await waitForImages(client);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 500))`, true);
report.screenshots.push(await screenshot(client, "company-journey-desktop.png"));
await evaluate(client, `document.querySelector('#partnership')?.scrollIntoView({ block: 'start' })`);
await waitForImages(client);
report.screenshots.push(await screenshot(client, "company-partnership-desktop.png"));
await evaluate(client, `window.scrollTo(0, 0)`);
await waitForPaint(client);
report.pages.companyDesktop.serviceInteraction = await evaluate(
  client,
  `(async () => {
    const haloLink = document.querySelector('.halo-legacy .service-feature__page-button');
    const kiriLink = document.querySelector('.halo-product .service-feature__page-button');
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
await evaluate(client, `(() => { const target = document.querySelector('.halo-product'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-desktop.png"));

await navigate(client, "/", 390, 844);
await waitForImages(client);
report.screenshots.push(await screenshot(client, "company-mobile.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#journey')?.scrollIntoView({ block: 'start' }); })()`);
await waitForImages(client);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 500))`, true);
report.screenshots.push(await screenshot(client, "company-journey-mobile.png"));
await evaluate(client, `window.scrollTo(0, 0)`);
await waitForPaint(client);
await evaluate(client, `document.querySelector('.company-header__menu-button')?.click()`);
await waitForPaint(client);
report.pages.companyMobile = await evaluate(
  client,
  `({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    currentTimelineBounds: (() => {
      const rect = document.querySelector('.halo-timeline > li.is-current')?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right } : null;
    })(),
    expanded: document.querySelector('.company-header__menu-button')?.getAttribute('aria-expanded'),
    menuOpen: document.querySelector('.company-mobile-menu')?.classList.contains('is-open'),
    htmlLocked: document.documentElement.classList.contains('editorial-menu-open'),
    appStoreBadgeSrc: document.querySelector('.company-mobile-menu__app-store img')?.getAttribute('src')
  })`,
);
assert(report.pages.companyMobile.scrollWidth <= 390, "기업 모바일 화면에 가로 넘침이 있습니다.", failures);
assert(
  report.pages.companyMobile.currentTimelineBounds?.left >= 0 &&
    report.pages.companyMobile.currentTimelineBounds?.right <= 390,
  "현재 연혁 항목이 모바일 화면을 벗어납니다.",
  failures,
);
assert(report.pages.companyMobile.expanded === "true", "기업 모바일 메뉴가 열리지 않습니다.", failures);
assert(report.pages.companyMobile.htmlLocked, "모바일 메뉴에서 배경 스크롤이 잠기지 않습니다.", failures);
assert(
  report.pages.companyMobile.appStoreBadgeSrc === "/images/badges/app-store-ko.svg",
  "기업 모바일 메뉴의 KIRI App Store 공식 배지가 누락됐습니다.",
  failures,
);
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
    heroWidth: document.querySelector('.company-activity-slider__viewport')?.getBoundingClientRect().width,
    imageBottom: document.querySelector('.company-activity-slider__slide.is-active img')?.getBoundingClientRect().bottom,
    copyTop: document.querySelector('.company-hero__copy')?.getBoundingClientRect().top
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
  report.pages.companyMobile.services.heroHeight <= 650 &&
    report.pages.companyMobile.services.heroWidth <= 360 &&
    report.pages.companyMobile.services.imageBottom <= report.pages.companyMobile.services.copyTop,
  "기업 모바일 배너 영역이 과도하거나 사진과 문구가 겹칩니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "company-services-mobile.png"));
await evaluate(client, `(() => { const target = document.querySelector('.halo-product'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-mobile.png"));

await navigate(client, "/kiri", 1280, 800);
report.navigation.kiriLaunchPage = await evaluate(
  client,
  `({ path: location.pathname, title: document.title, hash: location.hash })`,
);
assert(
  report.navigation.kiriLaunchPage.path === "/kiri" &&
    report.navigation.kiriLaunchPage.hash === "" &&
    report.navigation.kiriLaunchPage.title === "끼리(KIRI)",
  "회사 페이지의 KIRI 출시 링크 대상 페이지가 올바르지 않습니다.",
  failures,
);
await navigate(client, "/webeditorial", 1280, 800);
report.navigation.legacyCompany = await waitForPath(client, "/");
await navigate(client, "/webeditorial/kiri", 1280, 800);
report.navigation.legacyKiri = await waitForPath(client, "/kiri");
assert(report.navigation.legacyCompany, "/webeditorial이 /로 리다이렉트되지 않습니다.", failures);
assert(report.navigation.legacyKiri, "/webeditorial/kiri가 /kiri로 리다이렉트되지 않습니다.", failures);

await evaluate(client, `sessionStorage.setItem('halo_splash_seen', 'true')`);
await navigate(client, "/", 1280, 800);
await evaluate(
  client,
  `document.querySelector('.halo-legacy .service-feature__page-button')?.click()`,
);
await waitForPath(client, "/halo");
await waitForPaint(client);
report.navigation.haloService = await evaluate(
  client,
  `({ path: location.pathname, title: document.title })`,
);
assert(
  report.navigation.haloService.path === "/halo" &&
  report.navigation.haloService.title === "HALO, 가족의 일상을 잇다",
  "회사 페이지에서 HALO로 이동할 때 브라우저 제목이 갱신되지 않습니다.",
  failures,
);
await navigate(client, "/halo", 1440, 1000);
await waitForImages(client);
report.pages.halo = await evaluate(
  client,
  `(() => {
    const footer = document.querySelector('footer');
    return {
      path: location.pathname,
      title: document.title,
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
assert(
  report.pages.halo.title === "HALO, 가족의 일상을 잇다",
  "HALO 앱 페이지 브라우저 제목이 올바르지 않습니다.",
  failures,
);
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
  `(() => {
    const heroImage = document.querySelector('.kiri-hero__visual img');
    const carousel = document.querySelector('.kiri-showcase__carousel');
    const cards = [...carousel.querySelectorAll('.kiri-showcase__card')];
    const carouselRect = carousel.getBoundingClientRect();
    const storeLinks = [...document.querySelectorAll('.kiri-store-badge--apple')];
    return {
      path: location.pathname,
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      backgroundColor: getComputedStyle(document.querySelector('.kiri-page')).backgroundColor,
      logoHref: document.querySelector('.kiri-header__brand')?.getAttribute('href'),
      faviconHref: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
      heroHeading: document.querySelector('#kiri-hero-title')?.textContent.trim(),
      heroDescription: document.querySelector('.kiri-hero__description')?.textContent.trim(),
      heroImage: {
        src: heroImage?.getAttribute('src'),
        complete: heroImage?.complete,
        naturalWidth: heroImage?.naturalWidth,
        naturalHeight: heroImage?.naturalHeight,
        renderedRatio: heroImage ? heroImage.offsetWidth / heroImage.offsetHeight : 0,
        rect: heroImage ? {
          top: heroImage.getBoundingClientRect().top,
          right: heroImage.getBoundingClientRect().right,
          bottom: heroImage.getBoundingClientRect().bottom,
          left: heroImage.getBoundingClientRect().left,
          width: heroImage.getBoundingClientRect().width
        } : null
      },
      storeLinks: storeLinks.map((link) => ({
        href: link.getAttribute('href'),
        target: link.getAttribute('target'),
        badgeSrc: link.querySelector('img')?.getAttribute('src')
      })),
      googlePlayButtons: [...document.querySelectorAll('.kiri-store-badge--google')].map((button) => ({
        disabled: button.disabled,
        href: button.getAttribute('href'),
        text: button.textContent.trim(),
        badgeSrc: button.querySelector('img')?.getAttribute('src')
      })),
      showcase: {
        tabCount: document.querySelectorAll('.kiri-showcase__tabs [role="tab"]').length,
        selectedLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
        activeDescription: document.querySelector('.kiri-showcase__active-copy')?.textContent.trim(),
        cardCount: cards.length,
        cardWidths: cards.map((card) => card.getBoundingClientRect().width),
        visibleCardCount: cards.filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.left < carouselRect.right && rect.right > carouselRect.left;
        }).length,
        carouselDisplay: getComputedStyle(carousel).display,
        carouselOverflow: getComputedStyle(carousel).overflowX
      },
      hasPreregisterUi: Boolean(document.querySelector('#kiri-preregister, .kiri-form')),
      imageSources: [...document.querySelectorAll('img[src*="KakaoTalk_20261116_010517345"]')]
        .map((image) => image.getAttribute('src')),
      business: document.querySelector('.editorial-footer__business')?.textContent || ''
    };
  })()`,
);
assert(report.pages.kiriDesktop.path === "/kiri", "KIRI 페이지가 /kiri에 표시되지 않습니다.", failures);
assert(
  report.pages.kiriDesktop.title === "끼리(KIRI)",
  "KIRI 출시 페이지 제목이 올바르지 않습니다.",
  failures,
);
assert(report.pages.kiriDesktop.logoHref === "/kiri", "KIRI 로고 링크가 /kiri가 아닙니다.", failures);
assert(
  report.pages.kiriDesktop.faviconHref === "/images/kiri/kiri-logo.png",
  "KIRI 전용 PNG 파비콘이 연결되지 않았습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.backgroundColor === "rgb(26, 26, 26)",
  "KIRI 페이지 배경이 #1A1A1A가 아닙니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.heroHeading ===
    "가족과 함께할 활동을 찾고, 추억을 남겨요." &&
    report.pages.kiriDesktop.heroDescription.includes("약속부터 그날의 기록까지"),
  "KIRI 첫 화면 카피가 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.scrollWidth <= report.pages.kiriDesktop.innerWidth,
  "KIRI 데스크톱 화면에 페이지 가로 스크롤이 생겼습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.heroImage.src ===
    "/images/kiri/KakaoTalk_20261116_010517345.png" &&
    report.pages.kiriDesktop.heroImage.complete &&
    report.pages.kiriDesktop.heroImage.naturalWidth === 1620 &&
    report.pages.kiriDesktop.heroImage.naturalHeight === 2880 &&
    Math.abs(report.pages.kiriDesktop.heroImage.renderedRatio - 1620 / 2880) < 0.04 &&
    report.pages.kiriDesktop.heroImage.rect.width <= 340 &&
    report.pages.kiriDesktop.heroImage.rect.left < report.pages.kiriDesktop.innerWidth &&
    report.pages.kiriDesktop.heroImage.rect.top < 1000,
  "KIRI 대표 이미지가 원본 비율로 로드되지 않았습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.storeLinks.length === 1 &&
    report.pages.kiriDesktop.storeLinks.every(
      (link) =>
        link.href === "https://apps.apple.com/kr/app/%EB%81%BC%EB%A6%AC-kiri/id6835049058" &&
        link.target === "_blank" &&
        link.badgeSrc === "/images/badges/app-store-ko.svg",
    ),
  "KIRI App Store 링크 또는 공식 배지가 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.googlePlayButtons.length === 1 &&
    report.pages.kiriDesktop.googlePlayButtons.every(
      (button) =>
        button.disabled &&
        button.href === null &&
        button.text.includes("준비 중") &&
        button.badgeSrc === "/images/badges/google-play-ko.png",
    ),
  "KIRI Google Play 공식 배지가 링크 없이 비활성 상태로 표시되지 않습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.showcase.tabCount === 5 &&
    report.pages.kiriDesktop.showcase.selectedLabel.includes("홈") &&
    report.pages.kiriDesktop.showcase.activeDescription.includes("추천 미션") &&
    report.pages.kiriDesktop.showcase.cardCount === 5 &&
    report.pages.kiriDesktop.showcase.cardWidths.every((width) => width <= 300) &&
    report.pages.kiriDesktop.showcase.visibleCardCount >= 4 &&
    report.pages.kiriDesktop.showcase.carouselDisplay === "grid" &&
    report.pages.kiriDesktop.showcase.carouselOverflow === "auto",
  "KIRI 데스크톱 기능 미리보기가 컴팩트한 가로 갤러리로 표시되지 않습니다.",
  failures,
);
assert(!report.pages.kiriDesktop.hasPreregisterUi, "KIRI 사전예약 UI가 남아 있습니다.", failures);
assert(
  new Set(report.pages.kiriDesktop.imageSources).size === 6,
  "KIRI 소개 이미지 6장이 모두 페이지에 연결되지 않았습니다.",
  failures,
);
assert(
  report.pages.kiriDesktop.business.includes("624-21-02643"),
  "KIRI 푸터 사업자 정보가 누락됐습니다.",
  failures,
);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 240))`, true);
report.screenshots.push(await screenshot(client, "kiri-desktop-hero.png"));

await evaluate(
  client,
  `(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#kiri-features')?.scrollIntoView();
  })()`,
);
await waitForPaint(client);
report.pages.kiriDesktop.keyboard = await evaluate(
  client,
  `(async () => {
    const firstTab = document.querySelector('.kiri-showcase__tabs [role="tab"]');
    firstTab?.focus();
    firstTab?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 360));
    const carousel = document.querySelector('.kiri-showcase__carousel');
    return {
      selected: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      focused: document.activeElement?.textContent.trim(),
      activeDescription: document.querySelector('.kiri-showcase__active-copy')?.textContent.trim(),
      activeCardExists: Boolean(carousel?.querySelector('#kiri-feature-card-discovery'))
    };
  })()`,
  true,
);
assert(
  report.pages.kiriDesktop.keyboard.selected.includes("미션 둘러보기") &&
    report.pages.kiriDesktop.keyboard.focused.includes("미션 둘러보기") &&
    report.pages.kiriDesktop.keyboard.activeDescription.includes("활동을 찾아봐요") &&
    report.pages.kiriDesktop.keyboard.activeCardExists,
  "KIRI 기능 탭의 키보드 방향키 전환이 올바르지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-desktop-features.png"));

await navigate(client, "/kiri", 390, 844);
await waitForImages(client);
report.pages.kiriMobileHero = await evaluate(
  client,
  `(() => {
    const hero = document.querySelector('.kiri-hero');
    const visual = document.querySelector('.kiri-hero__visual');
    const image = visual?.querySelector('img');
    const imageRect = image?.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heroHeight: hero?.getBoundingClientRect().height,
      visualTop: visual?.getBoundingClientRect().top,
      imageTop: imageRect?.top,
      imageBottom: imageRect?.bottom,
      imageWidth: imageRect?.width,
      imageComplete: image?.complete
    };
  })()`,
);
report.screenshots.push(await screenshot(client, "kiri-mobile-hero.png"));
await evaluate(
  client,
  `(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#kiri-features')?.scrollIntoView();
  })()`,
);
await waitForPaint(client);
report.pages.kiriMobile = await evaluate(
  client,
  `(() => {
    const carousel = document.querySelector('.kiri-showcase__carousel');
    const cards = [...carousel.querySelectorAll('.kiri-showcase__card')];
    const carouselRect = carousel.getBoundingClientRect();
    const firstRect = cards[0].getBoundingClientRect();
    const secondRect = cards[1].getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      tabCount: document.querySelectorAll('.kiri-showcase__tabs [role="tab"]').length,
      tabHeights: [...document.querySelectorAll('.kiri-showcase__tabs [role="tab"]')]
        .map((tab) => tab.getBoundingClientRect().height),
      cardCount: cards.length,
      carouselOverflow: getComputedStyle(carousel).overflowX,
      carouselWidth: carouselRect.width,
      firstCardWidth: firstRect.width,
      nextCardVisible: secondRect.left < carouselRect.right,
      activeLabel: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      googlePlayDisabled: [...document.querySelectorAll('.kiri-store-badge--google')]
        .every((button) => button.disabled && !button.getAttribute('href'))
    };
  })()`,
);
assert(
  report.pages.kiriMobile.scrollWidth <= report.pages.kiriMobile.innerWidth,
  "KIRI 모바일 페이지에 전체 가로 스크롤이 생겼습니다.",
  failures,
);
assert(
  report.pages.kiriMobile.tabCount === 5 &&
    report.pages.kiriMobile.tabHeights.every((height) => height >= 44),
  "KIRI 모바일 기능 버튼의 개수 또는 터치 영역이 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.kiriMobile.cardCount === 5 &&
    report.pages.kiriMobile.carouselOverflow === "auto" &&
    report.pages.kiriMobile.firstCardWidth < report.pages.kiriMobile.carouselWidth &&
    report.pages.kiriMobile.nextCardVisible,
  "KIRI 모바일 스와이프 영역에서 다음 카드가 보이지 않습니다.",
  failures,
);
assert(
  report.pages.kiriMobile.activeLabel.includes("홈") &&
    report.pages.kiriMobile.googlePlayDisabled,
  "KIRI 모바일 초기 선택 또는 Google Play 비활성 상태가 올바르지 않습니다.",
  failures,
);

report.pages.kiriMobile.swipe = await evaluate(
  client,
  `(async () => {
    const carousel = document.querySelector('.kiri-showcase__carousel');
    const cards = [...carousel.querySelectorAll('.kiri-showcase__card')];
    const carouselBounds = carousel.getBoundingClientRect();
    const secondCardBounds = cards[1].getBoundingClientRect();
    carousel.style.scrollBehavior = 'auto';
    carousel.scrollTo({
      left: carousel.scrollLeft + secondCardBounds.left - carouselBounds.left,
      behavior: 'auto'
    });
    carousel.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      selected: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      scrollLeft: carousel.scrollLeft
    };
  })()`,
  true,
);
assert(
  report.pages.kiriMobile.swipe.selected.includes("미션 둘러보기") &&
    report.pages.kiriMobile.swipe.scrollLeft > 0,
  "KIRI 모바일 스와이프 후 활성 기능 버튼이 다음 카드로 동기화되지 않습니다.",
  failures,
);

await evaluate(
  client,
  `document.querySelectorAll('.kiri-showcase__tabs [role="tab"]')[3]?.click()`,
);
await evaluate(client, `new Promise((resolve) => setTimeout(resolve, 320))`, true);
report.pages.kiriMobile.buttonNavigation = await evaluate(
  client,
  `(() => {
    const carousel = document.querySelector('.kiri-showcase__carousel');
    return {
      selected: document.querySelector('.kiri-showcase__tabs [aria-selected="true"]')?.textContent.trim(),
      scrollLeft: carousel.scrollLeft
    };
  })()`,
);
assert(
  report.pages.kiriMobile.buttonNavigation.selected.includes("미션 초대") &&
    report.pages.kiriMobile.buttonNavigation.scrollLeft > 0,
  "KIRI 모바일 기능 버튼이 해당 카드로 이동하지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-mobile-features.png"));

await client.send("Emulation.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
});
await navigate(client, "/invite/test-family-token", 390, 844);
await waitForImages(client);
report.pages.inviteMobile = await evaluate(
  client,
  `(() => {
    const card = document.querySelector('.invite-card');
    const cardRect = card?.getBoundingClientRect();
    const storeLinks = [...document.querySelectorAll('.invite-store-link[href]')];
    const metadata = Object.fromEntries([
      ['robots', document.querySelector('meta[name="robots"]')?.content],
      ['referrer', document.querySelector('meta[name="referrer"]')?.content],
      ['canonical', document.querySelector('link[rel="canonical"]')?.href],
      ['ogUrl', document.querySelector('meta[property="og:url"]')?.content],
      ['ogDescription', document.querySelector('meta[property="og:description"]')?.content],
    ]);

    return {
      pathname: location.pathname,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      cardLeft: cardRect?.left,
      cardRight: cardRect?.right,
      title: document.querySelector('h1')?.textContent.trim(),
      description: document.querySelector('.invite-card__description')?.textContent.trim(),
      openButtonText: document.querySelector('.invite-open-button')?.textContent.trim(),
      openButtonHref: document.querySelector('.invite-open-button')?.getAttribute('href'),
      storeHrefs: storeLinks.map((link) => link.getAttribute('href')),
      googlePlayText: document.querySelector('.invite-store-link--disabled')?.textContent.trim(),
      helpText: document.querySelector('.invite-card__help')?.textContent.trim(),
      gaScriptPresent: Boolean(document.querySelector('#halo-ga4-script')),
      metadata,
    };
  })()`,
);
assert(
  report.pages.inviteMobile.pathname === "/invite/test-family-token" &&
    report.pages.inviteMobile.scrollWidth <= report.pages.inviteMobile.innerWidth &&
    report.pages.inviteMobile.cardLeft >= 16 &&
    report.pages.inviteMobile.cardRight <= report.pages.inviteMobile.innerWidth - 16,
  "초대 페이지가 모바일에서 직접 열리거나 화면 너비 안에 맞지 않습니다.",
  failures,
);
assert(
  report.pages.inviteMobile.title === "가족 초대가 도착했어요" &&
    report.pages.inviteMobile.description ===
      "끼리 앱에서 초대를 확인하고 가족 공간에 참여해 보세요." &&
    report.pages.inviteMobile.openButtonText.includes("끼리 앱에서 열기") &&
    report.pages.inviteMobile.openButtonHref === "kiri://invite/test-family-token" &&
    report.pages.inviteMobile.googlePlayText.includes("Google Play 다운로드 준비 중") &&
    report.pages.inviteMobile.helpText ===
      "앱을 설치한 뒤, 받은 초대 링크를 다시 눌러 주세요.",
  "초대 페이지의 안내 문구 또는 앱 열기 동작이 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.inviteMobile.storeHrefs.length === 1 &&
    report.pages.inviteMobile.storeHrefs[0] ===
      "https://apps.apple.com/kr/app/%EB%81%BC%EB%A6%AC-kiri/id6835049058" &&
    report.pages.inviteMobile.storeHrefs.every(
      (href) => !href.includes("test-family-token"),
    ),
  "초대 토큰이 스토어 링크에 포함됐거나 App Store 링크가 올바르지 않습니다.",
  failures,
);
assert(
  report.pages.inviteMobile.metadata.robots === "noindex, nofollow, noarchive" &&
    report.pages.inviteMobile.metadata.referrer === "no-referrer" &&
    report.pages.inviteMobile.metadata.canonical ===
      "https://www.halo-official.co.kr/invite" &&
    report.pages.inviteMobile.metadata.ogUrl ===
      "https://www.halo-official.co.kr/invite" &&
    !JSON.stringify(report.pages.inviteMobile.metadata).includes(
      "test-family-token",
    ) &&
    !report.pages.inviteMobile.gaScriptPresent,
  "초대 페이지의 비공개 메타데이터 또는 분석 제외 설정이 올바르지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-invite-mobile.png"));

await reload(client);
report.pages.inviteReload = await evaluate(
  client,
  `(() => ({
    pathname: location.pathname,
    title: document.querySelector('h1')?.textContent.trim(),
    openButtonHref: document.querySelector('.invite-open-button')?.getAttribute('href'),
  }))()`,
);
assert(
  report.pages.inviteReload.pathname === "/invite/test-family-token" &&
    report.pages.inviteReload.title === "가족 초대가 도착했어요" &&
    report.pages.inviteReload.openButtonHref ===
      "kiri://invite/test-family-token",
  "초대 URL을 새로고침한 뒤 iOS 앱 열기 링크가 유지되지 않습니다.",
  failures,
);

await client.send("Emulation.setUserAgentOverride", {
  userAgent:
    "Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 Chrome/158.0.0.0 Mobile Safari/537.36",
  platform: "Android",
});
await navigate(client, "/invite/android-test-token", 390, 844);
report.pages.inviteAndroid = await evaluate(
  client,
  `(() => ({
    pathname: location.pathname,
    openButtonHref: document.querySelector('.invite-open-button')?.getAttribute('href'),
    storeHrefs: [...document.querySelectorAll('.invite-store-link[href]')]
      .map((link) => link.getAttribute('href')),
  }))()`,
);
assert(
  report.pages.inviteAndroid.pathname === "/invite/android-test-token" &&
    report.pages.inviteAndroid.openButtonHref ===
      "https://kiri.app/invite/android-test-token" &&
    report.pages.inviteAndroid.storeHrefs.every(
      (href) => !href.includes("android-test-token"),
    ),
  "Android 앱 열기 주소가 현재 앱 지원 경로를 사용하지 않거나 토큰이 스토어 링크에 포함됐습니다.",
  failures,
);

await navigate(client, "/invite/", 390, 844);
report.pages.inviteInvalid = await evaluate(
  client,
  `(() => ({
    pathname: location.pathname,
    message: document.querySelector('[role="alert"]')?.textContent.trim(),
    hasOpenButton: Boolean(document.querySelector('.invite-open-button')),
    hasAppStoreLink: Boolean(document.querySelector('.invite-store-link[href]')),
  }))()`,
);
assert(
  report.pages.inviteInvalid.pathname === "/invite/" &&
    report.pages.inviteInvalid.message ===
      "가족에게 받은 초대 링크 전체를 다시 열어 주세요" &&
    !report.pages.inviteInvalid.hasOpenButton &&
    report.pages.inviteInvalid.hasAppStoreLink,
  "비어 있거나 잘못된 초대 링크 안내가 올바르지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "kiri-invite-invalid.png"));

for (const error of runtimeErrors) failures.push(`브라우저 런타임 오류: ${error}`);
report.failures = failures;

console.log(JSON.stringify(report, null, 2));
client.close();
if (failures.length > 0) process.exitCode = 1;
