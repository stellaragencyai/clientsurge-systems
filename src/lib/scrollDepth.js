/**
 * Scroll Depth Tracking Utility
 * Fires GA4 events at 25%, 50%, 75%, and 90% scroll thresholds.
 * Fixes Audit Issue #23: Missing scroll-depth events on sales pages
 */

const THRESHOLDS = [25, 50, 75, 90];
const TRACKED_KEY = "__cs_scroll_tracked__";

let observer = null;
let firedThresholds = new Set();

function getScrollPercent() {
  if (typeof document === "undefined") return 0;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

function fireScrollEvent(threshold) {
  if (firedThresholds.has(threshold)) return;
  firedThresholds.add(threshold);

  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "scroll_depth", {
      scroll_depth_percent: threshold,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }

  // Also track via base44 analytics
  if (typeof window !== "undefined" && window.base44?.analytics?.track) {
    window.base44.analytics.track({
      eventName: "scroll_depth",
      properties: {
        percent: threshold,
        page_path: window.location.pathname,
      },
    }).catch(() => {});
  }
}

function onScroll() {
  const percent = getScrollPercent();
  THRESHOLDS.forEach((threshold) => {
    if (percent >= threshold) {
      fireScrollEvent(threshold);
    }
  });
}

/**
 * Initialize scroll depth tracking.
 * Call once on app mount. Resets on route change via resetScrollTracking().
 */
export function initScrollDepthTracking() {
  if (typeof window === "undefined") return;

  // Reset on initialization
  firedThresholds.clear();

  // Debounced scroll handler
  let ticking = false;
  const handler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  };

  window.addEventListener("scroll", handler, { passive: true, once: false });

  // Check after a delay in case page is short
  setTimeout(onScroll, 2000);
}

/**
 * Reset scroll tracking state (call on route change).
 */
export function resetScrollTracking() {
  firedThresholds.clear();
  // Re-check after route transition
  setTimeout(onScroll, 500);
}