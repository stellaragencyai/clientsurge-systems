/**
 * Core Web Vitals Monitoring
 * Fixes Audit Issue #68: Slow page load speed hurts SEO
 *
 * Tracks LCP, FID, CLS and sends to GA4.
 * No external dependency — uses native PerformanceObserver API.
 */

const METRIC_NAMES = {
  LCP: "largest_contentful_paint",
  FID: "first_input_delay",
  CLS: "cumulative_layout_shift",
  FCP: "first_contentful_paint",
  TTFB: "time_to_first_byte",
};

let initialized = false;

function sendToGA4(eventName, value) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "web_vitals", {
    metric_name: eventName,
    metric_value: Math.round(value * 100) / 100,
    page_path: window.location.pathname,
    metric_rating: getRating(eventName, value),
  });
}

function getRating(metric, value) {
  switch (metric) {
    case METRIC_NAMES.LCP:
      if (value <= 2500) return "good";
      if (value <= 4000) return "needs-improvement";
      return "poor";
    case METRIC_NAMES.FID:
      if (value <= 100) return "good";
      if (value <= 300) return "needs-improvement";
      return "poor";
    case METRIC_NAMES.CLS:
      if (value <= 0.1) return "good";
      if (value <= 0.25) return "needs-improvement";
      return "poor";
    case METRIC_NAMES.FCP:
      if (value <= 1800) return "good";
      if (value <= 3000) return "needs-improvement";
      return "poor";
    case METRIC_NAMES.TTFB:
      if (value <= 800) return "good";
      if (value <= 1800) return "needs-improvement";
      return "poor";
    default:
      return "unknown";
  }
}

function observeLCP() {
  if (typeof PerformanceObserver === "undefined") return;

  let lastEntry = null;
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        lastEntry = entries[entries.length - 1];
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });

    // Report on page hide
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && lastEntry) {
        sendToGA4(METRIC_NAMES.LCP, lastEntry.startTime);
        observer.disconnect();
      }
    });
  } catch {
    // LCP observer not supported
  }
}

function observeFID() {
  if (typeof PerformanceObserver === "undefined") return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        sendToGA4(METRIC_NAMES.FID, entry.processingStart - entry.startTime);
      });
    });
    observer.observe({ type: "first-input", buffered: true });
  } catch {
    // FID observer not supported
  }
}

function observeCLS() {
  if (typeof PerformanceObserver === "undefined") return;

  let clsValue = 0;
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
    });
    observer.observe({ type: "layout-shift", buffered: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendToGA4(METRIC_NAMES.CLS, clsValue);
        observer.disconnect();
      }
    });
  } catch {
    // CLS observer not supported
  }
}

function observeFCP() {
  if (typeof PerformanceObserver === "undefined") return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          sendToGA4(METRIC_NAMES.FCP, entry.startTime);
        }
      });
    });
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // FCP observer not supported
  }
}

function observeTTFB() {
  if (typeof PerformanceObserver === "undefined") return;

  try {
    const [navigationEntry] = performance.getEntriesByType("navigation");
    if (navigationEntry) {
      sendToGA4(METRIC_NAMES.TTFB, navigationEntry.responseStart);
    }
  } catch {
    // Navigation entries not supported
  }
}

/**
 * Initialize Core Web Vitals monitoring.
 * Call once on app mount.
 */
export function initPerformanceMonitoring() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // Wait for page load
  if (document.readyState === "complete") {
    startObservers();
  } else {
    window.addEventListener("load", startObservers, { once: true });
  }
}

function startObservers() {
  observeLCP();
  observeFID();
  observeCLS();
  observeFCP();
  observeTTFB();
}