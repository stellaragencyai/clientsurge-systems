/**
 * Webhook Security Helpers
 * Provides Svix signature verification and auth error responses for webhook handlers.
 */

/**
 * Verify a Svix-signed webhook request (used by Resend and other providers).
 * Returns { ok: boolean, code?: string }.
 */
export async function verifySvixWebhookRequest({ payload, headers, secret }) {
  if (!secret) {
    return { ok: false, code: "missing_secret" };
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { ok: false, code: "missing_svix_headers" };
  }

  // Reject stale timestamps (5-minute tolerance)
  const now = Math.floor(Date.now() / 1000);
  const age = now - parseInt(svixTimestamp, 10);
  if (Math.abs(age) > 300) {
    return { ok: false, code: "stale_timestamp" };
  }

  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const expectedSig =
    "v1," +
    Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const signatures = svixSignature.split(" ");
  const isValid = signatures.some((s) => s === expectedSig);

  return { ok: isValid, code: isValid ? null : "signature_mismatch" };
}

/**
 * Build a standard auth error response for webhook handlers.
 */
export function buildWebhookAuthErrorResponse({ provider, code }) {
  const messages = {
    missing_secret: `${provider} webhook secret not configured`,
    missing_svix_headers: `Missing ${provider} Svix signature headers`,
    stale_timestamp: `${provider} webhook timestamp too old`,
    signature_mismatch: `Invalid ${provider} webhook signature`,
  };

  const message = messages[code] || `${provider} webhook authentication failed`;
  return Response.json({ error: message, code }, { status: 401 });
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));