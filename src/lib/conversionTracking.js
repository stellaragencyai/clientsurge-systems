/**
 * Conversion Tracking & GA4 Integration Utilities
 * Handles frontend event tracking for landing pages
 */

import { v4 as uuidv4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';

// Session ID stored in session storage for consistency
const getSessionId = () => {
  if (typeof sessionStorage === 'undefined') return uuidv4();
  let sid = sessionStorage.getItem('cs_session_id');
  if (!sid) {
    sid = uuidv4();
    sessionStorage.setItem('cs_session_id', sid);
  }
  return sid;
};

// Extract UTM parameters from URL
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

// Detect device type
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

// Send conversion event to backend
export const trackConversionEvent = async (
  pageKey,
  eventType,
  eventLabel,
  metadata = {}
) => {
  try {
    const base44 = await import('@/api/base44Client').then((m) => m.base44);
    if (!base44) return;

    const sessionId = getSessionId();
    const utmParams = getUTMParams();

    const eventPayload = {
      event_id: uuidv4(),
      session_id: sessionId,
      page_key: pageKey,
      event_type: eventType,
      event_label: eventLabel || eventType,
      timestamp: new Date().toISOString(),
      metadata: {
        device_type: getDeviceType(),
        browser: navigator.userAgent,
        ...utmParams,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        ...metadata,
      },
    };

    // Store event in ConversionTrackingEvent entity
    await base44.asServiceRole.entities.ConversionTrackingEvent.create(eventPayload)
      .catch((err) => console.error('[trackConversionEvent]', err));

    // Send to GA4 if configured
    if (typeof gtag !== 'undefined') {
      gtag('event', eventType, {
        page_key: pageKey,
        event_label: eventLabel,
        ...metadata,
      });
    }
  } catch (err) {
    console.error('[trackConversionEvent]', err);
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

// Page view (called on mount)
export const trackPageView = (pageKey) => {
  trackConversionEvent(pageKey, 'page_view', `${pageKey} page viewed`);
};

// Form submission
export const trackFormSubmit = (pageKey, formName) => {
  trackConversionEvent(pageKey, 'form_submit', `Form Submitted - ${formName}`);
};