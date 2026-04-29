/**
 * Twilio Webhook Validation Utilities
 * Validates incoming Twilio webhook data and logs validation errors
 */

import crypto from "node:crypto";

/**
 * Validate Twilio request signature
 * See: https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(req, formData) {
  try {
    const signature = req.headers.get("X-Twilio-Signature");
    const token = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!signature || !token) {
      return { valid: false, reason: "Missing signature or token" };
    }

    const url = new URL(req.url).toString();
    const data = new URLSearchParams(formData);

    // Twilio signature = HMAC-SHA1(token, url + sorted_params)
    const toSign = url + Array.from(data.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join("");

    const computed = crypto
      .createHmac("sha1", token)
      .update(toSign)
      .digest("base64");

    const valid = computed === signature;
    return { valid, reason: valid ? "Valid signature" : "Signature mismatch" };
  } catch (error) {
    return { valid: false, reason: `Signature validation error: ${error.message}` };
  }
}

/**
 * Schema validation for Twilio call webhook
 */
export const TWILIO_CALL_SCHEMA = {
  CallSid: { type: "string", required: true, pattern: "^CA[a-f0-9]{32}$" },
  From: { type: "string", required: true, pattern: "^\\+?[1-9]\\d{1,14}$" },
  To: { type: "string", required: true, pattern: "^\\+?[1-9]\\d{1,14}$" },
  CallStatus: {
    type: "string",
    required: true,
    enum: ["queued", "ringing", "in-progress", "completed", "failed", "busy", "no-answer", "canceled"],
  },
  CallDuration: { type: "string", required: false, pattern: "^\\d+$" },
  RecordingUrl: { type: "string", required: false },
  RecordingSid: { type: "string", required: false },
};

/**
 * Validate payload against schema
 */
export function validatePayload(payload, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = payload[field];

    // Check required
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }

    if (!value) continue;

    // Check type
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be ${rules.type}, got ${typeof value}`);
    }

    // Check pattern (regex)
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`${field} format invalid: ${value}`);
    }

    // Check enum
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of ${rules.enum.join(", ")}, got ${value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize and normalize call event data
 */
export function normalizeCallEvent(payload) {
  return {
    call_sid: (payload.CallSid || "").trim(),
    from_number: (payload.From || "").trim(),
    to_number: (payload.To || "").trim(),
    call_status: (payload.CallStatus || "unknown").toLowerCase(),
    call_duration: parseInt(payload.CallDuration || "0", 10),
    recording_url: (payload.RecordingUrl || "").trim() || null,
    recording_sid: (payload.RecordingSid || "").trim() || null,
    timestamp: new Date().toISOString(),
  };
}