const TOKEN_TTL_DAYS = Number(Deno.env.get("SETUP_LINK_TOKEN_TTL_DAYS") || 21);

function getSecret() {
  return Deno.env.get("SETUP_LINK_SECRET") || Deno.env.get("APP_SECRET") || "clientsurge-dev-setup-link-secret-change-me";
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSha256(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export function setupTokenExpiry(days = TOKEN_TTL_DAYS) {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export async function signSetupLinkToken(orderId: string, customerEmail: string, expiresAt = setupTokenExpiry()) {
  const normalizedEmail = String(customerEmail || "").trim().toLowerCase();
  const payload = `${orderId}.${normalizedEmail}.${expiresAt}`;
  const signature = await hmacSha256(payload);
  return `${expiresAt}.${signature}`;
}

export async function validateSetupLinkToken(token: string | null | undefined, orderId: string, customerEmail: string) {
  if (!token) return { valid: false, reason: "missing_token" };
  const [expiresRaw, signature] = String(token).split(".");
  const expiresAt = Number(expiresRaw);
  if (!expiresAt || !signature) return { valid: false, reason: "malformed_token" };
  if (Date.now() > expiresAt) return { valid: false, reason: "expired_token" };

  const expected = await signSetupLinkToken(orderId, customerEmail, expiresAt);
  const expectedSignature = expected.split(".")[1];
  if (signature !== expectedSignature) return { valid: false, reason: "invalid_signature" };
  return { valid: true, reason: "valid", expires_at: new Date(expiresAt).toISOString() };
}

export async function buildSignedSetupUrl(appUrl: string, orderId: string, customerEmail: string) {
  const base = String(appUrl || "https://clientsurgesystems.com").replace(/\/$/, "");
  const token = await signSetupLinkToken(orderId, customerEmail);
  return `${base}/setup/credentials?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
}
