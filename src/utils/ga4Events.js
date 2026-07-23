import { trackEvent } from "@/lib/analytics";
import { GA4_EVENTS } from "@/lib/ga4";

function normalizedNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function trackCheckoutClick({ package_key, monthly_rate, setup_fee }) {
  const monthlyRate = normalizedNumber(monthly_rate);
  const setupFee = normalizedNumber(setup_fee);

  return trackEvent(GA4_EVENTS.CTA_CLICK, {
    cta_label: "checkout",
    cta_location: "product_signup",
    package_key,
    currency: "USD",
    value: setupFee + monthlyRate,
    checkout_source: "product_signup",
    items: [
      {
        item_id: package_key,
        item_name: `ClientSurge ${package_key}`,
        price: setupFee + monthlyRate,
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase({ order_id, package_key, monthly_rate, setup_fee, items = [] }) {
  const monthlyRate = normalizedNumber(monthly_rate);
  const setupFee = normalizedNumber(setup_fee);

  return trackEvent(GA4_EVENTS.PURCHASE, {
    transaction_id: order_id,
    currency: "USD",
    value: setupFee + monthlyRate,
    items: items.length
      ? items
      : [
          {
            item_id: package_key,
            item_name: `ClientSurge ${package_key}`,
            price: setupFee + monthlyRate,
            quantity: 1,
          },
        ],
  });
}

export function trackLeadSubmit({ industry, has_website, lead_source = "website" }) {
  return trackEvent(GA4_EVENTS.GENERATE_LEAD, {
    currency: "USD",
    value: 1,
    industry: industry || "unknown",
    has_website: has_website ? "yes" : "no",
    lead_source,
    submission_status: "success",
  });
}

export function trackAuditRequestStarted({ source = "website" } = {}) {
  return trackEvent(GA4_EVENTS.AUDIT_REQUEST_STARTED, {
    source,
  });
}

export function trackAuditRequestSubmitted({ industry, scheduled_date, source = "website" }) {
  return trackEvent(GA4_EVENTS.AUDIT_REQUEST_SUBMITTED, {
    industry: industry || "unknown",
    requested_date: scheduled_date || "",
    source,
    request_status: "requested",
    submission_status: "success",
  });
}

export function trackDemoBooked({ industry, scheduled_date, source = "admin_confirmation" }) {
  return trackEvent(GA4_EVENTS.DEMO_BOOKED, {
    industry: industry || "unknown",
    scheduled_date: scheduled_date || "",
    source,
    booking_status: "confirmed",
  });
}

export function trackContactSubmit({ source = "contact_page", industry = "unknown" } = {}) {
  return trackEvent(GA4_EVENTS.CONTACT_FORM_SUBMIT, {
    source,
    industry,
    submission_status: "success",
  });
}

export function trackSuccessfulFormSubmit({ form_id, page_path, source }) {
  return trackEvent(GA4_EVENTS.FORM_SUBMIT, {
    form_id,
    page_path,
    source,
    submission_status: "success",
  });
}

export function trackOnboardingSubmit({ package_key }) {
  return trackEvent(GA4_EVENTS.ONBOARDING_COMPLETE, {
    package_key,
    submission_status: "success",
  });
}
