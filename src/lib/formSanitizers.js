import { normalizePhoneToE164 } from "./phoneNormalization";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value = "") {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function normalizePhone(value = "") {
  return normalizePhoneToE164(String(value || "")) || "";
}

export function isValidPhone(value = "") {
  return Boolean(normalizePhone(value));
}

export function normalizeOptionalUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function hiddenHoneypotFilled(value = "") {
  return String(value || "").trim().length > 0;
}

export function buildSourceAttribution(defaultSourcePage = "/") {
  if (typeof window === "undefined") {
    return { source_page: defaultSourcePage };
  }

  const params = new URLSearchParams(window.location.search);
  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("cs_utm_session") || "{}");
  } catch {
    stored = {};
  }

  const get = (key) => params.get(key) || stored[key] || "";

  return {
    source_page: window.location.pathname || defaultSourcePage,
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
    utm_content: get("utm_content"),
    utm_term: get("utm_term"),
    referrer: document.referrer || stored.referrer || "",
  };
}
