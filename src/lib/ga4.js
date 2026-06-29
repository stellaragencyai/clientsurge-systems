const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/i;
const GA4_SCRIPT_BASE = "https://www.googletagmanager.com/gtag/js";
const CONSENT_STORAGE_KEYS = ["cookie-consent", "cs_cookie_consent"];
const PRODUCTION_GA4_MEASUREMENT_ID = "G-H6QT342ZN9";

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

  const existingScript = documentRef.querySelector(
    `script[data-ga4-measurement-id="${measurementId}"]`
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

  if (existingScript) {
    return { installed: true, measurementId, alreadyInstalled: true };
  }

  windowRef.gtag("js", new Date());
  windowRef.gtag("config", measurementId, { send_page_view: true });

  const script = documentRef.createElement("script");
  script.async = true;
  script.src = `${GA4_SCRIPT_BASE}?id=${encodeURIComponent(measurementId)}`;
  script.dataset.ga4MeasurementId = measurementId;
  documentRef.head.appendChild(script);

  return { installed: true, measurementId, alreadyInstalled: false };
}
