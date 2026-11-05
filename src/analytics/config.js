export const ANALYTICS_EVENT_NAMES = Object.freeze({
  CLICK_SERVICE: "click_service",
  CLICK_APP_STORE: "click_app_store",
  CLICK_PREREGISTER: "click_preregister",
  START_PREREGISTER: "start_preregister",
  COMPLETE_PREREGISTER: "complete_preregister",
});

export const PAGE_NAMES = Object.freeze({
  COMPANY: "company",
  HALO: "halo",
  KIRI: "kiri",
});

export const SERVICES = Object.freeze({
  HALO: "halo",
  KIRI: "kiri",
});

export const STORES = Object.freeze({
  GOOGLE_PLAY: "google_play",
  APP_STORE: "app_store",
});

export const CTA_LOCATIONS = Object.freeze({
  HEADER: "header",
  HERO: "hero",
  SERVICE_SECTION: "service_section",
  DOWNLOAD_SECTION: "download_section",
  FINAL: "final",
  DOWNLOAD_PAGE: "download_page",
  FLOATING: "floating",
  FOOTER: "footer",
  PREREGISTER_FORM: "preregister_form",
});

const PAGE_BY_PATH = Object.freeze({
  "/": PAGE_NAMES.COMPANY,
  "/halo": PAGE_NAMES.HALO,
  "/kiri": PAGE_NAMES.KIRI,
});

const CAMPAIGN_QUERY_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
]);

const PAGE_VALUES = new Set(Object.values(PAGE_NAMES));
const SERVICE_VALUES = new Set(Object.values(SERVICES));
const STORE_VALUES = new Set(Object.values(STORES));
const CTA_LOCATION_VALUES = new Set(Object.values(CTA_LOCATIONS));

const EVENT_RULES = Object.freeze({
  [ANALYTICS_EVENT_NAMES.CLICK_SERVICE]: {
    required: ["page_name", "service", "cta_location"],
    pages: new Set([PAGE_NAMES.COMPANY]),
    ctaLocations: new Set([
      CTA_LOCATIONS.SERVICE_SECTION,
      CTA_LOCATIONS.FOOTER,
    ]),
  },
  [ANALYTICS_EVENT_NAMES.CLICK_APP_STORE]: {
    required: ["page_name", "service", "cta_location", "store"],
    pages: new Set([PAGE_NAMES.COMPANY, PAGE_NAMES.HALO]),
    services: new Set([SERVICES.HALO]),
    ctaLocations: new Set([
      CTA_LOCATIONS.HERO,
      CTA_LOCATIONS.SERVICE_SECTION,
      CTA_LOCATIONS.DOWNLOAD_SECTION,
      CTA_LOCATIONS.FINAL,
      CTA_LOCATIONS.DOWNLOAD_PAGE,
      CTA_LOCATIONS.FLOATING,
    ]),
  },
  [ANALYTICS_EVENT_NAMES.CLICK_PREREGISTER]: {
    required: ["page_name", "service", "cta_location"],
    pages: new Set([PAGE_NAMES.COMPANY, PAGE_NAMES.KIRI]),
    services: new Set([SERVICES.KIRI]),
    ctaLocations: new Set([
      CTA_LOCATIONS.HEADER,
      CTA_LOCATIONS.HERO,
      CTA_LOCATIONS.SERVICE_SECTION,
    ]),
  },
  [ANALYTICS_EVENT_NAMES.START_PREREGISTER]: {
    required: ["page_name", "service", "cta_location"],
    pages: new Set([PAGE_NAMES.KIRI]),
    services: new Set([SERVICES.KIRI]),
    ctaLocations: new Set([CTA_LOCATIONS.PREREGISTER_FORM]),
  },
  [ANALYTICS_EVENT_NAMES.COMPLETE_PREREGISTER]: {
    required: ["page_name", "service", "cta_location"],
    pages: new Set([PAGE_NAMES.KIRI]),
    services: new Set([SERVICES.KIRI]),
    ctaLocations: new Set([CTA_LOCATIONS.PREREGISTER_FORM]),
  },
});

const ALLOWED_PROPERTY_KEYS = new Set([
  "page_name",
  "service",
  "cta_location",
  "store",
]);

export function getTrackedPageName(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return PAGE_BY_PATH[normalizedPath] || null;
}

export function sanitizePageLocation(href) {
  const url = new URL(href);

  for (const key of [...url.searchParams.keys()]) {
    if (!CAMPAIGN_QUERY_PARAMETERS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  url.hash = "";
  return url.toString();
}

export function sanitizeReferrer(referrer) {
  if (!referrer) {
    return "";
  }

  try {
    const url = new URL(referrer);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function buildAnalyticsEvent(eventName, properties) {
  const rule = EVENT_RULES[eventName];
  if (!rule || !properties || typeof properties !== "object") {
    return null;
  }

  const keys = Object.keys(properties);
  if (keys.some((key) => !ALLOWED_PROPERTY_KEYS.has(key))) {
    return null;
  }

  if (rule.required.some((key) => !keys.includes(key))) {
    return null;
  }

  const {
    page_name: pageName,
    service,
    cta_location: ctaLocation,
    store,
  } = properties;

  if (!PAGE_VALUES.has(pageName) || !rule.pages.has(pageName)) {
    return null;
  }

  if (
    service !== undefined &&
    (!SERVICE_VALUES.has(service) || (rule.services && !rule.services.has(service)))
  ) {
    return null;
  }

  if (
    !CTA_LOCATION_VALUES.has(ctaLocation) ||
    !rule.ctaLocations.has(ctaLocation)
  ) {
    return null;
  }

  if (store !== undefined && !STORE_VALUES.has(store)) {
    return null;
  }

  return {
    name: eventName,
    properties: Object.fromEntries(
      [
        ["page_name", pageName],
        ["service", service],
        ["cta_location", ctaLocation],
        ["store", store],
      ].filter(([, value]) => value !== undefined),
    ),
  };
}
