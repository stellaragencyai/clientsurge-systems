import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return;
    }

    // Track page view
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
