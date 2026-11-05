import process from "node:process";

const chromePort = process.env.CHROME_DEBUG_PORT || "9223";
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:5173";

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
const report = { direct: {}, journey: {}, store: {}, form: {}, runtimeErrors, failures };

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
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
      const mode = sessionStorage.getItem('__halo_kiri_api_mode');
      if (!mode) return nativeFetch(input, init);

      if (url.pathname === '/api/kiri-preregister-status') {
        return new Response(JSON.stringify({
          ready: true,
          policy: {
            policyVersion: 'analytics-browser-test-v1',
            dataControllerName: 'HALO test',
            retentionLabel: '테스트 종료 즉시 삭제'
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.pathname === '/api/kiri-preregister' && (init.method || 'GET').toUpperCase() === 'POST') {
        if (mode === 'created') {
          return new Response(JSON.stringify({ ok: true, status: 'created' }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (mode === 'duplicate') {
          return new Response(JSON.stringify({ ok: true, status: 'duplicate' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ ok: false, message: 'mock failure' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return nativeFetch(input, init);
    };
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
  for (const provider of ["common", "ga4", "hackle"]) {
    assert(
      pageSequence(events, provider).join(",") === pageName,
      `${provider} ${pageName} 직접 진입 page_view가 1건이 아닙니다.`,
      failures,
    );
  }
}

progress("내부 이동 및 브라우저 기록 검증");
await navigate(client, "/");
await evaluate(
  client,
  `document.querySelector('.service-feature__page-button--kiri')?.click()`,
);
await waitFor(client, "location.pathname === '/kiri'");
await evaluate(client, `document.querySelector('.kiri-primary-button')?.click()`);
await waitFor(client, "location.hash === '#kiri-preregister'");
await evaluate(client, "history.back()");
await waitFor(client, "location.pathname === '/kiri' && location.hash === ''");
await evaluate(client, "history.back()");
await waitFor(client, "location.pathname === '/'");
await evaluate(client, "history.forward()");
await waitFor(client, "location.pathname === '/kiri'");
report.journey.events = await analyticsEvents(client);

for (const provider of ["common", "ga4", "hackle"]) {
  assert(
    pageSequence(report.journey.events, provider).join(",") ===
      "company,kiri,company,kiri",
    `${provider} 내부 이동/뒤로/앞으로 page_view 순서가 올바르지 않습니다.`,
    failures,
  );
  assert(
    countEvent(report.journey.events, provider, "click_preregister") === 1,
    `${provider} KIRI 해시 CTA 이벤트가 1건이 아닙니다.`,
    failures,
  );
}

progress("데스크톱 및 모바일 스토어 클릭 검증");
await navigate(client, "/", 1440, 1000);
await evaluate(
  client,
  `(() => {
    const link = document.querySelector('.service-feature__store-badge');
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

for (const [label, events] of Object.entries(report.store)) {
  for (const provider of ["common", "ga4", "hackle"]) {
    assert(
      countEvent(events, provider, "click_app_store") === 1,
      `${provider} ${label} 스토어 클릭 이벤트가 1건이 아닙니다.`,
      failures,
    );
  }
}

async function runFormScenario(mode, width, height) {
  progress(`${mode} 사전예약 응답 검증`);
  await evaluate(
    client,
    `sessionStorage.setItem('__halo_kiri_api_mode', ${JSON.stringify(mode)})`,
  );
  await navigate(client, "/kiri", width, height);
  await waitFor(client, "document.querySelector('.kiri-submit')?.disabled === false");
  await evaluate(
    client,
    `(async () => {
      const input = document.querySelector('#kiri-email');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'analytics-browser@example.test');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('input[name="device"][value="android"]')?.click();
      document.querySelector('input[name="privacyAgreed"]')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      document.querySelector('.kiri-form')?.requestSubmit();
    })()`,
    true,
  );

  if (mode === "created" || mode === "duplicate") {
    await waitFor(client, "document.querySelector('.kiri-form-complete')");
  } else {
    await waitFor(client, "document.querySelector('.kiri-form__notice')");
  }

  return analyticsEvents(client);
}

report.form.createdDesktop = await runFormScenario("created", 1440, 1000);
report.form.duplicateMobile = await runFormScenario("duplicate", 390, 844);
report.form.failureMobile = await runFormScenario("failure", 390, 844);

for (const provider of ["common", "ga4", "hackle"]) {
  assert(
    countEvent(report.form.createdDesktop, provider, "start_preregister") === 1,
    `${provider} 신규 접수의 start_preregister가 1건이 아닙니다.`,
    failures,
  );
  assert(
    countEvent(report.form.createdDesktop, provider, "complete_preregister") === 1,
    `${provider} 신규 접수의 complete_preregister가 1건이 아닙니다.`,
    failures,
  );
  assert(
    countEvent(report.form.duplicateMobile, provider, "complete_preregister") === 0,
    `${provider} 중복 접수에서 complete_preregister가 발생했습니다.`,
    failures,
  );
  assert(
    countEvent(report.form.failureMobile, provider, "complete_preregister") === 0,
    `${provider} 실패 접수에서 complete_preregister가 발생했습니다.`,
    failures,
  );
}

assert(
  !JSON.stringify(report.form).includes("analytics-browser@example.test"),
  "분석 이벤트에 폼 이메일이 포함됐습니다.",
  failures,
);

for (const error of runtimeErrors) failures.push(`브라우저 런타임 오류: ${error}`);

console.log(JSON.stringify(report, null, 2));
client.close();
if (failures.length > 0) process.exitCode = 1;
