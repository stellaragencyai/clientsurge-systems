/**
 * Conversion Tracking & GA4 Integration Utilities
 * Routes first-party events through an idempotent backend function so browser
 * retries cannot inflate production analytics.
 */

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
};

const getSessionId = () => {
  if (typeof sessionStorage === 'undefined') return newId();
  let sid = sessionStorage.getItem('cs_session_id');
  if (!sid) {
    sid = newId();
    sessionStorage.setItem('cs_session_id', sid);
  }
  return sid;
};

export const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
  };
};

export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

const getEnvironment = () => {
  if (typeof window === 'undefined') return 'internal';
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return 'internal';
  if (host.includes('smoke') || host.includes('test')) return 'smoke';
  if (host.includes('staging') || host.includes('preview')) return 'qa';
  return 'production';
};

export const trackConversionEvent = async (
  pageKey,
  eventType,
  eventLabel,
  metadata = {}
) => {
  const eventId = newId();
  try {
    const base44 = await import('@/api/base44Client').then((m) => m.base44);
    if (!base44) return { success: false, error: 'base44_unavailable', event_id: eventId };

    const payload = {
      event_id: eventId,
      session_id: getSessionId(),
      page_key: pageKey,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      route: typeof window !== 'undefined' ? window.location.pathname : '',
      event_type: eventType,
      event_label: eventLabel || eventType,
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
      consent_state: metadata.consent_state || 'unknown',
      release_version: import.meta.env?.VITE_RELEASE_VERSION || import.meta.env?.VITE_GIT_COMMIT_SHA || 'unversioned',
      tracking_version: '2.0.0',
      client_id: metadata.client_id || '',
      client_project_id: metadata.client_project_id || '',
      metadata: {
        device_type: getDeviceType(),
        browser: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...getUTMParams(),
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        ...metadata,
      },
    };

    const result = await base44.functions.invoke('captureConversionEvent', payload);

    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('event', eventType, {
        event_id: eventId,
        page_key: pageKey,
        event_label: eventLabel,
        ...metadata,
      });
    }

    return result?.data || result || { success: true, event_id: eventId };
  } catch (err) {
    console.error('[trackConversionEvent]', err);
    return { success: false, error: err?.message || 'tracking_failed', event_id: eventId };
  }
};

export const setupScrollTracking = (pageKey) => {
  if (typeof window === 'undefined') return;
  const thresholds = [25, 50, 75, 100];
  const tracked = new Set();

  const handleScroll = () => {
    const denominator = document.documentElement.scrollHeight - window.innerHeight;
    if (denominator <= 0) return;
    const scrollPercent = Math.round((window.scrollY / denominator) * 100);
    for (const threshold of thresholds) {
      if (scrollPercent >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);
        trackConversionEvent(pageKey, 'scroll_depth', `Scroll ${threshold}%`, { scroll_depth: threshold });
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
};

export const trackCTAClick = (pageKey, label) => trackConversionEvent(pageKey, 'cta_click', label);
export const trackPricingView = (pageKey = 'pricing') => trackConversionEvent(pageKey, 'pricing_view', 'Pricing Page Viewed');
export const trackCheckoutClick = (pageKey, planName) => trackConversionEvent(pageKey, 'checkout_click', `Checkout - ${planName}`);
export const trackDemoBooking = (pageKey) => trackConversionEvent(pageKey, 'demo_booking_click', 'Demo Booking Initiated');
export const trackPageView = (pageKey) => trackConversionEvent(pageKey, 'page_view', `${pageKey} page viewed`);
export const trackFormSubmit = (pageKey, formName) => trackConversionEvent(pageKey, 'form_submit', `Form Submitted - ${formName}`);
