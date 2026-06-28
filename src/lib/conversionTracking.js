/**
 * Conversion Tracking & GA4 Integration Utilities
 * Handles frontend event tracking for landing pages
 *
 * Browser-safe: uses crypto.randomUUID() and window.gtag + base44.analytics.track
 */

// Session ID stored in session storage for consistency
const getSessionId = () => {
  if (typeof sessionStorage === 'undefined') return null;
  let sid = sessionStorage.getItem('cs_session_id');
  if (!sid) {
    sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    sessionStorage.setItem('cs_session_id', sid);
  }
  return sid;
};

// Extract UTM parameters from URL
export const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
  };
};

// Detect device type
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

// Fire event to GA4 via gtag (if available)
function fireGa4Event(eventType, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventType, params);
    }
  } catch (e) {
    // Analytics must never break user interactions
  }
}

// Fire event to Base44 analytics (if available)
function fireBase44Event(eventName, properties = {}) {
  try {
    if (typeof window === 'undefined') return;
    import('@/api/base44Client').then(({ base44 }) => {
      if (base44?.analytics?.track) {
        Promise.resolve(base44.analytics.track({ eventName, properties })).catch(() => {});
      }
    }).catch(() => {});
  } catch {
    // silent
  }
}

// Send conversion event to both GA4 and Base44 analytics
export const trackConversionEvent = async (
  pageKey,
  eventType,
  eventLabel,
  metadata = {}
) => {
  try {
    const sessionId = getSessionId();
    const utmParams = getUTMParams();

    const eventParams = {
      page_key: pageKey,
      event_label: eventLabel || eventType,
      session_id: sessionId,
      ...utmParams,
      ...metadata,
    };

    // Fire to GA4
    fireGa4Event(eventType, eventParams);

    // Fire to Base44 analytics
    fireBase44Event(eventType, {
      ...eventParams,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Analytics must never break user interactions
  }
};

// Track scroll depth
export const setupScrollTracking = (pageKey) => {
  if (typeof window === 'undefined') return;

  const thresholds = [25, 50, 75, 100];
  const tracked = new Set();

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    for (const threshold of thresholds) {
      if (scrollPercent >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);
        trackConversionEvent(
          pageKey,
          'scroll_depth',
          `Scroll ${threshold}%`,
          { scroll_depth: threshold }
        );
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
};

// CTA button click tracking
export const trackCTAClick = (pageKey, label) => {
  trackConversionEvent(pageKey, 'cta_click', label);
};

// Pricing page view
export const trackPricingView = (pageKey = 'pricing') => {
  trackConversionEvent(pageKey, 'pricing_view', 'Pricing Page Viewed');
};

// Checkout click
export const trackCheckoutClick = (pageKey, planName) => {
  trackConversionEvent(pageKey, 'checkout_click', `Checkout - ${planName}`);
};

// Demo booking
export const trackDemoBooking = (pageKey) => {
  trackConversionEvent(pageKey, 'demo_booking_click', 'Demo Booking Initiated');
};

// Page view (called on mount and SPA route change)
export const trackPageView = (pageKey) => {
  trackConversionEvent(pageKey, 'page_view', `${pageKey} page viewed`);
};

// Form submission
export const trackFormSubmit = (pageKey, formName) => {
  trackConversionEvent(pageKey, 'form_submit', `Form Submitted - ${formName}`);
};