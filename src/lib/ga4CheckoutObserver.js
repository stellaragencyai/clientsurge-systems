import { GA4_EVENTS, trackGa4Event } from "@/lib/ga4";
import { getUtmForAnalytics } from "@/lib/utmTracking";

const CHECKOUT_FUNCTION_FRAGMENT = "/functions/createCheckoutSession";
const AUDIT_REQUEST_FUNCTION_FRAGMENT = "/functions/scheduleDemoBooking";

function requestUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input?.url || "";
}

function requestPayload(input, init) {
  const body = init?.body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  if (input instanceof Request && typeof input.clone === "function") {
    return input
      .clone()
      .json()
      .catch(() => ({}));
  }

  return {};
}

function emit(eventName, params = {}) {
  return trackGa4Event(eventName, {
    ...getUtmForAnalytics(),
    ...params,
  });
}

function emitBeginCheckout(payload = {}) {
  const packageKey = payload?.package_key || "unknown";
  emit(GA4_EVENTS.BEGIN_CHECKOUT, {
    currency: "USD",
    checkout_source: payload?.source || "product_signup",
    checkout_session_created: true,
    items: [
      {
        item_id: packageKey,
        item_name: `ClientSurge ${packageKey}`,
        quantity: 1,
      },
    ],
  });
}

function emitAuditRequestSubmitted(payload = {}) {
  const industry = payload?.industry || payload?.business_type || "unknown";
  const pagePath = payload?.source_page || "/book";
  const hasWebsite = Boolean(payload?.website || payload?.business_website_url);

  emit(GA4_EVENTS.FORM_SUBMIT, {
    form_id: "audit_request_form",
    page_path: pagePath,
    source: "audit_request",
    submission_status: "success",
  });
  emit(GA4_EVENTS.AUDIT_REQUEST_SUBMITTED, {
    industry,
    requested_date: payload?.scheduled_date || "",
    source: pagePath,
    request_status: "requested",
    submission_status: "success",
  });
  emit(GA4_EVENTS.GENERATE_LEAD, {
    currency: "USD",
    value: 1,
    industry,
    has_website: hasWebsite ? "yes" : "no",
    lead_source: "audit_request",
    submission_status: "success",
  });
}

function observedOutcome(url) {
  if (url.includes(CHECKOUT_FUNCTION_FRAGMENT)) return "checkout";
  if (url.includes(AUDIT_REQUEST_FUNCTION_FRAGMENT)) return "audit_request";
  return "";
}

export function installGa4CheckoutObserver(win = globalThis.window) {
  if (!win || typeof win.fetch !== "function") return false;
  if (win.__clientsurgeGa4CheckoutObserverInstalled) return true;

  const originalFetch = win.fetch.bind(win);
  win.fetch = async (input, init) => {
    const outcome = observedOutcome(requestUrl(input));
    const payloadPromise = outcome ? Promise.resolve(requestPayload(input, init)) : null;
    const response = await originalFetch(input, init);

    if (outcome && response.ok) {
      Promise.all([
        payloadPromise,
        response
          .clone()
          .json()
          .catch(() => ({})),
      ])
        .then(([payload, result]) => {
          const data = result?.data && typeof result.data === "object" ? result.data : result;
          if (data?.success === false) return;

          if (outcome === "checkout") {
            const checkoutUrl = data?.url || result?.url;
            if (checkoutUrl) emitBeginCheckout(payload);
          } else if (outcome === "audit_request" && data?.success === true) {
            emitAuditRequestSubmitted(payload);
          }
        })
        .catch((error) => {
          console.warn("[ga4CheckoutObserver] outcome tracking failed:", error?.message);
        });
    }

    return response;
  };

  win.__clientsurgeGa4CheckoutObserverInstalled = true;
  return true;
}
