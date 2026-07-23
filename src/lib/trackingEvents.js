/**
 * GA4 Event Tracking Helpers
 * Track forms, links, page engagement, and conversions
 */

export function trackFormSubmit(formName) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'form_submit_attempt', { form_name: formName, submission_status: 'attempted' });
  }
}

export function trackLinkClick(url, text) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'link_click', { link_url: url, link_text: text });
  }
}

export function trackConversion(name, value = 0) {
  if (typeof window !== 'undefined' && window.gtag) {
    const canonicalName = {
      checkout_click: 'begin_checkout',
      demo_booking: 'audit_request_started',
      demo_booking_click: 'audit_request_started',
      cta_click_auto: 'cta_click',
    }[name] || name;
    window.gtag('event', canonicalName, { value });
  }
}

export function trackPageView() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', { page_path: window.location.pathname });
  }
}
