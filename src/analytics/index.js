import {
  buildAnalyticsEvent,
  getTrackedPageName,
  sanitizePageLocation,
  sanitizeReferrer,
} from "./config.js";

const viteEnvironment = import.meta.env || {};
const PRODUCTION_HOSTS = new Set([
  "halo-official.co.kr",
  "www.halo-official.co.kr",
]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const GA_SCRIPT_ID = "halo-ga4-script";

let initialized = false;
let gaMeasurementId = "";
let hackleClient = null;
let hackleReadyPromise = null;
let pendingHackleActions = [];
let lastPageName = null;
let lastPageLocation = null;

function canCollectAnalytics() {
  if (typeof window === "undefined") {
    return false;
  }

  if (PRODUCTION_HOSTS.has(window.location.hostname)) {
    return true;
  }

  return Boolean(viteEnvironment.DEV && LOCAL_HOSTS.has(window.location.hostname));
}

function isLocalAnalyticsTest() {
  return Boolean(
    typeof window !== "undefined" &&
      viteEnvironment.DEV &&
      LOCAL_HOSTS.has(window.location.hostname),
  );
}

function sanitizeCurrentBrowserUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);
  const sanitizedUrl = new URL(sanitizePageLocation(currentUrl.href));
  sanitizedUrl.hash = currentUrl.hash;

  if (sanitizedUrl.href !== currentUrl.href) {
    window.history.replaceState(window.history.state, "", sanitizedUrl.href);
  }
}

function initializeGa4() {
  gaMeasurementId = String(viteEnvironment.VITE_GA4_MEASUREMENT_ID || "").trim();
  if (!gaMeasurementId || typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId, {
    send_page_view: false,
    debug_mode: isLocalAnalyticsTest(),
  });

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`;
    document.head.appendChild(script);
  }
}

function initializeHackle() {
  const sdkKey = String(viteEnvironment.VITE_HACKLE_BROWSER_SDK_KEY || "").trim();
  if (!sdkKey) {
    return;
  }

  hackleReadyPromise = import("@hackler/react-sdk")
    .then(({ createInstance }) => {
      hackleClient = createInstance(sdkKey, {
        automaticPageTracking: true,
        automaticRouteTracking: false,
        debug: isLocalAnalyticsTest(),
      });

      for (const action of pendingHackleActions) {
        action(hackleClient);
      }
      pendingHackleActions = [];
    })
    .catch(() => {
      hackleClient = null;
      pendingHackleActions = [];
    });
}

function withHackleClient(action) {
  if (hackleClient) {
    action(hackleClient);
    return;
  }

  if (hackleReadyPromise) {
    pendingHackleActions.push(action);
  }
}

function recordBrowserTestEvent(event) {
  if (
    typeof window === "undefined" ||
    window.__HALO_ANALYTICS_TEST__ !== true ||
    !LOCAL_HOSTS.has(window.location.hostname)
  ) {
    return;
  }

  window.__HALO_ANALYTICS_TEST_EVENTS__ =
    window.__HALO_ANALYTICS_TEST_EVENTS__ || [];
  window.__HALO_ANALYTICS_TEST_EVENTS__.push(event);
}

export function initializeAnalytics() {
  if (initialized || !canCollectAnalytics()) {
    return;
  }

  initialized = true;
  sanitizeCurrentBrowserUrl();
  initializeGa4();
  initializeHackle();
}

export function trackPageView(pathname) {
  const pageName = getTrackedPageName(pathname);
  if (!pageName || typeof window === "undefined") {
    return false;
  }

  initializeAnalytics();

  const pageLocation = sanitizePageLocation(window.location.href);
  if (lastPageName === pageName && lastPageLocation === pageLocation) {
    return false;
  }

  const pageReferrer =
    lastPageLocation || sanitizeReferrer(window.document.referrer);
  lastPageName = pageName;
  lastPageLocation = pageLocation;

  recordBrowserTestEvent({
    name: "page_view",
    properties: { page_name: pageName },
  });

  if (gaMeasurementId && typeof window.gtag === "function") {
    try {
      window.gtag("set", {
        page_location: pageLocation,
        page_referrer: pageReferrer,
      });
      window.gtag("event", "page_view", {
        page_name: pageName,
        page_title: window.document.title,
        page_location: pageLocation,
        page_referrer: pageReferrer,
        debug_mode: isLocalAnalyticsTest(),
      });
    } catch {
      // Analytics failures must never block routing.
    }
  }

  withHackleClient((client) => {
    try {
      client.setCurrentPage({
        pageName,
        properties: { page_name: pageName },
      });
    } catch {
      // Analytics failures must never block routing.
    }
  });

  return true;
}

export function trackAnalyticsEvent(eventName, properties) {
  const event = buildAnalyticsEvent(eventName, properties);
  if (!event) {
    return false;
  }

  initializeAnalytics();
  recordBrowserTestEvent(event);

  if (gaMeasurementId && typeof window.gtag === "function") {
    try {
      window.gtag("event", event.name, {
        ...event.properties,
        debug_mode: isLocalAnalyticsTest(),
      });
    } catch {
      // Analytics failures must never block the original interaction.
    }
  }

  withHackleClient((client) => {
    try {
      client.track({
        key: event.name,
        properties: event.properties,
      });
    } catch {
      // Analytics failures must never block the original interaction.
    }
  });

  return true;
}
