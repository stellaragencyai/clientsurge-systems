/**
 * Enhanced webhook signature validation with timing-safe comparison
 * Supports HMAC-SHA256 and HMAC-SHA1 (for Twilio compatibility)
 */
export async function validateWebhookSignature(body, signature, secret, algorithm = "SHA-256") {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: algorithm }, false, ["sign"]);
    const computed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computedHex = Array.from(new Uint8Array(computed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(computedHex, signature);
  } catch (error) {
    console.error("[SECURITY] Webhook signature validation error:", error);
    return false;
  }
}

/**
 * Timing-safe string comparison (prevents timing-based attacks)
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Parse and validate JSON payload with size limits
 * Prevents oversized/malformed payloads from causing issues
 */
export function validateJSONPayload(body, maxSize = 1048576) {
  // 1MB default limit
  if (!body || body.length > maxSize) {
    return { success: false, error: "Payload size exceeds limit" };
  }
  try {
    const data = JSON.parse(body);
    return { success: true, data };
  } catch (error) {
    console.warn("[WEBHOOK] Malformed JSON payload:", error.message);
    return { success: false, error: "Invalid JSON payload" };
  }
}

/**
 * E.164 phone normalization standard
 * Returns null if phone is invalid (not 10-15 digits)
 */
export function normalizePhoneE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) return null;
  return `+${cleaned}`;
}

/**
 * Centralized webhook request validator
 * Enforces signature validation, payload parsing, and security checks
 */
export async function validateWebhookRequest(req, secretKey, options = {}) {
  const { payloadMaxSize = 1048576, signatureHeader = "x-signature", algorithm = "SHA-256" } = options;

  // 1. Check method is POST
  if (req.method !== "POST") {
    return { valid: false, error: "Method not allowed", statusCode: 405 };
  }

  // 2. Get signature header
  const signature = req.headers.get(signatureHeader);
  if (!signature) {
    return { valid: false, error: "Missing signature", statusCode: 403 };
  }

  // 3. Read and validate body
  const body = await req.text();
  if (body.length > payloadMaxSize) {
    return { valid: false, error: "Payload too large", statusCode: 413 };
  }

  // 4. Validate JSON (if applicable)
  let payload = null;
  try {
    payload = JSON.parse(body);
  } catch {
    // Allow non-JSON payloads (e.g., form-encoded Twilio)
    payload = body;
  }

  // 5. Verify signature
  const isValid = await validateWebhookSignature(body, signature, secretKey, algorithm);
  if (!isValid) {
    console.warn("[SECURITY] Webhook signature mismatch", { timestamp: new Date().toISOString() });
    return { valid: false, error: "Invalid signature", statusCode: 403 };
  }

  return { valid: true, payload, body };
}