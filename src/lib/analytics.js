import { ConversionTrackingEvent } from "@/api/entities";

const PUBLIC_PAGE_KEYS = {
  "/": "homepage",
  "/pricing": "pricing",
  "/dental": "dental",
  "/hvac": "hvac",
  "/roofing": "roofing",
  "/contractors": "contractors",
  "/real-estate": "real_estate",
  "/personal-injury": "personal_injury",
  "/plumbing": "plumbing",
  "/chiropractic": "chiropractic",
};

const INTERNAL_ROUTE_PATTERN = /^\/(admin|dashboard|mission-control|saas|client-portal|client-dashboard|setup|onboarding|launch-control|funnel-optimization|system-observability)(\/|$)/i;
const TEST_HOST_PATTERN = /(preview|sandbox|base44\.app|localhost|127\.0\.0\.1)/i;

function safeRandomId(prefix = "evt") {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : null;
  if (cryptoObj?.randomUUID) return `${prefix}_${cryptoObj.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    const key = "clientsurge_conversion_session_id";
    let value = window.sessionStorage.getItem(key);
    if (!value) {
      value = safeRandomId("sess");
      window.sessionStorage.setItem(key, value);
    }
    return value;
  } catch (_error) {
    return safeRandomId("sess");
  }
}

function normalizePath(pathname = "/") {
  const path = String(pathname || "/").split("?")[0].split("#")[0];
  if (path === "") return "/";
  return path.replace(/\/$/, "") || "/";
}

export function getPageKey(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  const path = normalizePath(pathname);
  if (PUBLIC_PAGE_KEYS[path]) return PUBLIC_PAGE_KEYS[path];
  if (path.startsWith("/industries/")) {
    const slug = path.split("/").filter(Boolean).pop();
    const mapped = slug?.replace(/-/g, "_");
    if (["dental", "hvac", "roofing", "contractors", "plumbing", "chiropractic", "med_spa", "real_estate", "personal_injury"].includes(mapped)) {
      return mapped;
    }
  }
  return null;
}

export function isProductionTrackablePath(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  if (typeof window === "undefined") return false;
  if (TEST_HOST_PATTERN.test(window.location.hostname)) return false;
  const path = normalizePath(pathname);
  if (INTERNAL_ROUTE_PATTERN.test(path)) return false;
  return Boolean(getPageKey(path));
}

function getDeviceType() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth || 1024;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getBrowserName() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  if (/Firefox\//.test(ua)) return "firefox";
  return "unknown";
}

function getUtmMetadata() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search || "");
  return {
    device_type: getDeviceType(),
    browser: getBrowserName(),
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    referrer: document.referrer || undefined,
  };
}

const recentProofEvents = new Map();
const DEDUPE_WINDOW_MS = 10_000;

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (e) {
    // Analytics must never break user interactions
    console.warn("[analytics] trackEvent failed:", e?.message);
  }
}

export async function trackConversionProof(eventType, options = {}) {
  if (typeof window === "undefined") return null;
  const pathname = options.pathname || window.location.pathname;
  if (!isProductionTrackablePath(pathname)) return null;

  const pageKey = options.page_key || getPageKey(pathname);
  if (!pageKey) return null;

  const now = Date.now();
  const eventLabel = options.event_label || options.label || eventType;
  const dedupeKey = `${getSessionId()}|${pageKey}|${eventType}|${eventLabel}`;
  const lastSeen = recentProofEvents.get(dedupeKey) || 0;
  if (now - lastSeen < (options.dedupe_window_ms || DEDUPE_WINDOW_MS)) return null;
  recentProofEvents.set(dedupeKey, now);

  const record = {
    event_id: safeRandomId("conv"),
    session_id: getSessionId(),
    page_key: pageKey,
    event_type: eventType,
    event_label: String(eventLabel).slice(0, 180),
    timestamp: new Date(now).toISOString(),
    metadata: {
      ...getUtmMetadata(),
      ...(options.metadata || {}),
    },
  };

  try {
    await ConversionTrackingEvent.create(record);
    return record;
  } catch (e) {
    // First-party proof tracking must never break public UX.
    console.warn("[analytics] ConversionTrackingEvent create failed:", e?.message);
    return null;
  }
}

export function trackCTA(label, location, extra = {}) {
  try {
    trackEvent("cta_click", {
      cta_label: label,
      cta_location: location,
      ...extra,
    });
    trackConversionProof("cta_click", {
      pathname: location,
      event_label: label,
      metadata: extra,
    });
  } catch (e) {
    console.warn("[analytics] trackCTA failed:", e?.message);
  }
}
