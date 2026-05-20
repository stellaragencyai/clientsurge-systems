/**
 * ga4Events.js — #295 #296
 * GA4 event tracking for: checkout clicks, form submissions, demo bookings, lead submits.
 * Uses gtag() — requires GA4 snippet in index.html.
 */

function gtag(...args) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

// #295: Checkout button click → GA4 purchase-intent event
export function trackCheckoutClick({ package_key, monthly_rate, setup_fee }) {
  gtag("event", "begin_checkout", {
    currency: "USD",
    value: setup_fee || 0,
    items: [{ item_id: package_key, item_name: `ClientSurge ${package_key}`, price: monthly_rate || 0 }],
  });
}

// #295: Stripe checkout completed (called from order-success page)
export function trackPurchase({ order_id, package_key, monthly_rate, setup_fee }) {
  gtag("event", "purchase", {
    transaction_id: order_id,
    currency: "USD",
    value: setup_fee || 0,
    items: [{ item_id: package_key, item_name: `ClientSurge ${package_key}`, price: monthly_rate || 0 }],
  });
}

// #296: Lead capture form submitted
export function trackLeadSubmit({ industry, has_website }) {
  gtag("event", "generate_lead", {
    currency: "USD",
    value: 1,
    industry: industry || "unknown",
    has_website: has_website ? "yes" : "no",
  });
}

// #296: Demo booking form submitted
export function trackDemoBooked({ industry, scheduled_date }) {
  gtag("event", "demo_booked", {
    category: "conversion",
    industry: industry || "unknown",
    scheduled_date,
  });
}

// #296: Contact form submitted
export function trackContactSubmit({ source }) {
  gtag("event", "contact_form_submit", { source: source || "homepage" });
}

// #296: Onboarding form submitted
export function trackOnboardingSubmit({ package_key }) {
  gtag("event", "onboarding_complete", { package_key });
}
