// Task #26: Automation job retry limits and timeout constraints
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export const TIMEOUT_CONFIG = {
  LLM_CALL_MS: 5000, // Task #25: LLM timeout 5s
  EXTERNAL_API_MS: 8000,
  WEBHOOK_DELIVERY_MS: 10000,
  DATABASE_QUERY_MS: 5000,
};

export function calculateBackoffDelay(attemptNumber) {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber - 1),
    RETRY_CONFIG.maxDelayMs
  );
  return delay + Math.random() * 1000; // Add jitter
}

export async function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}