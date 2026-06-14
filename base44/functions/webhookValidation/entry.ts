// Task #23: Webhook validation with shared secret verification
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

export async function validateWebhookRequest(req, sharedSecret) {
  try {
    const signature = req.headers.get("x-webhook-signature");
    if (!signature) {
      return { valid: false, error: "Missing signature header" };
    }

    const body = await req.text();
    const hash = createHmac("sha256", sharedSecret, body.getBytes());
    const expected = hash.toString();

    if (signature !== expected) {
      return { valid: false, error: "Invalid signature" };
    }

    return { valid: true, body: JSON.parse(body) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Task #27: Malformed JSON handling
export function handleMalformedJSON(error) {
  return new Response(
    JSON.stringify({ error: "Invalid JSON payload", details: error.message }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// Task #24: E.164 phone normalization
export function normalizeE164(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10) return null;
  return `+${cleaned}`;
}