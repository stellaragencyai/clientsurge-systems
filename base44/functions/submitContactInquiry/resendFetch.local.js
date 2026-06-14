import { fetchWithTimeout } from "./providerFetch.local.js";

const RETRYABLE_RESEND_STATUSES = new Set([429, 500, 502, 503, 504]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resendFetch(
  url,
  init = {},
  { retryDelayMs = 2000, timeoutMs = 10000 } = {}
) {
  const firstResponse = await fetchWithTimeout(url, init, {
    timeoutMs,
    label: "Resend API request",
  });

  if (!RETRYABLE_RESEND_STATUSES.has(firstResponse.status)) {
    return firstResponse;
  }

  await delay(retryDelayMs);
  return fetchWithTimeout(url, init, {
    timeoutMs,
    label: "Resend API request",
  });
}
