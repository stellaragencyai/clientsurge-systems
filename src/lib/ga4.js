const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const GA4_SCRIPT_BASE = "https://www.googletagmanager.com/gtag/js";
const CONSENT_STORAGE_KEYS = ["cookie-consent", "cs_cookie_consent"];
const PRODUCTION_GA4_MEASUREMENT_ID = "G-H6QT342ZN9";
const EVENT_DEDUP_WINDOW_MS = 1000;

export const GA4_EVENTS = Object.freeze({
  PAGE_VIEW: "page_view",
  SCROLL: "scroll",
  SCROLL_DEPTH: "scroll_depth",
  CTA_CLICK: "cta_click",
  PRICING_VIEW: "pricing_view",
  LINK_CLICK: "link_click",
  FORM_SUBMIT_ATTEMPT: "form_submit_attempt",
  FORM_SUBMIT: "form_submit",
  GENERATE_LEAD: "generate_lead",
  CONTACT_FORM_SUBMIT: "contact_form_submit",
  AUDIT_REQUEST_STARTED: "audit_request_started",
  AUDIT_REQUEST_SUBMITTED: "audit_request_submitted",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  DEMO_BOOKED: "demo_booked",
  ONBOARDING_COMPLETE: "onboarding_complete",
});

export const GA4_KEY_EVENTS = Object.freeze([
  GA4_EVENTS.GENERATE_LEAD,
  GA4_EVENTS.BEGIN_CHECKOUT,
  GA4_EVENTS.PURCHASE,
  GA4_EVENTS.DEMO_BOOKED,
]);

const LEGACY_EVENT_ALIASES = Object.freeze({
  checkout_click: GA4_EVENTS.BEGIN_CHECKOUT,
  cta_click_auto: GA4_EVENTS.CTA_CLICK,
  demo_booking: GA4_EVENTS.AUDIT_REQUEST_STARTED,
  demo_booking_click: GA4_EVENTS.AUDIT_REQUEST_STARTED,
});

function getDefaultEnv() {
  return import.meta.env || {};
}

function readStorageValue(win, key) {
  try {
    return win?.localStorage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function getGa4State(win) {
  if (!win.__clientsurgeGa4State) {
    win.__clientsurgeGa4State = {
      installed: false,
      initialPageViewHandled: false,
      lastPagePath: "",
      recentEvents: new Map(),
    };
  }
  return win.__clientsurgeGa4State;
}

function commandParts(command) {
  if (!command || typeof command !== "object") return [];
  try {
    return Array.from(command);
  } catch {
    return [];
  }
}

function dataLayerContainsImplicitPageView(win, measurementId) {
  if (!Array.isArray(win?.dataLayer)) return false;
  return win.dataLayer.some((command) => {
    const [type, id, config] = commandParts(command);
    return type === "config" && id === measurementId && config?.send_page_view !== false;
  });
}

function stableParams(params = {}) {
  const output = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (value !== undefined && typeof value !== "function") output[key] = value;
    });
  return output;
}

function eventSignature(eventName, params) {
  try {
    return `${eventName}:${JSON.stringify(stableParams(params))}`;
  } catch {
    return `${eventName}:${String(params?.event_label || params?.page_path || "")}`;
  }
}

export function normalizeGa4EventName(eventName, params = {}) {
  const rawName = String(eventName || "").trim();
  if (!rawName) return "";

  const aliasedName = LEGACY_EVENT_ALIASES[rawName] || rawName;
  if (
    aliasedName === GA4_EVENTS.FORM_SUBMIT &&
    params.submission_status !== "success"
  ) {
    return GA4_EVENTS.FORM_SUBMIT_ATTEMPT;
  }
  return aliasedName;
}

export function getGa4MeasurementId(env = getDefaultEnv()) {
  const measurementId = String(
    env.VITE_GA4_MEASUREMENT_ID ||
      env.VITE_GOOGLE_ANALYTICS_ID ||
      env.VITE_GA_MEASUREMENT_ID ||
      PRODUCTION_GA4_MEASUREMENT_ID
  )
    .trim()
    .toUpperCase();

  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : "";
}

export function hasGrantedAnalyticsConsent(win = globalThis.window) {
  return CONSENT_STORAGE_KEYS.some((key) => readStorageValue(win, key) === "accepted");
}

export function updateGa4Consent(granted, win = globalThis.window) {
  if (!win || typeof win.gtag !== "function") return false;

  win.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
  });

  return true;
}

export function trackGa4Event(eventName, params = {}, win = globalThis.window) {
  if (!win) return false;

  const normalizedName = normalizeGa4EventName(eventName, params);
  if (!normalizedName) return false;

  win.dataLayer = win.dataLayer || [];
  win.gtag =
    win.gtag ||
    function gtag() {
      win.dataLayer.push(arguments);
    };

  const state = getGa4State(win);
  const signature = eventSignature(normalizedName, params);
  const now = Date.now();
  const lastSentAt = state.recentEvents.get(signature) || 0;
  if (now - lastSentAt < EVENT_DEDUP_WINDOW_MS) return false;

  state.recentEvents.set(signature, now);
  if (state.recentEvents.size > 200) {
    for (const [key, sentAt] of state.recentEvents) {
      if (now - sentAt > 60_000) state.recentEvents.delete(key);
    }
  }

  win.gtag("event", normalizedName, params);
  return true;
}

export function trackGa4PageView(
  {
    pathname = globalThis.location?.pathname || "/",
    search = globalThis.location?.search || "",
    hash = globalThis.location?.hash || "",
    title = globalThis.document?.title || "",
    location = globalThis.location?.href || "",
  } = {},
  win = globalThis.window
) {
  if (!win) return false;

  const state = getGa4State(win);
  const measurementId = getGa4MeasurementId();
  const pagePath = `${pathname || "/"}${search || ""}${hash || ""}`;

  if (!state.initialPageViewHandled) {
    state.initialPageViewHandled = true;
    if (dataLayerContainsImplicitPageView(win, measurementId)) {
      state.lastPagePath = pagePath;
      return false;
    }
  }

  if (state.lastPagePath === pagePath) return false;
  state.lastPagePath = pagePath;

  return trackGa4Event(
    GA4_EVENTS.PAGE_VIEW,
    {
      page_path: pagePath,
      page_location: location,
      page_title: title,
    },
    win
  );
}

export function installGa4({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  measurementId = getGa4MeasurementId(),
  consentGranted = hasGrantedAnalyticsConsent(windowRef),
} = {}) {
  if (!documentRef || !windowRef) {
    return { installed: false, reason: "missing_browser_context" };
  }

  if (!measurementId) {
    return { installed: false, reason: "missing_measurement_id" };
  }

  const state = getGa4State(windowRef);
  const existingScript = documentRef.querySelector(
    `script[data-ga4-measurement-id="${measurementId}"], script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`
  );

  windowRef.dataLayer = windowRef.dataLayer || [];
  windowRef.gtag =
    windowRef.gtag ||
    function gtag() {
      windowRef.dataLayer.push(arguments);
    };

  windowRef.gtag("consent", "default", {
    analytics_storage: consentGranted ? "granted" : "denied",
    ad_storage: consentGranted ? "granted" : "denied",
  });

  if (!state.installed) {
    windowRef.gtag("js", new Date());
    windowRef.gtag("config", measurementId, {
      send_page_view: false,
      linker: {
        domains: ["clientsurgesystems.com", "www.clientsurgesystems.com"],
        use_incoming: true,
      },
    });
    state.installed = true;
  }

  if (!existingScript) {
    const script = documentRef.createElement("script");
    script.async = true;
    script.src = `${GA4_SCRIPT_BASE}?id=${encodeURIComponent(measurementId)}`;
    script.dataset.ga4MeasurementId = measurementId;
    documentRef.head.appendChild(script);
  }

  return {
    installed: true,
    measurementId,
    alreadyInstalled: Boolean(existingScript),
    consentGranted,
  };
}
