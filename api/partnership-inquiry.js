// @ts-check

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getSupabaseApiKeyHeaders } from "./kiri-preregister.js";
import { collaborationTypes, inquiryFields, validateInquiry } from "../src/data/partnershipForm.js";

const productionOrigins = new Set(["https://www.halo-official.co.kr", "https://halo-official.co.kr"]);
const defaultPolicyVersion = "halo-partnership-short-v1";
const maximumBodySize = 32 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getConfiguration() {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const apiKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
  const origin = process.env.HALO_PARTNERSHIP_ORIGIN?.trim();
  const salt = process.env.HALO_PARTNERSHIP_RATE_SALT || process.env.KIRI_RATE_LIMIT_SALT || apiKey;
  const version = process.env.HALO_PARTNERSHIP_POLICY_VERSION || defaultPolicyVersion;
  const retentionDays = Number(process.env.HALO_PARTNERSHIP_RETENTION_DAYS);
  if (!SUPABASE_URL || !apiKey || !/^[a-zA-Z0-9._-]{1,80}$/.test(version) ||
    !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) return null;
  try {
    const database = new URL(SUPABASE_URL);
    const website = origin ? new URL(origin) : null;
    if (database.protocol !== "https:" || (website && (website.protocol !== "https:" || website.origin !== origin))) return null;
    return { database: database.origin, origin, salt, policy: { version, retentionDays }, apiKey };
  } catch {
    return null;
  }
}

function send(response, status, payload) {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(payload);
}

function normalize(body) {
  if (!body || typeof body !== "object" || typeof body.id !== "string" || !uuidPattern.test(body.id) ||
    body.honeypot !== "" || !body.values || typeof body.values !== "object" || Array.isArray(body.values) ||
    Object.keys(validateInquiry(body.values, body.types, body.consent)).length) return null;

  const values = {};
  for (const field of inquiryFields) {
    const value = body.values[field.name]?.trim();
    if (value) values[field.name] = field.name === "email" ? value.toLowerCase() : value;
  }
  return { values, types: collaborationTypes.filter((type) => body.types.includes(type)) };
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return send(response, 405, { ok: false, message: "지원하지 않는 요청 방식입니다." });
  }
  const config = getConfiguration();
  const unavailable = { ok: false, message: "현재 온라인 접수를 이용할 수 없습니다. 이메일로 문의해 주세요." };
  if (!config) return send(response, 503, unavailable);
  const headers = getSupabaseApiKeyHeaders(config.apiKey);
  if (request.method === "GET") {
    try {
      const probe = await fetch(`${config.database}/rest/v1/halo_partnership_inquiries?select=id&limit=0`, {
        method: "HEAD", headers, signal: AbortSignal.timeout(4000),
      });
      if (probe.ok) return send(response, 200, { ok: true, policy: config.policy });
    } catch {
      // The browser uses the existing email channel when the database is unavailable.
    }
    return send(response, 503, unavailable);
  }

  const origin = request.headers.origin;
  if (typeof origin !== "string" || (config.origin ? origin !== config.origin : !productionOrigins.has(origin))) {
    return send(response, 403, { ok: false, message: "요청 출처를 확인할 수 없습니다." });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] || "")) {
    return send(response, 415, { ok: false, message: "지원하지 않는 요청 형식입니다." });
  }
  const ip = request.headers["x-vercel-forwarded-for"];
  if (typeof ip !== "string" || !isIP(ip)) return send(response, 503, unavailable);
  const invalid = { ok: false, message: "입력 항목과 필수 동의를 확인해 주세요." };
  let body;
  try {
    const serialized = typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? null);
    if (Number(request.headers["content-length"]) > maximumBodySize || Buffer.byteLength(serialized) > maximumBodySize) {
      return send(response, 413, { ok: false, message: "제안 내용이 너무 깁니다." });
    }
    body = JSON.parse(serialized);
  } catch {
    return send(response, 400, invalid);
  }
  const inquiry = normalize(body);
  if (!inquiry) return send(response, 400, invalid);
  if (body.version !== config.policy.version) {
    return send(response, 409, { ok: false, code: "POLICY_CHANGED", message: "개인정보 안내가 변경되었습니다. 새 안내를 확인하고 다시 동의해 주세요." });
  }

  const digest = (value) => createHmac("sha256", config.salt).update("halo-partnership:v1:").update(value).digest("hex");
  // The existing RPC stores a digest only. Preserve email quotas and use a
  // separate namespace in the same quota slot for phone-only submissions.
  const contactKey = inquiry.values.email ? `email:${inquiry.values.email}` :
    `phone:${inquiry.values.phone.replace(/\D/g, "")}`;
  try {
    const write = await fetch(`${config.database}/rest/v1/rpc/halo_submit_partnership_inquiry`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry_id: body.id,
        inquiry_data: inquiry,
        policy_version: config.policy.version,
        retention_days: config.policy.retentionDays,
        ip_key: digest(`ip:${ip}`),
        email_key: digest(contactKey),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!write.ok) throw new Error("Partnership storage failed");
    const outcome = await write.json();
    if (outcome === "created" || outcome === "duplicate") return send(response, outcome === "created" ? 201 : 200, { ok: true });
    if (outcome === "limited") {
      return send(response, 429, { ok: false, message: "접수 요청이 많습니다. 잠시 후 다시 시도하거나 이메일로 문의해 주세요." });
    }
    if (outcome === "conflict") return send(response, 409, { ok: false, message: "이 요청의 접수 상태는 이메일로 문의해 주세요." });
  } catch {
    // Do not log request bodies, credentials, or upstream responses.
  }
  return send(response, 502, { ok: false, message: "문의를 저장하지 못했습니다. 잠시 후 다시 제출해 주세요." });
}
