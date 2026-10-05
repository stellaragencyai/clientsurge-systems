import {
  normalizePhoneE164,
  resolveTwilioSender,
  assertAutomatedSenderAllowed,
} from "../twilioSenderConfig/entry.ts";

/**
 * Backward-compatible adapter for legacy SMS call sites.
 * New callers should use resolveTwilioSender directly and provide a purpose.
 */
export async function resolveSmsFromAddress(base44, optionsOrFallback = {}) {
  if (typeof optionsOrFallback === "string") {
    return resolveTwilioSender(base44, optionsOrFallback);
  }
  return resolveTwilioSender(base44, {
    purpose: optionsOrFallback?.purpose || "customer_service",
    conversationFromNumber: optionsOrFallback?.conversationFromNumber,
    clientAssignedNumber: optionsOrFallback?.clientAssignedNumber,
  });
}

export function validateSmsRecipient(rawPhone) {
  if (!rawPhone) throw new Error("Recipient phone is required");
  const normalized = normalizePhoneE164(rawPhone);
  if (!normalized) throw new Error(`Invalid phone number: ${rawPhone}. Cannot normalize to E.164.`);
  return normalized;
}

export function validateAutomatedSender(rawPhone) {
  return assertAutomatedSenderAllowed(rawPhone);
}

export function redactSmsPayload(payload) {
  if (!payload) return null;
  return (typeof payload === "string" ? payload : JSON.stringify(payload, null, 2))
    .replace(/authToken["\s:]*["\w]+/gi, "authToken: [REDACTED]")
    .replace(/AccountSid["\s:]*["\w]+/gi, "AccountSid: [REDACTED]")
    .replace(/StatusCallback["\s:]*["\S]+/gi, "StatusCallback: [REDACTED_URL]")
    .replace(/auth["\s:]*(Basic [\w=]+)/gi, "auth: [REDACTED_BASIC_AUTH]");
}

export function buildSmsMetadata(options = {}) {
  return {
    service_key: options.service_key || "sms_send",
    timestamp: new Date().toISOString(),
    sender_from: options.sender_from,
    sender_source: options.sender_source || "canonical_twilio_sender_resolver",
    sender_purpose: options.sender_purpose || "customer_service",
    normalized_phone: options.normalized_phone,
    raw_phone: options.raw_phone,
    status_callback_present: options.status_callback_present === true,
    environment: options.environment || "production",
    ...options.extra,
  };
}

export { normalizePhoneE164 };
