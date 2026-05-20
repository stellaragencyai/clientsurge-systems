/**
 * retryFetch.ts — #125
 * Reusable retry wrapper for external API calls with exponential backoff.
 */
export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retryFetch(
  url: string,
  init: RequestInit = {},
  opts: RetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 500, timeoutMs = 10000, onRetry } = opts;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return res; // don't retry 4xx
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      onRetry?.(attempt, err);
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("retryFetch: max retries exceeded");
}

// #145: 10-second timeout wrapper specifically for enrichment calls
export async function timedFetch(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  return retryFetch(url, init, { retries: 1, timeoutMs });
}
