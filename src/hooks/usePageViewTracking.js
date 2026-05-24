import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function isLocalPreviewHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
}

export function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    if (isLocalPreviewHost()) return;

    // Track page view
    Promise.resolve(base44.analytics.track({
      eventName: 'page_view',
      properties: {
        page: location.pathname,
        timestamp: new Date().toISOString(),
      },
    })).catch(() => {});
  }, [location.pathname]);
}
