import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";

/**
 * Initialize auto-tracking via data-track attributes
 * Call this once in your main app initialization
 * 
 * Usage in HTML:
 * <button data-track="nav-book-demo">Book Demo</button>
 * <a href="/pricing" data-track="hero-pricing-link">See Pricing</a>
 * 
 * Auto-fired event names will include [section]-[component]-[action]
 */
export function initializeAnalyticsObserver() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (!appParams.hasBase44AppId) {
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

        try {
          base44.analytics.track({
            eventName,
            properties: {
              element: target.tagName,
              text: target.textContent?.substring(0, 50),
              section: trackingSection,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error(`Failed to track click: ${eventName}`, error);
        }
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

        try {
          base44.analytics.track({
            eventName,
            properties: {
              formName: form.name || form.id,
              section: trackingSection,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error(`Failed to track form submission: ${eventName}`, error);
        }
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
  if (!appParams.hasBase44AppId) {
    return;
  }

  const eventName = `${section}-${component}-${action}`;

  try {
    base44.analytics.track({
      eventName,
      properties: {
        section,
        component,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`Failed to track event: ${eventName}`, error);
  }
}
