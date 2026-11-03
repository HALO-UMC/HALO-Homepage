import { createHash, randomBytes } from "node:crypto";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const RATE_BUCKETS = new Map();
const EPHEMERAL_RATE_SALT = randomBytes(32).toString("hex");
const DEVICE_OPTIONS = new Set(["android", "ios", "both", "undecided"]);

function sendJson(response, status, payload, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("X-Content-Type-Options", "nosniff");

  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }

  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  return request.body && typeof request.body === "object" ? request.body : {};
}

function normalizeEmail(email) {
  return email.trim().normalize("NFKC").toLowerCase();
}

function isValidEmail(email) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function getRequestIp(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  return (
    firstForwarded?.split(",")[0]?.trim() ||
    request.headers["x-real-ip"] ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

function getRateKey(request) {
  const salt = process.env.KIRI_RATE_LIMIT_SALT || EPHEMERAL_RATE_SALT;
  return createHash("sha256").update(`${salt}:${getRequestIp(request)}`).digest("hex");
}

function consumeRateLimit(request) {
  const now = Date.now();

  if (RATE_BUCKETS.size > 500) {
    for (const [key, bucket] of RATE_BUCKETS) {
      if (bucket.resetAt <= now) {
        RATE_BUCKETS.delete(key);
      }
    }
  }

  const key = getRateKey(request);
  const current = RATE_BUCKETS.get(key);

  if (!current || current.resetAt <= now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function hasAllowedOrigin(request) {
  const origin = request.headers.origin;

  if (!origin) {
    return true;
  }

  const configuredOrigins = (
    process.env.KIRI_ALLOWED_ORIGINS ||
    process.env.KIRI_ALLOWED_ORIGIN ||
    ""
  )
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(origin.replace(/\/$/, ""));
  }

  try {
    const originHost = new URL(origin).host;
    const forwardedHost = request.headers["x-forwarded-host"];
    const requestHostValue = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost || request.headers.host;
    const requestHost = requestHostValue?.split(",")[0]?.trim();
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function getConfiguration() {
  const configuration = {
    supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    apiKey:
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    policyVersion: process.env.KIRI_PRIVACY_POLICY_VERSION,
    dataControllerName: process.env.KIRI_DATA_CONTROLLER_NAME,
    retentionLabel: process.env.KIRI_PRIVACY_RETENTION_LABEL,
    rateLimitSalt: process.env.KIRI_RATE_LIMIT_SALT,
    table: process.env.KIRI_PREREGISTER_TABLE || "kiri_preregistrations",
  };

  if (
    !configuration.supabaseUrl ||
    !configuration.apiKey ||
    !configuration.policyVersion ||
    !configuration.dataControllerName ||
    !configuration.retentionLabel ||
    !configuration.rateLimitSalt ||
    !/^[a-zA-Z0-9_]+$/.test(configuration.table)
  ) {
    return null;
  }

  return configuration;
}

export function getSupabaseApiKeyHeaders(apiKey) {
  const headers = { apikey: apiKey };

  // New sb_secret keys are not JWTs and must not be sent as Bearer tokens.
  if (!apiKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, {
      ok: false,
      message: "지원하지 않는 요청 방식입니다.",
    });
  }

  if (!hasAllowedOrigin(request)) {
    return sendJson(response, 403, {
      ok: false,
      message: "허용되지 않은 요청입니다.",
    });
  }

  const rate = consumeRateLimit(request);
  if (!rate.allowed) {
    return sendJson(
      response,
      429,
      {
        ok: false,
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      },
      { "Retry-After": String(rate.retryAfter) },
    );
  }

  let body;
  try {
    body = parseBody(request);
  } catch {
    return sendJson(response, 400, {
      ok: false,
      message: "요청 내용을 확인해주세요.",
    });
  }

  if (JSON.stringify(body).length > 8_000 || String(body.company || "").trim()) {
    return sendJson(response, 400, {
      ok: false,
      message: "요청 내용을 확인해주세요.",
    });
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const device = typeof body.device === "string" ? body.device : "";

  if (!isValidEmail(email)) {
    return sendJson(response, 400, {
      ok: false,
      field: "email",
      message: "이메일 형식을 확인해주세요.",
    });
  }

  if (nickname.length > 24) {
    return sendJson(response, 400, {
      ok: false,
      field: "nickname",
      message: "닉네임은 24자 이내로 입력해주세요.",
    });
  }

  if (!DEVICE_OPTIONS.has(device)) {
    return sendJson(response, 400, {
      ok: false,
      field: "device",
      message: "사용 기기 선택을 확인해주세요.",
    });
  }

  if (body.privacyAgreed !== true) {
    return sendJson(response, 400, {
      ok: false,
      field: "privacyAgreed",
      message: "개인정보 수집·이용 동의가 필요합니다.",
    });
  }

  const configuration = getConfiguration();
  if (!configuration) {
    return sendJson(response, 503, {
      ok: false,
      message:
        "사전예약 저장소 또는 개인정보 정책 설정이 완료되지 않았습니다. 운영 설정 후 다시 시도해주세요.",
    });
  }

  const consentedAt = new Date().toISOString();
  const record = {
    email_normalized: email,
    nickname: nickname || null,
    device,
    family_trial: body.familyTrial === true,
    privacy_consent_version: configuration.policyVersion,
    privacy_agreed_at: consentedAt,
    data_controller_name: configuration.dataControllerName,
    privacy_retention_label: configuration.retentionLabel,
  };

  let storageResponse;
  try {
    storageResponse = await fetch(
      `${configuration.supabaseUrl}/rest/v1/${configuration.table}`,
      {
        method: "POST",
        headers: {
          ...getSupabaseApiKeyHeaders(configuration.apiKey),
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(record),
      },
    );
  } catch {
    return sendJson(response, 503, {
      ok: false,
      message: "저장소에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }

  const storageResult = await storageResponse.json().catch(() => null);

  if (!storageResponse.ok) {
    const storageCode = storageResult?.code;
    if (storageResponse.status === 409 || storageCode === "23505") {
      return sendJson(response, 200, {
        ok: true,
        status: "duplicate",
      });
    }

    console.error("KIRI preregistration storage error", {
      status: storageResponse.status,
      code: storageCode || "unknown",
    });

    return sendJson(response, 503, {
      ok: false,
      message: "신청 내용을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }

  if (!Array.isArray(storageResult) || storageResult.length !== 1) {
    return sendJson(response, 503, {
      ok: false,
      message: "저장 결과를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }

  return sendJson(response, 201, {
    ok: true,
    status: "created",
  });
}
