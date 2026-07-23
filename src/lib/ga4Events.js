/**
 * GA4 Event Tracking - Forms, Links, and Page Engagement
 * Integrates with window.gtag() for comprehensive analytics
 */

export function trackFormSubmission(formName, formData = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'form_submit_attempt', {
      form_name: formName,
      form_id: formData.id || '',
      submission_status: 'attempted',
      ...Object.keys(formData).reduce((acc, key) => {
        if (!['password', 'token'].includes(key)) {
          acc[`form_${key}`] = String(formData[key]).substring(0, 100);
        }
        return acc;
      }, {})
    });
  }
}

export function trackLinkClick(linkUrl, linkText = '', category = 'outbound_link') {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'click', {
      link_url: linkUrl,
      link_text: linkText,
      event_category: category,
    });
  }
}

export function trackPageEngagement(engagementType, details = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', engagementType, {
      page_path: window.location.pathname,
      page_title: document.title,
      ...details,
    });
  }
}

export function trackConversion(conversionName, value = 0) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    const canonicalName = {
      checkout_click: 'begin_checkout',
      demo_booking: 'audit_request_started',
      demo_booking_click: 'audit_request_started',
      cta_click_auto: 'cta_click',
    }[conversionName] || conversionName;
    window.gtag('event', canonicalName, {
      value: value,
      page_path: window.location.pathname,
    });
  }
}

export function trackSignup(email, industry = '') {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'sign_up', {
      method: 'form',
      industry: industry,
    });
  }
}

export function trackScroll(threshold = 0.75) {
  if (typeof window === 'undefined') return;
  
  let hasTracked = false;
  const handleScroll = () => {
    if (hasTracked) return;
    
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollTop / docHeight;
    
    if (scrollPercent >= threshold && typeof window.gtag === 'function') {
      window.gtag('event', 'scroll_depth', {
        scroll_percentage: Math.round(scrollPercent * 100),
        page_path: window.location.pathname,
      });
      hasTracked = true;
      window.removeEventListener('scroll', handleScroll);
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
}
