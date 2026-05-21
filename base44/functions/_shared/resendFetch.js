const RETRYABLE_RESEND_STATUSES = new Set([429, 500, 502, 503, 504]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function resendFetch(
  url,
  init = {},
  { retryDelayMs = 2000, timeoutMs = 10000 } = {}
) {
  const firstResponse = await fetchWithTimeout(url, init, timeoutMs);

  if (!RETRYABLE_RESEND_STATUSES.has(firstResponse.status)) {
    return firstResponse;
  }

  await delay(retryDelayMs);
  return fetchWithTimeout(url, init, timeoutMs);
}
