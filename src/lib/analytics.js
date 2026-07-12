import { getUtmForAnalytics } from "@/lib/utmTracking";
import { trackGa4Event } from "@/lib/ga4";

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return false;

  try {
    const enrichedParams = { ...getUtmForAnalytics(), ...params };
    return trackGa4Event(eventName, enrichedParams, window);
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
