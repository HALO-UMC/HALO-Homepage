import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createAssetLinksHandler,
  normalizeSha256Fingerprint,
} from "../api/assetlinks.js";
import {
  getInviteAppUrl,
  parseInviteToken,
} from "../src/webeditorial/inviteConfig.js";
import { KIRI_STORE_URLS } from "../src/webeditorial/kiriConfig.js";

const TEST_ANDROID_FINGERPRINT = Array.from(
  { length: 32 },
  (_, index) => index.toString(16).padStart(2, "0"),
)
  .join(":")
  .toUpperCase();

function createApiResponse() {
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

function callAssetLinks(handler, method = "GET") {
  const response = createApiResponse();
  handler({ method }, response);

  return {
    status: response.statusCode,
    body: response.body ? JSON.parse(response.body) : null,
    headers: response,
  };
}

test("초대 경로에서 값의 유효성을 추정하지 않고 단일 토큰만 읽는다", () => {
  assert.equal(parseInviteToken("/invite/family-token.123"), "family-token.123");
  assert.equal(parseInviteToken("/invite/family%20token/"), "family token");
  assert.equal(parseInviteToken("/invite"), null);
  assert.equal(parseInviteToken("/invite/"), null);
  assert.equal(parseInviteToken("/invite/one/two"), null);
  assert.equal(parseInviteToken("/invite/%2F"), null);
  assert.equal(parseInviteToken("/invite/%E0%A4%A"), null);
});

test("iOS와 Android 앱 열기 주소는 앱이 실제 지원하는 형식을 사용한다", () => {
  assert.equal(
    getInviteAppUrl("family token", "iPhone"),
    "kiri://invite/family%20token",
  );
  assert.equal(
    getInviteAppUrl("family token", "Mozilla/5.0 (Linux; Android 16)"),
    "https://kiri.app/invite/family%20token",
  );
});

test("초대 페이지는 고정 스토어 설정과 토큰 없는 메타데이터를 사용한다", async () => {
  assert.equal(
    KIRI_STORE_URLS.appStore,
    "https://apps.apple.com/kr/app/%EB%81%BC%EB%A6%AC-kiri/id6835049058",
  );
  assert.equal(KIRI_STORE_URLS.googlePlay, null);

  const [pageSource, metadataSource, mainSource] = await Promise.all([
    readFile("src/webeditorial/InvitePage.jsx", "utf8"),
    readFile("src/webeditorial/pageMetadata.js", "utf8"),
    readFile("src/main.jsx", "utf8"),
  ]);

  assert.match(pageSource, /Google Play 다운로드 준비 중/);
  assert.doesNotMatch(pageSource, /trackAnalyticsEvent|trackPageView/);
  assert.match(metadataSource, /noindex, nofollow, noarchive/);
  assert.match(metadataSource, /canonicalUrl: `\$\{PRODUCTION_ORIGIN\}\/invite`/);
  assert.match(mainSource, /!isDemodayPage && !isInvitePage/);
});

test("Vercel은 초대 URL을 SPA로 열고 검색 색인을 헤더로도 차단한다", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const inviteHeaders = config.headers.find(
    (entry) => entry.source === "/invite/:path*",
  );

  assert.ok(inviteHeaders);
  assert.equal(
    inviteHeaders.headers.find((header) => header.key === "X-Robots-Tag")
      ?.value,
    "noindex, nofollow, noarchive",
  );
  assert.deepEqual(config.rewrites[1], {
    source: "/invite/(.*)",
    destination: "/invite",
  });
  assert.equal(config.rewrites.at(-1)?.destination, "/index");
});

test("iOS 연결 파일은 초대 경로만 KIRI 앱에 연결한다", async () => {
  const association = JSON.parse(
    await readFile("public/.well-known/apple-app-site-association", "utf8"),
  );
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  const details = association.applinks?.details;
  const associationHeaders = config.headers.find(
    (entry) => entry.source === "/.well-known/apple-app-site-association",
  );

  assert.deepEqual(association.applinks?.apps, []);
  assert.deepEqual(details, [
    {
      appID: "98W2DZGWNU.com.kiriteam.KIRI",
      paths: ["/invite/*"],
    },
  ]);
  assert.equal(
    associationHeaders?.headers.find(
      (header) => header.key === "Content-Type",
    )?.value,
    "application/json; charset=utf-8",
  );
  assert.match(config.rewrites.at(-1)?.source ?? "", /\\\.well-known\//);
});

test("Android 연결 파일은 Play 앱 서명 지문이 있을 때만 발행한다", async () => {
  const configuredHandler = createAssetLinksHandler({
    getFingerprint: () => TEST_ANDROID_FINGERPRINT.toLowerCase(),
  });
  const missingHandler = createAssetLinksHandler({
    getFingerprint: () => "",
  });
  const invalidHandler = createAssetLinksHandler({
    getFingerprint: () => "not-a-play-signing-fingerprint",
  });

  const configured = callAssetLinks(configuredHandler);
  const missing = callAssetLinks(missingHandler);
  const invalid = callAssetLinks(invalidHandler);

  assert.equal(
    normalizeSha256Fingerprint(TEST_ANDROID_FINGERPRINT.toLowerCase()),
    TEST_ANDROID_FINGERPRINT,
  );
  assert.equal(configured.status, 200);
  assert.deepEqual(configured.body, [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.kiri.android",
        sha256_cert_fingerprints: [TEST_ANDROID_FINGERPRINT],
      },
    },
  ]);
  assert.equal(
    configured.headers.getHeader("content-type"),
    "application/json; charset=utf-8",
  );

  for (const response of [missing, invalid]) {
    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { error: "assetlinks_not_configured" });
    assert.equal(response.headers.getHeader("cache-control"), "private, no-store");
  }

  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  assert.deepEqual(config.rewrites[0], {
    source: "/.well-known/assetlinks.json",
    destination: "/api/assetlinks",
  });
  assert.equal(
    config.headers
      .find((entry) => entry.source === "/.well-known/assetlinks.json")
      ?.headers.find((header) => header.key === "Content-Type")?.value,
    "application/json; charset=utf-8",
  );
  assert.equal(config.redirects, undefined);
  assert.match(config.rewrites.at(-1)?.source ?? "", /\\\.well-known\//);
});
