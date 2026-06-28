/**
 * GA4 Event Tracking Helpers
 * Track forms, links, page engagement, and conversions
 */

function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

function getMeasurementId() {
  // The measurement ID is configured in index.html and lib/ga4.js
  // gtag('config', ...) with a page_path triggers a pageview in GA4
  // We read it from the data attribute on the script tag, or fall back
  try {
    if (typeof document !== 'undefined') {
      const script = document.querySelector('script[data-ga4-measurement-id]');
      if (script) return script.dataset.ga4MeasurementId;
    }
  } catch {}
  return 'G-XRYMZ1M31K';
}

export function trackFormSubmit(formName) {
  gtag('event', 'form_submit', { form_name: formName });
}

export function trackLinkClick(url, text) {
  gtag('event', 'link_click', { link_url: url, link_text: text });
}

export function trackConversion(name, value = 0) {
  gtag('event', 'conversion', { event_name: name, value });
}

export function trackPageView() {
  if (typeof window === 'undefined') return;
  const measurementId = getMeasurementId();
  gtag('config', measurementId, { page_path: window.location.pathname });
}