const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

function getEnv(name) {
  if (typeof Deno !== "undefined" && Deno.env?.get) {
    return Deno.env.get(name);
  }

  if (typeof process !== "undefined") {
    return process.env?.[name];
  }

  return undefined;
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value;
  }

  return new TextEncoder().encode(String(value));
}

function decodeBase64(value) {
  if (typeof atob === "function") {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  }

  return Uint8Array.from(Buffer.from(value, "base64"));
}

function encodeBase64(bytes) {
  if (typeof btoa === "function") {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  return Buffer.from(bytes).toString("base64");
}

function constantTimeEqual(left, right) {
  const leftBytes = toUint8Array(left);
  const rightBytes = toUint8Array(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }

  return diff === 0;
}

async function hmacDigest({ algorithm, keyBytes, data }) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    toUint8Array(data)
  );

  return new Uint8Array(signature);
}

function getRequestUrlForSignature(req) {
  const originalUrl = new URL(req.url);
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || originalUrl.host;
  const protocol = forwardedProto || originalUrl.protocol.replace(":", "");

  return `${protocol}://${host}${originalUrl.pathname}${originalUrl.search}`;
}

function normalizeTwilioParams(formData) {
  const paramMap = new Map();
  for (const [key, value] of formData.entries()) {
    const existing = paramMap.get(key) || [];
    existing.push(String(value));
    paramMap.set(key, existing);
  }

  const normalized = {};
  [...paramMap.keys()].sort().forEach((key) => {
    normalized[key] = [...paramMap.get(key)].sort();
  });

  return normalized;
}

async function computeTwilioSignature({ authToken, url, formData }) {
  const normalizedParams = normalizeTwilioParams(formData);
  let payload = url;

  Object.keys(normalizedParams).forEach((key) => {
    normalizedParams[key].forEach((value) => {
      payload += key + value;
    });
  });

  const digest = await hmacDigest({
    algorithm: "SHA-1",
    keyBytes: toUint8Array(authToken),
    data: payload,
  });

  return encodeBase64(digest);
}

export function buildWebhookAuthErrorResponse({
  provider,
  code = "webhook_signature_invalid",
  status = 401,
}) {
  return Response.json(
    {
      error: "Untrusted webhook request",
      code,
      provider,
    },
    { status }
  );
}

export async function verifyTwilioWebhookRequest({ req, formData }) {
  const authToken = getEnv("TWILIO_AUTH_TOKEN");
  const signature = req.headers.get("x-twilio-signature");

  if (!authToken) {
    return {
      ok: false,
      code: "webhook_verification_not_configured",
      reason: "TWILIO_AUTH_TOKEN is not configured.",
    };
  }

  if (!signature) {
    return {
      ok: false,
      code: "webhook_signature_missing",
      reason: "X-Twilio-Signature header is missing.",
    };
  }

  const expectedSignature = await computeTwilioSignature({
    authToken,
    url: getRequestUrlForSignature(req),
    formData,
  });

  if (!constantTimeEqual(signature, expectedSignature)) {
    return {
      ok: false,
      code: "webhook_signature_invalid",
      reason: "X-Twilio-Signature did not match the expected signature.",
    };
  }

  return {
    ok: true,
  };
}

function getSvixHeader(headers, shortName) {
  return (
    headers.get(`svix-${shortName}`) ||
    headers.get(`webhook-${shortName}`) ||
    ""
  );
}

function parseSvixSignatures(signatureHeader) {
  return signatureHeader
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(",", 2))
    .filter(([version, signature]) => version && signature)
    .map(([version, signature]) => ({ version, signature }));
}

async function computeSvixSignature({ secret, messageId, timestamp, payload }) {
  const normalizedSecret = secret.startsWith("whsec_")
    ? secret.slice("whsec_".length)
    : secret;

  const digest = await hmacDigest({
    algorithm: "SHA-256",
    keyBytes: decodeBase64(normalizedSecret),
    data: `${messageId}.${timestamp}.${payload}`,
  });

  return encodeBase64(digest);
}

export async function verifySvixWebhookRequest({ payload, headers, secret }) {
  const messageId = getSvixHeader(headers, "id");
  const timestamp = getSvixHeader(headers, "timestamp");
  const signatureHeader = getSvixHeader(headers, "signature");

  if (!secret) {
    return {
      ok: false,
      code: "webhook_verification_not_configured",
      reason: "RESEND_WEBHOOK_SECRET is not configured.",
    };
  }

  if (!messageId || !timestamp || !signatureHeader) {
    return {
      ok: false,
      code: "webhook_signature_missing",
      reason: "Required Svix signature headers are missing.",
    };
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return {
      ok: false,
      code: "webhook_timestamp_invalid",
      reason: "Webhook timestamp is invalid.",
    };
  }

  const currentSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(currentSeconds - timestampSeconds) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) {
    return {
      ok: false,
      code: "webhook_timestamp_expired",
      reason: "Webhook timestamp is outside the allowed tolerance.",
    };
  }

  const expectedSignature = await computeSvixSignature({
    secret,
    messageId,
    timestamp,
    payload,
  });

  const signatures = parseSvixSignatures(signatureHeader);
  const validSignature = signatures.some(
    ({ version, signature }) =>
      version === "v1" && constantTimeEqual(signature, expectedSignature)
  );

  if (!validSignature) {
    return {
      ok: false,
      code: "webhook_signature_invalid",
      reason: "Svix signature did not match the expected signature.",
    };
  }

  return {
    ok: true,
    messageId,
    timestamp,
  };
}
