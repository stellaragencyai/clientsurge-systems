/**
 * React-Query optimization patterns for dashboard metric calls
 * Implements staleTime and cacheTime for read-only metrics
 */

export const CACHE_CONFIG = {
  // Metrics that rarely change — cache for 5 minutes
  stableMetrics: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  },
  
  // Data that changes hourly — cache for 15 minutes
  frequentMetrics: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  },
  
  // Real-time data — minimal caching
  realtimeData: {
    staleTime: 1000 * 10, // 10 seconds
    cacheTime: 1000 * 60, // 1 minute
  },
  
  // Static lookups (industries, services, etc.)
  staticData: {
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  },
};

// Example usage in components:
// const { data } = useQuery({
//   queryKey: ['revenueAnalytics'],
//   queryFn: () => base44.functions.invoke('getRevenueAnalytics', {}),
//   ...CACHE_CONFIG.stableMetrics
// })

export function getOptimalCacheConfig(dataType) {
  // Returns best caching strategy based on data type
  const configMap = {
    'revenue': 'stableMetrics',
    'analytics': 'frequentMetrics',
    'leads': 'realtimeData',
    'industries': 'staticData',
    'services': 'staticData',
    'automations': 'frequentMetrics',
  };
  
  const strategy = configMap[dataType] || 'frequentMetrics';
  return CACHE_CONFIG[strategy];
}

export const QUERY_KEYS = {
  dashboard: {
    revenue: ['dashboard', 'revenue'],
    analytics: ['dashboard', 'analytics'],
    leads: ['dashboard', 'leads'],
  },
  admin: {
    leadsTable: ['admin', 'leads'],
    communicationLogs: ['admin', 'communications'],
    automations: ['admin', 'automations'],
  },
  static: {
    industries: ['static', 'industries'],
    services: ['static', 'services'],
  },
};