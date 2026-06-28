import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getGa4MeasurementId } from '@/lib/ga4';

/**
 * Fires a GA4 page_view event on every SPA route change.
 * Without this, client-side navigation (React Router) is invisible to GA4
 * because the initial gtag config in index.html only fires once on page load.
 */
function fireGa4PageView(pathname) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    const measurementId = getGa4MeasurementId();
    if (measurementId) {
      window.gtag('config', measurementId, {
        page_path: pathname,
        send_page_view: true,
      });
    }
  } catch {
    // Analytics must never break navigation
  }
}

export function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return;
    }

    // Fire GA4 page_view for SPA route change
    fireGa4PageView(location.pathname);

    // Track page view in Base44 analytics
    Promise.resolve(base44.analytics.track({
      eventName: 'page_view',
      properties: {
        page: location.pathname,
        timestamp: new Date().toISOString(),
      },
    })).catch((error) => {
      console.warn("Base44 page-view analytics unavailable:", error);
    });
  }, [location.pathname]);
}