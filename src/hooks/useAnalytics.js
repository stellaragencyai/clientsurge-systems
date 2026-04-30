import { useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useAnalytics - Hook for manual event tracking
 * @param {string} section - The section/page this hook is used in (e.g., "hero", "navbar", "pricing")
 * @returns {object} trackEvent function
 *
 * Usage:
 * const { trackEvent } = useAnalytics("hero");
 * <button onClick={() => trackEvent("cta-primary-click")}>Book Demo</button>
 *
 * Event names follow pattern: [component]-[action]
 * Examples: "cta-primary-click", "form-submit", "link-click"
 */
export function useAnalytics(section) {
  const trackEvent = useCallback(
    (component, action = "click") => {
      if (!section) {
        console.warn("useAnalytics: section prop is required");
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
    },
    [section]
  );

  return { trackEvent };
}

/**
 * useTrackableClick - Wrapper for elements that need data-track support
 * Works with both data-track attributes (auto) and manual tracking (manual)
 */
export function useTrackableElement(eventName) {
  const { trackEvent } = useAnalytics("component");

  const handleClick = useCallback(() => {
    trackEvent(eventName);
  }, [trackEvent, eventName]);

  return { handleClick };
}