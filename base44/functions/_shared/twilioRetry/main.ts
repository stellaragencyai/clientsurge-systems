/**
 * Task 3 — Twilio SMS with exponential backoff retry on 429
 * Task 9 — Timing-safe signature comparison
 * Shared utilities — imported by other backend functions
 */

export async function sendSMSWithRetry({ accountSid, authToken, from, to, body }, maxRetries = 3) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });

    if (res.status === 429) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Twilio rate limited (attempt ${attempt + 1}). Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(`Twilio error ${res.status}: ${data?.message || JSON.stringify(data)}`);
    return data;
  }

  throw new Error('Twilio max retries exceeded');
}

/** Task 9 — Constant-time signature comparison (timing-attack safe) */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(() => new Response('shared module', { status: 200 }));