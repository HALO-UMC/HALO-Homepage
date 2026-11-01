import assert from "node:assert/strict";
import test from "node:test";

import preregisterHandler from "../api/kiri-preregister.js";
import statusHandler from "../api/kiri-preregister-status.js";

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "KIRI_PREREGISTER_TABLE",
  "KIRI_PRIVACY_POLICY_VERSION",
  "KIRI_DATA_CONTROLLER_NAME",
  "KIRI_PRIVACY_RETENTION_LABEL",
  "KIRI_ALLOWED_ORIGINS",
  "KIRI_ALLOWED_ORIGIN",
  "KIRI_RATE_LIMIT_SALT",
];

const originalEnvironment = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const originalFetch = globalThis.fetch;

function clearEnvironment() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

function setReadyEnvironment() {
  process.env.SUPABASE_URL = "https://project.example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-secret-test-value";
  process.env.KIRI_PREREGISTER_TABLE = "kiri_preregistrations";
  process.env.KIRI_PRIVACY_POLICY_VERSION = "test-policy-v1";
  process.env.KIRI_DATA_CONTROLLER_NAME = "테스트 운영 주체";
  process.env.KIRI_PRIVACY_RETENTION_LABEL = "테스트 종료 즉시 삭제";
  process.env.KIRI_RATE_LIMIT_SALT = "test-rate-limit-salt";
}

function validBody(overrides = {}) {
  return {
    email: " Test.User@Example.com ",
    nickname: "테스터",
    device: "both",
    familyTrial: true,
    privacyAgreed: true,
    company: "",
    ...overrides,
  };
}

function createRequest({ method = "POST", body = validBody(), ip = "198.51.100.1" } = {}) {
  return {
    method,
    body,
    headers: {
      host: "localhost:3000",
      "x-forwarded-for": ip,
    },
    socket: { remoteAddress: ip },
  };
}

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(name.toLowerCase());
    },
    end(body = "") {
      this.body = body;
    },
  };
}

async function call(handler, request) {
  const response = createResponse();
  await handler(request, response);
  return {
    status: response.statusCode,
    headers: response,
    json: response.body ? JSON.parse(response.body) : null,
  };
}

test.beforeEach(() => {
  clearEnvironment();
  globalThis.fetch = originalFetch;
});

test.after(() => {
  clearEnvironment();
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
  globalThis.fetch = originalFetch;
});

test("필수 설정이 없으면 상태 API와 제출 API가 준비되지 않음으로 응답한다", async () => {
  const status = await call(statusHandler, createRequest({ method: "GET" }));
  assert.equal(status.status, 200);
  assert.equal(status.json.ready, false);
  assert.equal(status.json.reason, "configuration");

  const submission = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.2" }),
  );
  assert.equal(submission.status, 503);
  assert.equal(submission.json.ok, false);
});

test("잘못된 이메일과 필수 동의 누락을 각각 거절한다", async () => {
  const invalidEmail = await call(
    preregisterHandler,
    createRequest({ body: validBody({ email: "invalid" }), ip: "198.51.100.3" }),
  );
  assert.equal(invalidEmail.status, 400);
  assert.equal(invalidEmail.json.field, "email");

  const missingConsent = await call(
    preregisterHandler,
    createRequest({ body: validBody({ privacyAgreed: false }), ip: "198.51.100.4" }),
  );
  assert.equal(missingConsent.status, 400);
  assert.equal(missingConsent.json.field, "privacyAgreed");
});

test("정상 접수는 정규화 값과 동의 정보를 저장한 뒤에만 성공한다", async () => {
  setReadyEnvironment();
  let storedRecord;
  globalThis.fetch = async (_url, options) => {
    storedRecord = JSON.parse(options.body);
    return {
      ok: true,
      status: 201,
      json: async () => [{ id: "row-1" }],
    };
  };

  const result = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.5" }),
  );

  assert.equal(result.status, 201);
  assert.deepEqual(result.json, { ok: true, status: "created" });
  assert.equal(storedRecord.email_normalized, "test.user@example.com");
  assert.equal(storedRecord.privacy_consent_version, "test-policy-v1");
  assert.equal(storedRecord.data_controller_name, "테스트 운영 주체");
  assert.equal(storedRecord.privacy_retention_label, "테스트 종료 즉시 삭제");
  assert.match(storedRecord.privacy_agreed_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("DB unique 충돌은 일반 저장 오류와 구분해 duplicate로 응답한다", async () => {
  setReadyEnvironment();
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ code: "23505" }),
  });

  const result = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.6" }),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.json, { ok: true, status: "duplicate" });
});

test("DB 연결 실패 후 입력을 유지한 재시도 요청은 성공할 수 있다", async () => {
  setReadyEnvironment();
  globalThis.fetch = async () => {
    throw new Error("mock connection failure");
  };

  const failed = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.7" }),
  );
  assert.equal(failed.status, 503);

  globalThis.fetch = async () => ({
    ok: true,
    status: 201,
    json: async () => [{ id: "row-2" }],
  });
  const retried = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.8" }),
  );
  assert.equal(retried.status, 201);
  assert.equal(retried.json.status, "created");
});

test("같은 인스턴스의 연속 요청은 기본 속도 제한으로 차단한다", async () => {
  const ip = "198.51.100.9";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await call(
      preregisterHandler,
      createRequest({ body: validBody({ email: "invalid" }), ip }),
    );
    assert.equal(result.status, 400);
  }

  const limited = await call(
    preregisterHandler,
    createRequest({ body: validBody({ email: "invalid" }), ip }),
  );
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.getHeader("retry-after")) > 0);
});

test("상태 API는 저장소 접근을 확인한 경우에만 폼을 준비 상태로 연다", async () => {
  setReadyEnvironment();
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => [],
  });

  const result = await call(statusHandler, createRequest({ method: "GET" }));
  assert.equal(result.status, 200);
  assert.equal(result.json.ready, true);
  assert.equal(result.json.policy.policyVersion, "test-policy-v1");
  assert.equal(result.json.policy.retentionLabel, "테스트 종료 즉시 삭제");
});
