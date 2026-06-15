import { QueryClient } from '@tanstack/react-query';


// SPEED OPTIMIZATION #7: Standardized staleTime + placeholderData config
// - staleTime: 45s prevents re-fetch on every tab-switch / minor re-render
// - gcTime: 5min keeps data in cache between navigation
// - retry: 1 to avoid hammering backend on transient errors
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 45_000,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: "always",
    },
  },
});