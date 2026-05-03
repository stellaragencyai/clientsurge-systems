import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

export function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    if (!appParams.hasBase44AppId) {
      return;
    }

    // Track page view
    base44.analytics.track({
      eventName: 'page_view',
      properties: {
        page: location.pathname,
        timestamp: new Date().toISOString(),
      },
    });
  }, [location.pathname]);
}
