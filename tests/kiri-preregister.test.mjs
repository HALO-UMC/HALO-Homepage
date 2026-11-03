import assert from "node:assert/strict";
import test from "node:test";

import {
  createPreregisterHandler,
  getConfiguration,
  default as defaultPreregisterHandler,
} from "../api/kiri-preregister.js";
import defaultStatusHandler, {
  createStatusHandler,
} from "../api/kiri-preregister-status.js";
import { KIRI_PREREGISTRATION_POLICY } from "../api/kiri-policy.js";

const TEST_POLICY = Object.freeze({
  ...KIRI_PREREGISTRATION_POLICY,
  policyVersion: "test-policy-v1",
  retentionLabel: "테스트 종료 즉시 삭제",
});
const preregisterHandler = createPreregisterHandler({ policy: TEST_POLICY });
const statusHandler = createStatusHandler({ policy: TEST_POLICY });

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "KIRI_PREREGISTER_TABLE",
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
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test-key";
  process.env.KIRI_PREREGISTER_TABLE = "kiri_preregistrations";
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
  assert.equal(status.json.policy.dataControllerName, "할로(HALO)");
  assert.equal(status.json.policy.retentionLabel, TEST_POLICY.retentionLabel);

  const submission = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.2" }),
  );
  assert.equal(submission.status, 503);
  assert.equal(submission.json.ok, false);
});

test("보유 기간이 비어 있어도 정책과 Supabase 연결이 있으면 접수할 수 있다", async () => {
  setReadyEnvironment();
  assert.equal(KIRI_PREREGISTRATION_POLICY.retentionLabel, null);
  assert.ok(getConfiguration());

  let storedRecord;
  globalThis.fetch = async (_url, options) => {
    if (options.method === "GET") {
      return { ok: true, status: 200, json: async () => [] };
    }

    storedRecord = JSON.parse(options.body);
    return { ok: true, status: 201, json: async () => [{ id: "row-no-retention" }] };
  };

  const status = await call(defaultStatusHandler, createRequest({ method: "GET" }));
  assert.equal(status.json.ready, true);
  assert.equal(status.json.policy.retentionLabel, null);

  const submission = await call(
    defaultPreregisterHandler,
    createRequest({ ip: "198.51.100.21" }),
  );
  assert.equal(submission.status, 201);
  assert.equal(storedRecord.privacy_retention_label, null);
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

test("새 Secret key는 apikey로만 전달하고 저장 성공 뒤에만 완료 처리한다", async () => {
  setReadyEnvironment();
  let storedRecord;
  let requestHeaders;
  globalThis.fetch = async (_url, options) => {
    requestHeaders = options.headers;
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
  assert.equal(requestHeaders.apikey, "sb_secret_test-key");
  assert.equal(requestHeaders.Authorization, undefined);
  assert.equal(storedRecord.email_normalized, "test.user@example.com");
  assert.equal(storedRecord.privacy_consent_version, "test-policy-v1");
  assert.equal(storedRecord.data_controller_name, KIRI_PREREGISTRATION_POLICY.dataControllerName);
  assert.equal(
    storedRecord.data_controller_representative,
    KIRI_PREREGISTRATION_POLICY.dataControllerRepresentative,
  );
  assert.equal(storedRecord.privacy_retention_label, "테스트 종료 즉시 삭제");
  assert.match(storedRecord.privacy_agreed_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("기존 service_role 설정도 이전과 같이 사용할 수 있다", async () => {
  setReadyEnvironment();
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-service-role-test-key";
  let requestHeaders;
  globalThis.fetch = async (_url, options) => {
    requestHeaders = options.headers;
    return { ok: true, status: 201, json: async () => [{ id: "row-legacy" }] };
  };

  const result = await call(
    preregisterHandler,
    createRequest({ ip: "198.51.100.20" }),
  );

  assert.equal(result.status, 201);
  assert.equal(requestHeaders.apikey, "legacy-service-role-test-key");
  assert.equal(requestHeaders.Authorization, "Bearer legacy-service-role-test-key");
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
  let requestHeaders;
  globalThis.fetch = async (_url, options) => {
    requestHeaders = options.headers;
    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  };

  const result = await call(statusHandler, createRequest({ method: "GET" }));
  assert.equal(result.status, 200);
  assert.equal(result.json.ready, true);
  assert.equal(result.json.policy.policyVersion, "test-policy-v1");
  assert.equal(result.json.policy.dataControllerName, "할로(HALO)");
  assert.equal(result.json.policy.collectionItems, TEST_POLICY.collectionItems);
  assert.equal(result.json.policy.retentionLabel, "테스트 종료 즉시 삭제");
  assert.equal(requestHeaders.apikey, "sb_secret_test-key");
  assert.equal(requestHeaders.Authorization, undefined);
});
