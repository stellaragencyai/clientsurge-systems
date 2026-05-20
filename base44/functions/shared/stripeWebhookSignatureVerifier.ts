/**
 * stripeWebhookSignatureVerifier.ts — #468 CRITICAL
 * Proper Stripe-signature verification using STRIPE_WEBHOOK_SECRET.
 * Drop-in for all Stripe webhook handlers.
 */

export async function verifyStripeSignature(req: Request): Promise<{ valid: boolean; payload?: string; error?: string }> {
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return { valid: false, error: "STRIPE_WEBHOOK_SECRET not set" };
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return { valid: false, error: "Missing stripe-signature header" };
  }

  const payload = await req.text();

  // Parse timestamp and signatures from header
  const parts = Object.fromEntries(signature.split(",").map(p => p.split("=")));
  const timestamp = parts["t"];
  const sigV1 = parts["v1"];

  if (!timestamp || !sigV1) {
    return { valid: false, error: "Malformed stripe-signature" };
  }

  // Reject if timestamp > 5 min old (replay protection)
  const age = Date.now() / 1000 - parseInt(timestamp);
  if (age > 300) {
    return { valid: false, error: `Webhook too old: ${Math.round(age)}s` };
  }

  // HMAC-SHA256
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (expectedSig !== sigV1) {
    return { valid: false, error: "Signature mismatch" };
  }

  return { valid: true, payload };
}
