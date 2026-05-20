/**
 * withTimeout.ts — #160
 * Wraps any external API fetch with an AbortController timeout.
 * Default: 10s for Twilio/Resend, 15s for Stripe.
 */

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request to ${url.split("?")[0]} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Pre-configured timeouts per provider
export const twilioFetch  = (url: string, opts: RequestInit) => fetchWithTimeout(url, opts, 10000);
export const resendFetch  = (url: string, opts: RequestInit) => fetchWithTimeout(url, opts, 10000);
export const stripeFetch  = (url: string, opts: RequestInit) => fetchWithTimeout(url, opts, 15000);
