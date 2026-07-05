/**
 * UTM Parameter Tracking Utility
 * Captures, persists, and exposes UTM parameters for analytics attribution.
 * Fixes Audit Issue #20: Form submit events missing UTM parameters
 * Fixes Audit Issue #6: Stripe checkout missing lead-intent metadata
 */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const STORAGE_KEY = "cs_utm_params";
const SESSION_KEY = "cs_utm_session";

function safeParse(json) {
  try {
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

/**
 * Capture UTM parameters from the current URL and persist to sessionStorage.
 * Should be called on app init and on route changes.
 */
export function captureUtmParameters() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const captured = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) captured[key] = value;
  });

  // Also capture routing_key and industry_slug if present
  const routingKey = params.get("routing_key");
  if (routingKey) captured.routing_key = routingKey;

  const industrySlug = params.get("industry");
  if (industrySlug) captured.industry_slug = industrySlug;

  const leadId = params.get("lead_id");
  if (leadId) captured.lead_id = leadId;

  // Persist to sessionStorage (cleared when tab closes)
  if (Object.keys(captured).length > 0) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(captured));
    } catch {
      // Ignore storage failures
    }
  }

  return getUtmParameters();
}

/**
 * Get all persisted UTM parameters from sessionStorage.
 * Returns an object with whatever UTM params were captured.
 */
export function getUtmParameters() {
  if (typeof window === "undefined") return {};

  let stored = {};
  try {
    stored = safeParse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    stored = {};
  }

  // Merge with any UTM params still in the URL
  const params = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) stored[key] = value;
  });

  return stored;
}

/**
 * Get UTM parameters as a flat object suitable for GA4 event params.
 */
export function getUtmForAnalytics() {
  const utms = getUtmParameters();
  return {
    utm_source: utms.utm_source || "(direct)",
    utm_medium: utms.utm_medium || "(none)",
    utm_campaign: utms.utm_campaign || "(not set)",
    utm_content: utms.utm_content || "(not set)",
    utm_term: utms.utm_term || "(not set)",
  };
}

/**
 * Get UTM parameters as Stripe metadata (keys must be strings, max 40 chars).
 */
export function getUtmForStripeMetadata() {
  const utms = getUtmParameters();
  return {
    utm_source: String(utms.utm_source || "").substring(0, 40),
    utm_medium: String(utms.utm_medium || "").substring(0, 40),
    utm_campaign: String(utms.utm_campaign || "").substring(0, 40),
    utm_content: String(utms.utm_content || "").substring(0, 40),
    utm_term: String(utms.utm_term || "").substring(0, 40),
    routing_key: String(utms.routing_key || "").substring(0, 40),
    industry_slug: String(utms.industry_slug || "").substring(0, 40),
    lead_id: String(utms.lead_id || "").substring(0, 40),
  };
}

/**
 * Attach UTM parameters to a GA4 event payload.
 * Usage: trackEvent("form_submit", { ...getUtmForAnalytics(), form_id: "lead_form" })
 */
export function withUtm(eventParams = {}) {
  return { ...eventParams, ...getUtmForAnalytics() };
}