import process from "node:process";

const chromePort = process.env.CHROME_DEBUG_PORT || "9223";
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
const providers = (process.env.QA_ANALYTICS_PROVIDERS || "common,ga4,hackle").split(",");
if (providers.some((provider) => !["common", "ga4", "hackle"].includes(provider))) {
  throw new Error("QA_ANALYTICS_PROVIDERS must contain common, ga4, or hackle.");
}

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
  if (!response.ok) {
    throw new Error(`Chrome debugging endpoint returned ${response.status}`);
  }
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

async function navigate(client, pathname, width = 1280, height = 800) {
  await setViewport(client, width, height);
  const loaded = client.once("Page.loadEventFired");
  const separator = pathname.includes("?") ? "&" : "?";
  await client.send("Page.navigate", {
    url: `${baseUrl}${pathname}${separator}analytics_qa=1`,
  });
  await loaded;
  await waitFor(client, "document.querySelector('#root')?.firstElementChild");
}

async function waitFor(client, condition, timeout = 5000) {
  const result = await evaluate(
    client,
    `new Promise((resolve) => {
      const started = performance.now();
      const check = () => {
        if (${condition}) return resolve(true);
        if (performance.now() - started > ${timeout}) return resolve(false);
        requestAnimationFrame(check);
      };
      check();
    })`,
    true,
  );
  if (!result) throw new Error(`Timed out waiting for: ${condition}`);
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function progress(message) {
  console.error(`[analytics-smoke] ${message}`);
}

async function analyticsEvents(client) {
  await evaluate(client, "new Promise((resolve) => setTimeout(resolve, 250))", true);
  return evaluate(
    client,
    `window.__HALO_ANALYTICS_TEST_EVENTS__ || []`,
  );
}

function countEvent(events, provider, name) {
  return events.filter(
    (event) => event.provider === provider && event.name === name,
  ).length;
}

function pageSequence(events, provider) {
  return events
    .filter((event) => event.provider === provider && event.name === "page_view")
    .map((event) => event.properties.page_name);
}

const tab = await createTab();
const client = new CdpClient(tab.webSocketDebuggerUrl);
const runtimeErrors = [];
const failures = [];
const report = { direct: {}, journey: {}, store: {}, runtimeErrors, failures };

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

await client.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__HALO_ANALYTICS_TEST__ = true;
    window.__HALO_ANALYTICS_TEST_EVENTS__ = [];
  `,
});

for (const [pathname, pageName] of [
  ["/", "company"],
  ["/halo", "halo"],
  ["/kiri", "kiri"],
]) {
  progress(`${pageName} 직접 진입 검증`);
  await navigate(client, pathname);
  const events = await analyticsEvents(client);
  report.direct[pageName] = events;
  for (const provider of providers) {
    assert(
      pageSequence(events, provider).join(",") === pageName,
      `${provider} ${pageName} 직접 진입 page_view가 1건이 아닙니다.`,
      failures,
    );
  }
}

progress("내부 이동 및 브라우저 기록 검증");
await navigate(client, "/");
await evaluate(client, `document.querySelector('.company-hero__cta')?.click()`);
await waitFor(client, "location.hash === '#services'");
await evaluate(client, "history.back()");
await waitFor(client, "location.pathname === '/' && location.hash === ''");
await evaluate(
  client,
  `document.querySelector('.service-feature__page-button--kiri')?.click()`,
);
await waitFor(client, "location.pathname === '/kiri'");
await evaluate(client, "history.back()");
await waitFor(client, "location.pathname === '/'");
await evaluate(client, "history.forward()");
await waitFor(client, "location.pathname === '/kiri'");
report.journey.events = await analyticsEvents(client);

for (const provider of providers) {
  assert(
    pageSequence(report.journey.events, provider).join(",") ===
      "company,kiri,company,kiri",
    `${provider} 내부 이동/뒤로/앞으로 page_view 순서가 올바르지 않습니다.`,
    failures,
  );
  assert(
    countEvent(report.journey.events, provider, "click_service") === 1,
    `${provider} 끼리 서비스 링크 이벤트가 1건이 아닙니다.`,
    failures,
  );
}

progress("데스크톱 및 모바일 스토어 클릭 검증");
await navigate(client, "/", 1440, 1000);
await evaluate(
  client,
  `(() => {
    const link = document.querySelector('.halo-legacy .service-feature__store-badge');
    link?.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link?.click();
  })()`,
);
report.store.companyDesktop = await analyticsEvents(client);

await navigate(client, "/halo", 390, 844);
await evaluate(
  client,
  `(() => {
    const link = document.querySelector('a[href*="play.google.com"]');
    link?.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link?.click();
  })()`,
);
report.store.haloMobile = await analyticsEvents(client);

await navigate(client, "/kiri", 390, 844);
await evaluate(
  client,
  `(() => {
    const link = document.querySelector('.kiri-hero .kiri-store-badge--apple');
    link?.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link?.click();
  })()`,
);
report.store.kiriMobile = await analyticsEvents(client);

for (const [label, events] of Object.entries(report.store)) {
  for (const provider of providers) {
    assert(
      countEvent(events, provider, "click_app_store") === 1,
      `${provider} ${label} 스토어 클릭 이벤트가 1건이 아닙니다.`,
      failures,
    );
  }
}

for (const error of runtimeErrors) failures.push(`브라우저 런타임 오류: ${error}`);

console.log(JSON.stringify(report, null, 2));
client.close();
if (failures.length > 0) process.exitCode = 1;
