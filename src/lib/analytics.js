export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;
  // Note: Ensure Google Analytics (gtag) or GTM is loaded in index.html for events to fire

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

export function trackLeadSubmitted(location, extra = {}) {
  trackEvent("lead_submitted", {
    form_location: location,
    ...extra,
  });
}

export function trackDemoBooked(location, extra = {}) {
  trackEvent("demo_booked", {
    form_location: location,
    ...extra,
  });
}

export function trackPurchase(extra = {}) {
  trackEvent("purchase", {
    currency: "USD",
    ...extra,
  });
}
