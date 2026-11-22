export const KIRI_ANDROID_PACKAGE_NAME = "com.kiri.android";
export const KIRI_ANDROID_FINGERPRINT_ENV =
  "KIRI_ANDROID_SHA256_CERT_FINGERPRINT";

const SHA256_FINGERPRINT_PATTERN = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function normalizeSha256Fingerprint(value) {
  const fingerprint = String(value || "").trim().toUpperCase();
  return SHA256_FINGERPRINT_PATTERN.test(fingerprint) ? fingerprint : null;
}

export function buildAssetLinks(fingerprint) {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: KIRI_ANDROID_PACKAGE_NAME,
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];
}

function sendJson(response, statusCode, body) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

export function createAssetLinksHandler({
  getFingerprint = () => process.env[KIRI_ANDROID_FINGERPRINT_ENV],
} = {}) {
  return function assetLinksHandler(request, response) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      response.setHeader("Cache-Control", "private, no-store");
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    const fingerprint = normalizeSha256Fingerprint(getFingerprint());
    if (!fingerprint) {
      response.setHeader("Cache-Control", "private, no-store");
      sendJson(response, 503, { error: "assetlinks_not_configured" });
      return;
    }

    response.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600",
    );

    if (request.method === "HEAD") {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.end();
      return;
    }

    sendJson(response, 200, buildAssetLinks(fingerprint));
  };
}

export default createAssetLinksHandler();
