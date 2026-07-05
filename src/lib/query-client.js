import { QueryClient } from '@tanstack/react-query';


// Finding #117 — Retry with exponential backoff on transient frontend API errors.
// Retries 3 times with 1s, 4s, 9s delays (exponential backoff).
// Only retries on 5xx errors and network failures, not on 4xx client errors.
function shouldRetry(failureCount, error) {
  // Don't retry 4xx errors (client errors)
  const status = error?.response?.status || error?.status;
  if (status && status >= 400 && status < 500) return false;
  // Retry up to 3 times on 5xx or network errors
  return failureCount < 3;
}

function retryDelay(attemptIndex) {
  // Exponential backoff: 1s, 4s, 9s
  return Math.min(1000 * Math.pow(attemptIndex + 1, 2), 10_000);
}

// SPEED OPTIMIZATION #7: Standardized staleTime + placeholderData config
// - staleTime: 45s prevents re-fetch on every tab-switch / minor re-render
// - gcTime: 5min keeps data in cache between navigation
// - retry: 3 with exponential backoff for transient errors (Finding #117)
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      retryDelay: retryDelay,
      staleTime: 45_000,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});