/**
 * Canonical Service Key Registry — single source of truth for all service identifiers.
 * Every dashboard, install checklist, automation status check, and reconciliation
 * must normalize keys through this registry.
 */

const CANONICAL_SERVICE_KEYS = [
  "instant_lead_response",
  "missed_call_text_back",
  "nurture_sequence_14d",
  "ai_booking_agent",
  "daily_lead_digest",
  "inbound_sms_assistant",
  "ai_voice_receptionist",
  "lead_reactivation",
  "review_request",
];

const LEGACY_ALIAS_MAP = {
  // Missed call
  missed_call_textback: "missed_call_text_back",
  missed_call_txt_back: "missed_call_text_back",
  missedcall: "missed_call_text_back",

  // Booking
  appointment_booking: "ai_booking_agent",
  booking_automation: "ai_booking_agent",
  auto_booking: "ai_booking_agent",

  // Nurture / follow-up
  followup_sequences: "nurture_sequence_14d",
  follow_up_sequences: "nurture_sequence_14d",
  nurture_sequence: "nurture_sequence_14d",
  followup: "nurture_sequence_14d",

  // Reactivation
  lead_reactivation_sequence: "lead_reactivation",
  win_back: "lead_reactivation",
  reactivation: "lead_reactivation",

  // Instant response
  instant_lead_sms: "instant_lead_response",
  lead_response: "instant_lead_response",
  instant_response: "instant_lead_response",

  // Reviews
  review_automation: "review_request",
  review_capture: "review_request",
  reputation: "review_request",

  // Inbound SMS
  inbound_sms: "inbound_sms_assistant",
  sms_assistant: "inbound_sms_assistant",

  // Voice
  voice_receptionist: "ai_voice_receptionist",
  ai_voice_agent: "ai_voice_receptionist",
  voice_agent: "ai_voice_receptionist",

  // Digest
  daily_digest: "daily_lead_digest",
  lead_digest: "daily_lead_digest",
};

/**
 * Normalize a service key to its canonical form.
 * Returns { canonical, wasAlias, original }.
 * If the key is unrecognized, returns the original with wasAlias=false.
 */
export function normalizeServiceKey(raw) {
  if (!raw || typeof raw !== "string") {
    return { canonical: raw || "", wasAlias: false, original: raw };
  }
  const key = raw.trim().toLowerCase();
  if (CANONICAL_SERVICE_KEYS.includes(key)) {
    return { canonical: key, wasAlias: false, original: raw };
  }
  const alias = LEGACY_ALIAS_MAP[key];
  if (alias) {
    return { canonical: alias, wasAlias: true, original: raw };
  }
  return { canonical: key, wasAlias: false, original: raw };
}

/**
 * Check if a raw key can be normalized to canonical.
 */
export function isCanonicalServiceKey(raw) {
  const { canonical, wasAlias } = normalizeServiceKey(raw);
  return CANONICAL_SERVICE_KEYS.includes(canonical);
}

/**
 * Check if a raw key is a legacy alias that can be remapped.
 */
export function isLegacyAlias(raw) {
  if (!raw || typeof raw !== "string") return false;
  return LEGACY_ALIAS_MAP.hasOwnProperty(raw.trim().toLowerCase());
}

/**
 * Get the canonical key if normalizable, or null if unrecognized.
 */
export function toCanonicalOrNull(raw) {
  if (!raw || typeof raw !== "string") return null;
  const { canonical } = normalizeServiceKey(raw);
  return CANONICAL_SERVICE_KEYS.includes(canonical) ? canonical : null;
}

/**
 * Get all canonical service keys.
 */
export function getCanonicalServiceKeys() {
  return [...CANONICAL_SERVICE_KEYS];
}

/**
 * QA / smoke / demo / internal classification patterns.
 */
const ENVIRONMENT_PATTERNS = [
  { pattern: /smoke/i, env: "smoke" },
  { pattern: /proof/i, env: "qa" },
  { pattern: /test/i, env: "qa" },
  { pattern: /qa/i, env: "qa" },
  { pattern: /runtime\.checkout/i, env: "qa" },
  { pattern: /webhook-proof/i, env: "qa" },
  { pattern: /@clientsurge\.test/i, env: "internal" },
  { pattern: /@clientsurge-install\.internal/i, env: "internal" },
  { pattern: /example\.com/i, env: "internal" },
  { pattern: /demo/i, env: "demo" },
];

/**
 * Classify an email/name/domain into an environment.
 * Returns null if no pattern matches (meaning it's likely production).
 */
export function classifyEnvironment(email, name, domain) {
  const candidates = [email, name, domain].filter(Boolean);
  for (const candidate of candidates) {
    for (const { pattern, env } of ENVIRONMENT_PATTERNS) {
      if (pattern.test(candidate)) return env;
    }
  }
  return null;
}

/**
 * Allowed activation_status values for ClientInstallationOS.
 */
const ALLOWED_ACTIVATION_STATUSES = [
  "not_ready",
  "ready_for_approval",
  "activated",
  "paused",
];

/**
 * Check if an activation_status value is canonical.
 */
export function isValidActivationStatus(status) {
  return ALLOWED_ACTIVATION_STATUSES.includes(status);
}

export { CANONICAL_SERVICE_KEYS, LEGACY_ALIAS_MAP, ALLOWED_ACTIVATION_STATUSES };