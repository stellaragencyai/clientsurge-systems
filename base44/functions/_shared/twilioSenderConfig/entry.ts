/**
 * Centralized Twilio sender configuration & validation.
 * Force all outbound SMS to use AdminSettings.twilio_from_number (+16025843227).
 * Hard-block the deprecated toll-free sender (+18778123630).
 */

const BLOCKED_SENDER = "+18778123630";
const CORRECT_SENDER = "+16025843227";

function normalizePhoneE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return null;
}

async function resolveTwilioSender(base44, fallbackEnvVar = "TWILIO_FROM_NUMBER") {
  let sender = null;

  if (base44) {
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
      if (settings?.[0]?.twilio_from_number) {
        sender = settings[0].twilio_from_number;
        console.log(`[twilioSenderConfig] Using AdminSettings sender: ${sender}`);
      }
    } catch (e) {
      console.warn(`[twilioSenderConfig] Failed to load AdminSettings: ${e.message}`);
    }
  }

  if (!sender) {
    sender = Deno.env.get(fallbackEnvVar);
    if (sender) {
      console.log(`[twilioSenderConfig] Using env var ${fallbackEnvVar}: ${sender}`);
    }
  }

  if (!sender) {
    throw new Error(`Twilio FROM sender not configured (AdminSettings.twilio_from_number or ${fallbackEnvVar})`);
  }

  const normalized = normalizePhoneE164(sender);
  if (!normalized) {
    throw new Error(`Invalid Twilio FROM sender: ${sender} (cannot normalize to E.164)`);
  }

  if (normalized === BLOCKED_SENDER) {
    throw new Error(
      `Twilio FROM sender ${BLOCKED_SENDER} is BLOCKED (toll-free verification issue). ` +
      `Use ${CORRECT_SENDER} instead. Check AdminSettings.twilio_from_number.`
    );
  }

  return normalized;
}

function extractTwilioErrorCode(twilioErrorOrMessage) {
  if (!twilioErrorOrMessage) return null;
  const str = String(twilioErrorOrMessage);
  const match = str.match(/\b(\d{5})\b/);
  return match ? parseInt(match[1], 10) : null;
}

function redactPayload(payload) {
  if (!payload) return null;
  const str = JSON.stringify(payload, null, 2);
  return str
    .replace(/authToken["\s:]*["'\w]+/gi, "authToken: [REDACTED]")
    .replace(/password["\s:]*["'\w]+/gi, "password: [REDACTED]")
    .replace(/auth["\s:]*["'\w]+/gi, "auth: [REDACTED]")
    .replace(/secret["\s:]*["'\w]+/gi, "secret: [REDACTED]")
    .replace(/webhook["\s:]*["'\w]+/gi, "webhook: [REDACTED]")
    .replace(/key["\s:]*["'\w]+/gi, "key: [REDACTED]");
}

export { normalizePhoneE164, resolveTwilioSender, extractTwilioErrorCode, redactPayload };