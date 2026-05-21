export async function fetchWithTimeout(
  url,
  init = {},
  { timeoutMs = 10000, label = "external API request" } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${label} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function twilioFetch(url, init = {}, options = {}) {
  return fetchWithTimeout(url, init, {
    timeoutMs: 10000,
    label: "Twilio API request",
    ...options,
  });
}

export function stripeFetch(url, init = {}, options = {}) {
  return fetchWithTimeout(url, init, {
    timeoutMs: 15000,
    label: "Stripe API request",
    ...options,
  });
}
