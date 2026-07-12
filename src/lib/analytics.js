import { getUtmForAnalytics } from "@/lib/utmTracking";
import { trackGa4Event } from "@/lib/ga4";
import { installGa4CheckoutObserver } from "@/lib/ga4CheckoutObserver";

if (typeof window !== "undefined") {
  installGa4CheckoutObserver(window);
}

function frontendEventName(eventName) {
  // Stripe webhooks are the source of truth for revenue. The browser success
  // page remains useful operational proof, but it must not create a second GA4
  // purchase key event for the same transaction.
  return eventName === "purchase" ? "purchase_client_confirmation" : eventName;
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return false;

  try {
    const enrichedParams = { ...getUtmForAnalytics(), ...params };
    return trackGa4Event(frontendEventName(eventName), enrichedParams, window);
  } catch (error) {
    console.warn("[analytics] trackEvent failed:", error?.message);
    return false;
  }
}

export function trackCTA(label, location, extra = {}) {
  try {
    return trackEvent("cta_click", {
      cta_label: label,
      cta_location: location,
      ...extra,
    });
  } catch (error) {
    console.warn("[analytics] trackCTA failed:", error?.message);
    return false;
  }
}
