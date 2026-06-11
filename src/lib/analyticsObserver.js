import { base44 } from "@/api/base44Client";

function shouldSkipBase44Analytics() {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.DEV) return false;

  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

function trackBase44Event(payload, label) {
  if (shouldSkipBase44Analytics()) return;

  Promise.resolve(base44.analytics.track(payload)).catch((error) => {
    console.warn(`Base44 analytics unavailable: ${label}`, error);
  });
}

/**
 * Initialize auto-tracking via data-track attributes
 * Call this once in your main app initialization
 * 
 * Usage in HTML:
 * <button data-track="nav-free-automation-audit">Free Automation Audit</button>
 * <a href="/pricing" data-track="hero-pricing-link">See Pricing</a>
 * 
 * Auto-fired event names will include [section]-[component]-[action]
 */
export function initializeAnalyticsObserver() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Track all clicks on elements with data-track attribute
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target.closest("[data-track]");
      if (!target) return;

      const trackingId = target.getAttribute("data-track");
      const trackingSection = target.getAttribute("data-track-section") || "auto";

      if (trackingId) {
        const eventName = `${trackingSection}-${trackingId}`;

        trackBase44Event(
          {
            eventName,
            properties: {
              element: target.tagName,
              text: target.textContent?.substring(0, 50),
              section: trackingSection,
              timestamp: new Date().toISOString(),
            },
          },
          eventName
        );
      }
    },
    true
  );

  // Track form submissions with data-track attribute
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!form.hasAttribute("data-track")) return;

      const trackingId = form.getAttribute("data-track");
      const trackingSection = form.getAttribute("data-track-section") || "auto";

      if (trackingId) {
        const eventName = `${trackingSection}-${trackingId}-submit`;

        trackBase44Event(
          {
            eventName,
            properties: {
              formName: form.name || form.id,
              section: trackingSection,
              timestamp: new Date().toISOString(),
            },
          },
          eventName
        );
      }
    },
    true
  );
}

/**
 * Manual tracking function (if you prefer imperative calls)
 * Alternative to useAnalytics hook
 *
 * Usage:
 * trackEvent("navbar", "book-demo", "click")
 */
export function trackEvent(section, component, action = "click") {
  const eventName = `${section}-${component}-${action}`;

  trackBase44Event(
    {
      eventName,
      properties: {
        section,
        component,
        action,
        timestamp: new Date().toISOString(),
      },
    },
    eventName
  );
}
