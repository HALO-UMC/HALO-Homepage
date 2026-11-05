import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_EVENT_NAMES,
  CTA_LOCATIONS,
  PAGE_NAMES,
  SERVICES,
  STORES,
  buildAnalyticsEvent,
  getTrackedPageName,
  sanitizePageLocation,
  sanitizeReferrer,
} from "../src/analytics/config.js";

test("측정 대상 세 경로만 고정 page_name으로 변환한다", () => {
  assert.equal(getTrackedPageName("/"), PAGE_NAMES.COMPANY);
  assert.equal(getTrackedPageName("/halo/"), PAGE_NAMES.HALO);
  assert.equal(getTrackedPageName("/kiri"), PAGE_NAMES.KIRI);
  assert.equal(getTrackedPageName("/privacy"), null);
});

test("페이지 URL은 캠페인 파라미터만 유지하고 해시와 개인정보 후보를 제거한다", () => {
  assert.equal(
    sanitizePageLocation(
      "https://halo-official.co.kr/kiri?utm_source=instagram&utm_campaign=launch&email=user%40example.com#kiri-preregister",
    ),
    "https://halo-official.co.kr/kiri?utm_source=instagram&utm_campaign=launch",
  );
  assert.equal(
    sanitizeReferrer("https://example.com/path?name=someone#profile"),
    "https://example.com/path",
  );
});

test("공통 이벤트는 정해진 이름과 속성 값만 허용한다", () => {
  assert.deepEqual(
    buildAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_APP_STORE, {
      page_name: PAGE_NAMES.HALO,
      service: SERVICES.HALO,
      cta_location: CTA_LOCATIONS.HERO,
      store: STORES.GOOGLE_PLAY,
    }),
    {
      name: "click_app_store",
      properties: {
        page_name: "halo",
        service: "halo",
        cta_location: "hero",
        store: "google_play",
      },
    },
  );

  assert.equal(
    buildAnalyticsEvent(ANALYTICS_EVENT_NAMES.CLICK_SERVICE, {
      page_name: PAGE_NAMES.COMPANY,
      service: SERVICES.KIRI,
      cta_location: CTA_LOCATIONS.SERVICE_SECTION,
      email: "must-not-be-sent@example.com",
    }),
    null,
  );
  assert.equal(
    buildAnalyticsEvent("unapproved_event", {
      page_name: PAGE_NAMES.COMPANY,
    }),
    null,
  );
});
