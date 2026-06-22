/**
 * GA4 Event Tracking Helpers
 * Track forms, links, page engagement, and conversions
 */

export function trackFormSubmit(formName) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'form_submit', { form_name: formName });
  }
}

export function trackLinkClick(url, text) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'link_click', { link_url: url, link_text: text });
  }
}

export function trackConversion(name, value = 0) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', { event_name: name, value });
  }
}

export function trackPageView() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', { page_path: window.location.pathname });
  }
}