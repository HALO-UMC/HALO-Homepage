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
  if (request.url.includes("/api/kiri-preregister")) apiRequests.push(request.url);
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
    return {
      path: location.pathname,
      title: document.title,
      hero: Boolean(document.querySelector('#company-hero-title')),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      haloHref: document.querySelector('.service-feature--halo a')?.getAttribute('href'),
      kiriHref: document.querySelector('.service-feature--kiri a')?.getAttribute('href'),
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
assert(report.pages.companyDesktop.haloHref === "/halo", "HALO 서비스 링크가 /halo가 아닙니다.", failures);
assert(report.pages.companyDesktop.kiriHref === "/kiri", "KIRI 서비스 링크가 /kiri가 아닙니다.", failures);
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
report.pages.companyDesktop.serviceInteraction = await evaluate(
  client,
  `(async () => {
    const haloLink = document.querySelector('.service-feature--halo a');
    const kiriLink = document.querySelector('.service-feature--kiri a');
    const haloImage = document.querySelector('.service-feature__visual--halo > img');
    const kiriImage = document.querySelector('.service-feature__kiri-screen');
    const haloInitialTransform = getComputedStyle(haloImage).transform;
    haloLink?.focus();
    await new Promise((resolve) => setTimeout(resolve, 280));
    const haloFocusedTransform = getComputedStyle(haloImage).transform;
    const haloFocused = document.activeElement === haloLink;
    const kiriInitialTransform = getComputedStyle(kiriImage).transform;
    kiriLink?.focus();
    await new Promise((resolve) => setTimeout(resolve, 280));
    return {
      haloFocused,
      kiriFocused: document.activeElement === kiriLink,
      haloMoved: haloInitialTransform !== haloFocusedTransform,
      kiriMoved: kiriInitialTransform !== getComputedStyle(kiriImage).transform,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  })()`,
  true,
);
assert(
  report.pages.companyDesktop.serviceInteraction.haloFocused &&
    report.pages.companyDesktop.serviceInteraction.kiriFocused,
  "기업 서비스 전체 링크에 키보드 포커스를 이동할 수 없습니다.",
  failures,
);
assert(
  (report.pages.companyDesktop.serviceInteraction.haloMoved &&
    report.pages.companyDesktop.serviceInteraction.kiriMoved) ||
    report.pages.companyDesktop.serviceInteraction.reducedMotion,
  "기업 서비스 포커스 시 이미지 피드백이 적용되지 않습니다.",
  failures,
);
report.screenshots.push(await screenshot(client, "company-desktop.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#services'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-services-desktop.png"));
await evaluate(client, `(() => { const target = document.querySelector('.service-feature--kiri'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-desktop.png"));

await navigate(client, "/", 390, 844);
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
report.screenshots.push(await screenshot(client, "company-services-mobile.png"));
await evaluate(client, `(() => { const target = document.querySelector('.service-feature--kiri'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "company-kiri-service-mobile.png"));

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
assert(
  report.pages.kiriDesktop.images.every(
    (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && image.ratioDifference < 0.04,
  ),
  "KIRI 실제 자산 중 로드 또는 비율이 올바르지 않은 이미지가 있습니다.",
  failures,
);
assert(report.pages.kiriDesktop.form.visible, "서버 설정 없이 KIRI 폼 UI가 표시되지 않습니다.", failures);
assert(report.pages.kiriDesktop.form.email && report.pages.kiriDesktop.form.nickname, "KIRI 폼 입력란이 누락됐습니다.", failures);
assert(report.pages.kiriDesktop.form.deviceCount === 4, "KIRI 사용 기기 선택지가 4개가 아닙니다.", failures);
assert(report.pages.kiriDesktop.form.trial && report.pages.kiriDesktop.form.privacy, "KIRI 선택·동의 UI가 누락됐습니다.", failures);
assert(report.pages.kiriDesktop.form.disabled, "KIRI 제출 버튼이 비활성화되지 않았습니다.", failures);
assert(report.pages.kiriDesktop.form.buttonText === "접수 준비 중", "KIRI 비활성 버튼 문구가 올바르지 않습니다.", failures);
assert(report.pages.kiriDesktop.form.preparing.includes("접수가 시작되면 이 페이지에서 신청할 수 있어요"), "KIRI 준비 안내 문구가 누락됐습니다.", failures);
assert(report.pages.kiriDesktop.business.includes("624-21-02643"), "KIRI 푸터 사업자 정보가 누락됐습니다.", failures);
report.screenshots.push(await screenshot(client, "kiri-desktop-hero.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-experience'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "kiri-desktop-experience.png"));
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
    phoneWidths: [...document.querySelectorAll('.kiri-phone img')].map((image) => image.getBoundingClientRect().width)
  })`,
);
assert(report.pages.kiriMobile.scrollWidth <= 390, "KIRI 모바일 화면에 가로 넘침이 있습니다.", failures);
assert(report.pages.kiriMobile.formVisible, "KIRI 모바일에서 폼 UI가 표시되지 않습니다.", failures);
assert(report.pages.kiriMobile.phoneWidths.every((width) => width >= 260), "KIRI 모바일 앱 화면이 지나치게 작습니다.", failures);
report.screenshots.push(await screenshot(client, "kiri-mobile-hero.png"));
await evaluate(client, `(() => { document.documentElement.style.scrollBehavior = 'auto'; const target = document.querySelector('#kiri-preregister'); if (target) window.scrollTo(0, target.offsetTop); })()`);
await waitForPaint(client);
report.screenshots.push(await screenshot(client, "kiri-mobile-form.png"));

for (const error of runtimeErrors) failures.push(`브라우저 런타임 오류: ${error}`);
report.failures = failures;

console.log(JSON.stringify(report, null, 2));
client.close();
if (failures.length > 0) process.exitCode = 1;
