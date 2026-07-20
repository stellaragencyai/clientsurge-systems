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
  PURCHASE_CLIENT_CONFIRMATION: "purchase_client_confirmation",
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

function getStoredConsentValue(win) {
  for (const key of CONSENT_STORAGE_KEYS) {
    const value = readStorageValue(win, key);
    if (value) return value;
  }
  return "";
}

function normalizeConsentInput(consent) {
  if (typeof consent === "boolean") {
    return {
      analyticsGranted: consent,
      adsGranted: consent,
    };
  }

  return {
    analyticsGranted: consent?.analyticsGranted === true || consent?.analytics === true,
    adsGranted: consent?.adsGranted === true || consent?.ads === true,
  };
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

function dataLayerConfig(win, measurementId) {
  if (!Array.isArray(win?.dataLayer)) return null;
  for (const command of win.dataLayer) {
    const [type, id, config] = commandParts(command);
    if (type === "config" && id === measurementId) return config || {};
  }
  return null;
}

function dataLayerContainsImplicitPageView(win, measurementId) {
  const config = dataLayerConfig(win, measurementId);
  return Boolean(config && config.send_page_view !== false);
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

function shouldDispatchEvent(win, eventName, params) {
  const state = getGa4State(win);
  const signature = eventSignature(eventName, params);
  const now = Date.now();
  const lastSentAt = state.recentEvents.get(signature) || 0;
  if (now - lastSentAt < EVENT_DEDUP_WINDOW_MS) return false;

  state.recentEvents.set(signature, now);
  if (state.recentEvents.size > 200) {
    for (const [key, sentAt] of state.recentEvents) {
      if (now - sentAt > 60_000) state.recentEvents.delete(key);
    }
  }
  return true;
}

function ensureGtagDispatcher(win) {
  win.dataLayer = win.dataLayer || [];
  if (win.gtag?.__clientsurgeGa4Dispatcher === true) return win.gtag;

  const existingGtag = typeof win.gtag === "function" ? win.gtag.bind(win) : null;
  const dispatcher = (...command) => {
    if (command[0] === "event") {
      const params = command[2] && typeof command[2] === "object" ? command[2] : {};
      const normalizedName = normalizeGa4EventName(command[1], params);
      if (!normalizedName || !shouldDispatchEvent(win, normalizedName, params)) return false;
      command[1] = normalizedName;
    }

    if (existingGtag) {
      existingGtag(...command);
    } else {
      win.dataLayer.push(command);
    }
    return true;
  };

  Object.defineProperty(dispatcher, "__clientsurgeGa4Dispatcher", {
    value: true,
    enumerable: false,
  });
  win.gtag = dispatcher;
  return dispatcher;
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

export function getGa4ConsentState(win = globalThis.window) {
  const storedValue = getStoredConsentValue(win);
  return {
    analyticsGranted: storedValue === "accepted" || storedValue === "analytics_only",
    adsGranted: storedValue === "accepted",
  };
}

export function hasGrantedAnalyticsConsent(win = globalThis.window) {
  return getGa4ConsentState(win).analyticsGranted;
}

export function updateGa4Consent(consent, win = globalThis.window) {
  if (!win) return false;

  const { analyticsGranted, adsGranted } = normalizeConsentInput(consent);
  const gtag = ensureGtagDispatcher(win);
  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: adsGranted ? "granted" : "denied",
    ad_user_data: adsGranted ? "granted" : "denied",
    ad_personalization: adsGranted ? "granted" : "denied",
  });

  return true;
}

export function trackGa4Event(eventName, params = {}, win = globalThis.window) {
  if (!win) return false;

  const normalizedName = normalizeGa4EventName(eventName, params);
  if (!normalizedName) return false;

  const state = getGa4State(win);
  if (!state.installed) {
    installGa4({
      documentRef: win.document || globalThis.document,
      windowRef: win,
      measurementId: getGa4MeasurementId(),
    });
  }

  return ensureGtagDispatcher(win)("event", normalizedName, params) !== false;
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
  consentState = getGa4ConsentState(windowRef),
} = {}) {
  if (!documentRef || !windowRef) {
    return { installed: false, reason: "missing_browser_context" };
  }

  if (!measurementId) {
    return { installed: false, reason: "missing_measurement_id" };
  }

  const normalizedConsent = normalizeConsentInput(consentState);
  const state = getGa4State(windowRef);
  const existingScript = documentRef.querySelector(
    `script[data-ga4-measurement-id="${measurementId}"], script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`
  );
  const existingConfig = dataLayerConfig(windowRef, measurementId);
  const gtag = ensureGtagDispatcher(windowRef);

  gtag("consent", "default", {
    analytics_storage: normalizedConsent.analyticsGranted ? "granted" : "denied",
    ad_storage: normalizedConsent.adsGranted ? "granted" : "denied",
    ad_user_data: normalizedConsent.adsGranted ? "granted" : "denied",
    ad_personalization: normalizedConsent.adsGranted ? "granted" : "denied",
  });

  if (!state.installed) {
    if (!existingConfig) {
      gtag("js", new Date());
      gtag("config", measurementId, {
        send_page_view: false,
        linker: {
          domains: ["clientsurgesystems.com", "www.clientsurgesystems.com"],
          use_incoming: true,
        },
      });
    }
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
    alreadyInstalled: Boolean(existingScript || existingConfig),
    consentState: normalizedConsent,
  };
}
