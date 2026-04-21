export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}

export function trackCTA(label, location, extra = {}) {
  trackEvent("cta_click", {
    cta_label: label,
    cta_location: location,
    ...extra,
  });
}
