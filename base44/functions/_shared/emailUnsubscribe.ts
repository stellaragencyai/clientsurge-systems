const DEFAULT_TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }
  return mismatch === 0;
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

function readSecret(explicitSecret?: string) {
  const secret = explicitSecret || Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") || "";
  if (secret.length < 32) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

export type EmailUnsubscribePayload = {
  recipient_id: string;
  campaign_id: string;
  lead_id: string;
  email: string;
  exp: number;
};

export async function createEmailUnsubscribeToken(
  payload: Omit<EmailUnsubscribePayload, "exp"> & { exp?: number },
  explicitSecret?: string,
) {
  const secret = readSecret(explicitSecret);
  const completePayload: EmailUnsubscribePayload = {
    recipient_id: String(payload.recipient_id || ""),
    campaign_id: String(payload.campaign_id || ""),
    lead_id: String(payload.lead_id || ""),
    email: String(payload.email || "").trim().toLowerCase(),
    exp: Number(payload.exp || Math.floor(Date.now() / 1000) + DEFAULT_TOKEN_TTL_SECONDS),
  };

  if (!completePayload.recipient_id || !completePayload.campaign_id || !completePayload.lead_id || !completePayload.email) {
    throw new Error("Unsubscribe token payload is incomplete");
  }

  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(completePayload)));
  const signature = base64UrlEncode(await hmac(secret, encodedPayload));
  return `${encodedPayload}.${signature}`;
}

export async function verifyEmailUnsubscribeToken(token: string, explicitSecret?: string) {
  const secret = readSecret(explicitSecret);
  const [encodedPayload, encodedSignature, ...extra] = String(token || "").split(".");
  if (!encodedPayload || !encodedSignature || extra.length > 0) {
    throw new Error("Invalid unsubscribe token");
  }

  const suppliedSignature = base64UrlDecode(encodedSignature);
  const expectedSignature = await hmac(secret, encodedPayload);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
    throw new Error("Invalid unsubscribe token signature");
  }

  let payload: EmailUnsubscribePayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
  } catch {
    throw new Error("Invalid unsubscribe token payload");
  }

  if (!payload?.recipient_id || !payload?.campaign_id || !payload?.lead_id || !payload?.email) {
    throw new Error("Incomplete unsubscribe token payload");
  }
  if (!Number.isFinite(payload.exp) || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Unsubscribe token has expired");
  }

  return payload;
}
