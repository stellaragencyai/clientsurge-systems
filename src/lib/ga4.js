const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const GA4_SCRIPT_BASE = "https://www.googletagmanager.com/gtag/js";
const CONSENT_STORAGE_KEYS = ["cookie-consent", "cs_cookie_consent"];
const DEFAULT_GA4_MEASUREMENT_ID = "G-H6QT342ZN9";

const DENIED_CONSENT = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

const GRANTED_CONSENT = {
  analytics_storage: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
};

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

function parseStoredConsent(value) {
  if (!value) return null;
  if (value === "accepted") return { analytics: true, ads: true };
  if (value === "declined" || value === "dismissed") return { analytics: false, ads: false };

  try {
    const parsed = JSON.parse(value);
    return {
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
    };
  } catch {
    return null;
  }
}

function buildConsentState(preferences) {
  if (!preferences) return DENIED_CONSENT;

  return {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.ads ? "granted" : "denied",
    ad_user_data: preferences.ads ? "granted" : "denied",
    ad_personalization: preferences.ads ? "granted" : "denied",
  };
}

export function getGa4MeasurementId(env = getDefaultEnv()) {
  const measurementId = String(
    env.VITE_GA4_MEASUREMENT_ID ||
      env.VITE_GOOGLE_ANALYTICS_ID ||
      env.VITE_GA_MEASUREMENT_ID ||
      DEFAULT_GA4_MEASUREMENT_ID
  )
    .trim()
    .toUpperCase();

  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : "";
}

export function getStoredConsentPreferences(win = globalThis.window) {
  for (const key of CONSENT_STORAGE_KEYS) {
    const parsed = parseStoredConsent(readStorageValue(win, key));
    if (parsed) return parsed;
  }

  return null;
}

export function hasGrantedAnalyticsConsent(win = globalThis.window) {
  return Boolean(getStoredConsentPreferences(win)?.analytics);
}

export function updateGa4Consent(preferencesOrGranted, win = globalThis.window) {
  if (!win || typeof win.gtag !== "function") return false;

  const preferences =
    typeof preferencesOrGranted === "boolean"
      ? { analytics: preferencesOrGranted, ads: preferencesOrGranted }
      : preferencesOrGranted;

  win.gtag("consent", "update", buildConsentState(preferences));

  return true;
}

export function installGa4({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  measurementId = getGa4MeasurementId(),
  consentPreferences = getStoredConsentPreferences(windowRef),
} = {}) {
  if (!documentRef || !windowRef) {
    return { installed: false, reason: "missing_browser_context" };
  }

  if (!measurementId) {
    return { installed: false, reason: "missing_measurement_id" };
  }

  const existingScript = documentRef.querySelector(
    `script[data-ga4-measurement-id="${measurementId}"]`
  );

  windowRef.dataLayer = windowRef.dataLayer || [];
  windowRef.gtag =
    windowRef.gtag ||
    function gtag() {
      windowRef.dataLayer.push(arguments);
    };

  // Consent Mode v2 default must be set before any Google tag loads.
  windowRef.gtag("consent", "default", buildConsentState(consentPreferences));

  if (existingScript) {
    return { installed: true, measurementId, alreadyInstalled: true };
  }

  windowRef.gtag("js", new Date());
  windowRef.gtag("config", measurementId, {
    // The app separately records page/conversion events. Avoid client-side double page_views.
    send_page_view: false,
  });

  const script = documentRef.createElement("script");
  script.async = true;
  script.src = `${GA4_SCRIPT_BASE}?id=${encodeURIComponent(measurementId)}`;
  script.dataset.ga4MeasurementId = measurementId;
  documentRef.head.appendChild(script);

  return { installed: true, measurementId, alreadyInstalled: false };
}

export { DENIED_CONSENT, GRANTED_CONSENT };
