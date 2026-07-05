// Fix #20: Import UTM tracking to attach to all events
import { getUtmForAnalytics } from "@/lib/utmTracking";

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  try {
    // Attach UTM parameters to every event for attribution
    const enrichedParams = { ...getUtmForAnalytics(), ...params };
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, enrichedParams);
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...enrichedParams });
    }
  } catch (e) {
    // Analytics must never break user interactions
    console.warn("[analytics] trackEvent failed:", e?.message);
  }
}

export function trackCTA(label, location, extra = {}) {
  try {
    trackEvent("cta_click", {
      cta_label: label,
      cta_location: location,
      ...extra,
    });
  } catch (e) {
    console.warn("[analytics] trackCTA failed:", e?.message);
  }
}