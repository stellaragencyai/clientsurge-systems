export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
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