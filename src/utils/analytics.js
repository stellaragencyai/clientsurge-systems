/**
 * analytics.js — #214
 * GA4 event tracking for: purchase, demo_booked, lead_submitted
 * Call these functions at the relevant trigger points.
 */

function gtag(...args) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

// Fire on successful Stripe checkout (order confirmed page)
export function trackPurchase({ order_id, package_key, value, currency = "USD" }) {
  gtag("event", "purchase", {
    transaction_id: order_id,
    value: Number(value) || 0,
    currency,
    items: [{ item_id: package_key, item_name: package_key, quantity: 1, price: Number(value) || 0 }],
  });
}

// Fire when demo booking is confirmed
export function trackDemoBooked({ lead_id, industry, source } = {}) {
  gtag("event", "demo_booked", {
    event_category: "engagement",
    lead_id: lead_id || "unknown",
    industry: industry || "unknown",
    source: source || "direct",
  });
}

// Fire on LeadCaptureForm successful submit
export function trackLeadSubmitted({ industry, source, has_website } = {}) {
  gtag("event", "lead_submitted", {
    event_category: "lead_generation",
    industry: industry || "unknown",
    source: source || "organic",
    has_website: has_website ? "yes" : "no",
  });
}

// Fire on any CTA click for funnel analysis
export function trackCTAClick({ cta_label, page, destination } = {}) {
  gtag("event", "cta_click", {
    event_category: "engagement",
    cta_label: cta_label || "unknown",
    page: page || window?.location?.pathname || "unknown",
    destination: destination || "unknown",
  });
}
