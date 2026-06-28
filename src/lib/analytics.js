import { ConversionTrackingEvent } from "@/api/entities";
import { base44 } from "@/api/base44Client";

const PAGE_KEYS = {
  "/": "homepage",
  "/pricing": "pricing",
  "/store": "store",
  "/product-signup": "product_signup",
  "/start": "start",
  "/automations": "automations",
  "/industries": "industries",
  "/contact": "contact",
  "/about": "about",
  "/dental": "dental",
  "/hvac": "hvac",
  "/roofing": "roofing",
  "/contractors": "contractors",
  "/real-estate": "real_estate",
  "/personal-injury": "personal_injury",
  "/plumbing": "plumbing",
  "/chiropractic": "chiropractic",
  "/med-spa": "med_spa",
};

const recent = new Map();

function id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function sessionId() {
  if (typeof window === "undefined") return "server";
  try {
    const key = "clientsurge_conversion_session_id";
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = id("sess");
      sessionStorage.setItem(key, value);
    }
    return value;
  } catch {
    return id("sess");
  }
}

function cleanPath(pathname = "/") {
  return String(pathname || "/").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
}

export function getPageKey(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  const path = cleanPath(pathname);
  if (PAGE_KEYS[path]) return PAGE_KEYS[path];
  if (path.startsWith("/industries/")) {
    const slug = path.split("/").filter(Boolean).pop()?.replace(/-/g, "_");
    if (["dental", "hvac", "roofing", "contractors", "plumbing", "chiropractic", "med_spa", "real_estate", "personal_injury"].includes(slug)) return slug;
  }
  return null;
}

export function isProductionTrackablePath(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname || "";
  if (/preview|sandbox|base44\.app|localhost|127\.0\.0\.1/i.test(host)) return false;
  const path = cleanPath(pathname);
  if (/^\/(admin|dashboard|mission-control|saas|client-portal|client-dashboard|setup|onboarding|launch-control|funnel-optimization|system-observability)(\/|$)/i.test(path)) return false;
  return Boolean(getPageKey(path));
}

function deviceType() {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth || 1024;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function browserName() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "edge";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
  if (/Firefox\//.test(ua)) return "firefox";
  return "unknown";
}

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window?.gtag === "function") {
      window.gtag("event", eventName, params);
    } else if (Array.isArray(window?.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (error) {
    console.warn("[analytics] event failed", error?.message);
  }
}

async function saveProof(record) {
  try {
    const result = await base44.functions.invoke("recordConversionTrackingEvent", record);
    if (result?.data?.success !== false) return record;
  } catch (error) {
    console.warn("[analytics] function proof failed", error?.message);
  }
  try {
    await ConversionTrackingEvent.create(record);
    return record;
  } catch (error) {
    console.warn("[analytics] entity proof failed", error?.message);
    return null;
  }
}

export function trackConversionProof(eventType, options = {}) {
  if (typeof window === "undefined") return null;
  const pathname = options.pathname || window.location.pathname;
  if (!isProductionTrackablePath(pathname)) return null;
  const pageKey = options.page_key || getPageKey(pathname);
  if (!pageKey) return null;

  const label = String(options.event_label || options.label || eventType).slice(0, 180);
  const key = `${sessionId()}|${pageKey}|${eventType}|${label}`;
  const now = Date.now();
  if (now - (recent.get(key) || 0) < (options.dedupe_window_ms || 10000)) return null;
  recent.set(key, now);

  const record = {
    event_id: id("conv"),
    session_id: sessionId(),
    page_key: pageKey,
    event_type: eventType,
    event_label: label,
    timestamp: new Date(now).toISOString(),
    metadata: {
      device_type: deviceType(),
      browser: browserName(),
      destination: options.metadata?.destination,
    },
  };
  return saveProof(record);
}

export function trackCTA(label, destination, extra = {}) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  trackEvent("cta_click", { cta_label: label, cta_location: pathname, ...extra });
  return trackConversionProof("cta_click", {
    pathname,
    event_label: label,
    metadata: { ...extra, destination },
  });
}
