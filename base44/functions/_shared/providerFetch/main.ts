/**
 * Safe Twilio fetch wrapper with error normalization.
 */

export async function twilioFetch(url, options) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    throw new Error(`Twilio request failed: ${err.message || "network error"}`);
  }
}

Deno.serve(() => new Response("OK", { status: 200 }));