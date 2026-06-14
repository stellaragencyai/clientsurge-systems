// Task #23: Webhook validation with HMAC signature verification
export async function validateWebhookSignature(body, signature, secret) {
  try {
    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const computed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computedHex = Array.from(new Uint8Array(computed)).map((b) => b.toString(16).padStart(2, "0")).join("");
    
    return signature === computedHex;
  } catch (error) {
    console.error("Webhook signature validation failed:", error);
    return false;
  }
}

// Task #27: Malformed JSON handler for all webhook endpoints
export function validateJSONPayload(body) {
  try {
    return { success: true, data: JSON.parse(body) };
  } catch (error) {
    return { success: false, error: "Invalid JSON payload" };
  }
}

// Task #24: E.164 phone normalization standard
export function normalizePhoneE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  return `+${cleaned}`;
}