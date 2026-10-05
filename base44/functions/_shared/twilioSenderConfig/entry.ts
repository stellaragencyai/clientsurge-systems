/**
 * Canonical ClientSurge Twilio number resolver.
 *
 * Number roles:
 * - +18778123630: customer service, website leads, onboarding, support, transactional SMS
 * - +16025843227: Nolan sales, Arizona/local outreach, direct sales follow-up
 * - +16025874608: Nolan personal verification/call number; NEVER valid for automated sends
 *
 * Resolution priority:
 * 1. Existing conversation/provider number (conversation affinity)
 * 2. Explicit client-assigned number
 * 3. Purpose-specific configured number
 * 4. Backward-compatible AdminSettings.twilio_from_number
 * 5. Environment fallback
 */

const DEFAULT_CUSTOMER_SERVICE_NUMBER = "+18778123630";
const DEFAULT_SALES_NUMBER = "+16025843227";
const PERSONAL_VERIFICATION_NUMBER = "+16025874608";

const CUSTOMER_SERVICE_PURPOSES = new Set([
  "customer_service",
  "support",
  "website_lead",
  "instant_lead_response",
  "onboarding",
  "transactional",
  "appointment",
  "booking_reminder",
  "review_request",
  "billing",
]);

const SALES_PURPOSES = new Set([
  "sales",
  "sales_outreach",
  "local_outreach",
  "arizona_outreach",
  "nolan_followup",
]);

function normalizePhoneE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === "1") return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function assertAutomatedSenderAllowed(sender) {
  const normalized = normalizePhoneE164(sender);
  if (!normalized) throw new Error(`Invalid Twilio FROM sender: ${sender}`);
  if (normalized === PERSONAL_VERIFICATION_NUMBER) {
    throw new Error(
      `Personal verification number ${PERSONAL_VERIFICATION_NUMBER} cannot be used for automated SMS. ` +
      `Use the customer-service or sales number.`
    );
  }
  return normalized;
}

async function loadAdminSettings(base44) {
  if (!base44) return null;
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list("-created_date", 1);
    return settings?.[0] || null;
  } catch (error) {
    console.warn(`[twilioSenderConfig] Failed to load AdminSettings: ${error.message}`);
    return null;
  }
}

/**
 * Resolve the outbound sender while preserving existing callers.
 *
 * Legacy usage remains valid:
 *   resolveTwilioSender(base44)
 *
 * Preferred usage:
 *   resolveTwilioSender(base44, {
 *     purpose: "customer_service",
 *     conversationFromNumber,
 *     clientAssignedNumber,
 *   })
 */
async function resolveTwilioSender(base44, optionsOrFallback = {}) {
  const legacyFallbackEnvVar = typeof optionsOrFallback === "string" ? optionsOrFallback : null;
  const options = typeof optionsOrFallback === "object" && optionsOrFallback !== null
    ? optionsOrFallback
    : {};

  const settings = await loadAdminSettings(base44);
  const purpose = String(options.purpose || "customer_service").trim().toLowerCase();

  const conversationNumber = normalizePhoneE164(
    options.conversationFromNumber || options.existingConversationNumber
  );
  if (conversationNumber) return assertAutomatedSenderAllowed(conversationNumber);

  const clientAssignedNumber = normalizePhoneE164(options.clientAssignedNumber);
  if (clientAssignedNumber) return assertAutomatedSenderAllowed(clientAssignedNumber);

  let sender = null;
  if (SALES_PURPOSES.has(purpose)) {
    sender = settings?.twilio_sales_number ||
      Deno.env.get("TWILIO_SALES_NUMBER") ||
      DEFAULT_SALES_NUMBER;
  } else if (CUSTOMER_SERVICE_PURPOSES.has(purpose)) {
    sender = settings?.twilio_customer_service_number ||
      Deno.env.get("TWILIO_CUSTOMER_SERVICE_NUMBER") ||
      DEFAULT_CUSTOMER_SERVICE_NUMBER;
  }

  // Backward compatibility for unclassified send paths during migration.
  if (!sender) {
    sender = settings?.twilio_from_number ||
      Deno.env.get(legacyFallbackEnvVar || "TWILIO_FROM_NUMBER") ||
      Deno.env.get("TWILIO_PHONE_NUMBER");
  }

  if (!sender) {
    throw new Error(
      "Twilio sender is not configured. Set a purpose-specific number or AdminSettings.twilio_from_number."
    );
  }

  return assertAutomatedSenderAllowed(sender);
}

function classifyInboundNumber(toNumber) {
  const normalized = normalizePhoneE164(toNumber);
  if (normalized === DEFAULT_CUSTOMER_SERVICE_NUMBER) return "customer_service";
  if (normalized === DEFAULT_SALES_NUMBER) return "sales";
  if (normalized === PERSONAL_VERIFICATION_NUMBER) return "personal_verification";
  return "unmatched";
}

function extractTwilioErrorCode(twilioErrorOrMessage) {
  if (!twilioErrorOrMessage) return null;
  const match = String(twilioErrorOrMessage).match(/\b(\d{5})\b/);
  return match ? parseInt(match[1], 10) : null;
}

function redactPayload(payload) {
  if (!payload) return null;
  return JSON.stringify(payload, null, 2)
    .replace(/authToken["\s:]*["'\w]+/gi, "authToken: [REDACTED]")
    .replace(/password["\s:]*["'\w]+/gi, "password: [REDACTED]")
    .replace(/auth["\s:]*["'\w]+/gi, "auth: [REDACTED]")
    .replace(/secret["\s:]*["'\w]+/gi, "secret: [REDACTED]")
    .replace(/webhook["\s:]*["'\w]+/gi, "webhook: [REDACTED]")
    .replace(/key["\s:]*["'\w]+/gi, "key: [REDACTED]");
}

export {
  CUSTOMER_SERVICE_PURPOSES,
  SALES_PURPOSES,
  DEFAULT_CUSTOMER_SERVICE_NUMBER,
  DEFAULT_SALES_NUMBER,
  PERSONAL_VERIFICATION_NUMBER,
  normalizePhoneE164,
  assertAutomatedSenderAllowed,
  resolveTwilioSender,
  classifyInboundNumber,
  extractTwilioErrorCode,
  redactPayload,
};
