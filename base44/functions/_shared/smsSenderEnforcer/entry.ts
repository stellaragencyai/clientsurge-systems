/**
 * SMS Sender Enforcement Utility
 * 
 * Hard-enforces ClientSurge SMS sender to +16025843227 (local verified number).
 * Blocks +18778123630 (toll-free disabled due to Twilio 30032).
 * Used by all SMS sending paths: instant_lead_response, missed_call_recovery, nurture, follow-ups, etc.
 */

export function normalizePhoneE164(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length === 10) {
    if (digits[0] === "0" || digits[0] === "1") return null;
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const tenDigits = digits.slice(1);
    if (tenDigits[0] === "0" || tenDigits[0] === "1") return null;
    return `+${digits}`;
  }
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

export async function resolveSmsFromAddress(base44, fallbackEnvVar = "TWILIO_PHONE_NUMBER") {
  let fromNumber = null;

  // Step 1: Resolve from AdminSettings
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    if (settings?.[0]?.twilio_from_number) {
      fromNumber = normalizePhoneE164(settings[0].twilio_from_number);
      console.log(`[resolveSmsFromAddress] Resolved from AdminSettings: ${fromNumber}`);
    }
  } catch (e) {
    console.warn(`[resolveSmsFromAddress] Failed to load AdminSettings: ${e.message}`);
  }

  // Step 2: Fall back to env var only if AdminSettings empty
  if (!fromNumber && fallbackEnvVar) {
    const envValue = Deno.env.get(fallbackEnvVar);
    if (envValue) {
      fromNumber = normalizePhoneE164(envValue);
      console.log(`[resolveSmsFromAddress] Resolved from env ${fallbackEnvVar}: ${fromNumber}`);
    }
  }

  // Step 3: Hard-block the deprecated toll-free sender
  if (fromNumber === "+18778123630") {
    throw new Error(
      "BLOCKED: Twilio sender +18778123630 is permanently disabled. " +
      "Toll-free number failed Twilio 30032 verification (compliance issue). " +
      "Use +16025843227 (local verified sender). " +
      "Update AdminSettings.twilio_from_number to +16025843227."
    );
  }

  if (!fromNumber) {
    throw new Error("Twilio SMS sender not configured. Set AdminSettings.twilio_from_number.");
  }

  return fromNumber;
}

export function validateSmsRecipient(rawPhone) {
  if (!rawPhone) {
    throw new Error("Recipient phone is required");
  }

  const normalized = normalizePhoneE164(rawPhone);
  if (!normalized) {
    throw new Error(`Invalid phone number: ${rawPhone}. Cannot normalize to E.164.`);
  }

  return normalized;
}

export function redactSmsPayload(payload, redactionPattern = "StatusCallback.*url") {
  if (!payload) return null;

  let str = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);

  // Redact auth token, account SID, and callback URLs
  str = str
    .replace(/authToken["\s:]*["\w]+/gi, "authToken: [REDACTED]")
    .replace(/AccountSid["\s:]*["\w]+/gi, "AccountSid: [REDACTED]")
    .replace(/StatusCallback["\s:]*["\S]+/gi, "StatusCallback: [REDACTED_URL]")
    .replace(/auth["\s:]*(Basic [\w=]+)/gi, "auth: [REDACTED_BASIC_AUTH]");

  return str;
}

export function buildSmsMetadata(options = {}) {
  return {
    service_key: options.service_key || "sms_send",
    timestamp: new Date().toISOString(),
    sender_from: options.sender_from,
    sender_source: "AdminSettings.twilio_from_number",
    normalized_phone: options.normalized_phone,
    raw_phone: options.raw_phone,
    status_callback_present: options.status_callback_present === true,
    environment: options.environment || "production",
    ...options.extra,
  };
}