/**
 * Safe Resend fetch wrapper with error normalization.
 * All Resend outbound paths use this to ensure consistent error handling.
 */

export async function resendFetch(url, options) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    throw new Error(`Resend request failed: ${err.message || "network error"}`);
  }
}

/**
 * Build a safe "from" address for Resend emails.
 * Always uses the display-name + email format required by Resend for deliverability.
 * Falls back to system@clientsurgesystems.com if no sender configured.
 */
export function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();

  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }

  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));