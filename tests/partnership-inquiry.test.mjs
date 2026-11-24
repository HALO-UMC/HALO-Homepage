import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import test from "node:test";
import handler from "../api/partnership-inquiry.js";

const origin = "https://halo.example";
const identity = { company: "업체", contact: "담당자" };
const data = {
  id: randomUUID(),
  values: { ...identity, email: " USER@EXAMPLE.COM ", industry: "제거 대상" },
  types: ["공동 프로그램·마케팅", "체험·공간 입점"],
  honeypot: "",
  consent: true,
  version: "qa-1",
};
const configuration = {
  HALO_PARTNERSHIP_ORIGIN: origin,
  HALO_PARTNERSHIP_RATE_SALT: "test-only-secret-value-at-least-32-chars",
  HALO_PARTNERSHIP_POLICY_VERSION: "qa-1",
  HALO_PARTNERSHIP_RETENTION_DAYS: "30",
  SUPABASE_URL: "https://supabase.example",
  SUPABASE_SECRET_KEY: "sb_secret_test",
};

async function request(method = "POST", body = data, overrides = {}) {
  const headers = {};
  const response = {
    setHeader: (key, value) => { headers[key] = value; },
    status: (status) => ({ json: (payload) => ({ status, payload, headers }) }),
  };
  return handler({
    method, body,
    headers: { origin, "x-vercel-forwarded-for": "192.0.2.5", "content-type": "application/json", ...overrides },
  }, response);
}

const digest = (value) => createHmac("sha256", configuration.HALO_PARTNERSHIP_RATE_SALT).update("halo-partnership:v1:").update(value).digest("hex");

test("간편 문의는 이메일 또는 전화번호로 같은 비공개 RPC에 저장한다", async (t) => {
  const previous = Object.fromEntries(Object.keys(configuration).map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  delete process.env.HALO_PARTNERSHIP_RETENTION_DAYS;
  assert.equal((await request("GET")).status, 503);
  Object.assign(process.env, configuration);

  let status = 200;
  let outcome = "created";
  const writes = [];
  const upstream = t.mock.method(globalThis, "fetch", async (url, options) => {
    if (options.method === "HEAD") return new Response(null, { status });
    assert.equal(url, "https://supabase.example/rest/v1/rpc/halo_submit_partnership_inquiry");
    assert.equal(options.headers.apikey, "sb_secret_test");
    assert.equal(options.headers.Authorization, undefined);
    writes.push(JSON.parse(options.body));
    return new Response(JSON.stringify(outcome), { status });
  });

  assert.deepEqual((await request("GET")).payload.policy, { version: "qa-1", retentionDays: 30 });
  assert.equal((await request("POST", data, { origin: "https://elsewhere.example" })).status, 403);
  assert.equal((await request("POST", data, { "x-vercel-forwarded-for": "" })).status, 503);
  assert.equal((await request("POST", { ...data, consent: false })).status, 400);
  assert.equal((await request("POST", { ...data, honeypot: "filled" })).status, 400);
  assert.equal((await request("POST", { ...data, types: ["기타", "기타"] })).status, 400);
  assert.equal((await request("POST", { ...data, types: ["기술 협력"] })).status, 400);
  assert.equal((await request("POST", { ...data, values: identity })).status, 400);
  assert.equal((await request("POST", { ...data, values: { ...identity, phone: 12345678 } })).status, 400);
  assert.equal((await request("POST", { ...data, values: { ...identity, email: "invalid" } })).status, 400);
  assert.equal((await request("POST", { ...data, version: "old" })).status, 409);
  assert.equal((await request("POST", JSON.stringify({ ...data, extra: "x".repeat(33000) }))).status, 413);
  assert.equal(upstream.mock.callCount(), 1);

  const created = await request();
  assert.equal(created.status, 201);
  assert.equal(created.headers["Cache-Control"], "private, no-store");
  assert.equal(writes[0].inquiry_id, data.id);
  assert.deepEqual(writes[0].inquiry_data, {
    values: { ...identity, email: "user@example.com" },
    types: ["체험·공간 입점", "공동 프로그램·마케팅"],
  });
  assert.equal(writes[0].ip_key, digest("ip:192.0.2.5"));
  assert.equal(writes[0].email_key, digest("email:user@example.com"));

  const phoneOnly = { ...data, id: randomUUID(), values: { ...identity, phone: "010-1234-5678" } };
  assert.equal((await request("POST", phoneOnly)).status, 201);
  assert.deepEqual(writes[1].inquiry_data.values, phoneOnly.values);
  assert.equal(writes[1].email_key, digest("phone:01012345678"));

  outcome = "duplicate";
  assert.equal((await request("POST", phoneOnly)).status, 200);
  assert.deepEqual(writes[2], writes[1]);
  outcome = "limited";
  assert.equal((await request()).status, 429);
  status = 500;
  assert.equal((await request()).status, 502);
  assert.equal((await request("GET")).status, 503);

  status = 200;
  outcome = "created";
  delete process.env.HALO_PARTNERSHIP_ORIGIN;
  delete process.env.HALO_PARTNERSHIP_POLICY_VERSION;
  delete process.env.HALO_PARTNERSHIP_RATE_SALT;
  const policy = (await request("GET")).payload.policy;
  assert.equal(policy.version, "halo-partnership-short-v1");
  const productionRequest = { ...data, version: policy.version };
  assert.equal((await request("POST", productionRequest, { origin: "https://www.halo-official.co.kr" })).status, 201);
  assert.equal((await request("POST", productionRequest)).status, 403);
});
