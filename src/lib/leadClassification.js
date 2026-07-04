/**
 * Lead Classification Utility
 * Deterministic classification of WebsiteLead and Leads records into environments.
 * Does NOT delete or modify production data — classification is computed in-memory only.
 *
 * Environments: production, internal, smoke, demo, unknown
 */

const TEST_EMAIL_DOMAINS = [
  'example.com', 'example.org', 'example.net', 'test.com', 'test.org',
  'fake.com', 'fake.org', 'dummy.com', 'sample.com', 'sample.org',
  'yopmail.com', 'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'base44.com', 'base44.dev', 'clientsurge.dev',
];

const TEST_NAME_PATTERNS = [
  /^test\b/i, /^smoke\b/i, /^demo\b/i, /^sample\b/i, /^example\b/i,
  /^fake\b/i, /^dummy\b/i, /^john doe$/i, /^jane doe$/i, /^test user$/i,
  /^qa\b/i, /^debug\b/i, /^placeholder\b/i,
];

const TEST_BUSINESS_PATTERNS = [
  /^test\b/i, /^smoke\b/i, /^demo\b/i, /^sample\b/i, /^example\b/i,
  /^fake\b/i, /^dummy\b/i, /^placeholder\b/i, /^my business$/i,
  /^test business$/i, /^demo business$/i, /^abc company$/i,
];

const TEST_SOURCE_VALUES = [
  'smoke', 'test', 'demo', 'internal', 'qa', 'debug',
];

const TEST_SOURCE_PAGE_PATTERNS = [
  /smoke/i, /test/i, /demo/i, /internal/i, /qa/i, /debug/i,
];

const TEST_NOTES_PATTERNS = [
  /smoke test/i, /test lead/i, /demo lead/i, /internal test/i,
  /qa test/i, /debug/i, /placeholder/i, /do not contact/i,
  /fabricated/i, /synthetic/i, /simulated/i,
];

/**
 * Classify a WebsiteLead or Leads record into an environment.
 * @param {Object} lead - The lead record
 * @returns {{ environment: string, label: string, reason: string, reason_codes: string[] }}
 */
export function classifyLeadRecord(lead) {
  if (!lead || typeof lead !== 'object') {
    return { environment: 'unknown', label: 'Unknown — Needs Review', reason: 'No record provided', reason_codes: ['no_record'] };
  }

  const reason_codes = [];
  let environment = 'production';

  // 1. Check source field
  const source = (lead.source || '').toLowerCase().trim();
  if (TEST_SOURCE_VALUES.includes(source)) {
    environment = mapSourceToEnv(source);
    reason_codes.push(`source_${source}`);
  }

  // 2. Check source_page
  const sourcePage = lead.source_page || '';
  if (sourcePage && TEST_SOURCE_PAGE_PATTERNS.some((p) => p.test(sourcePage))) {
    if (environment === 'production') environment = 'internal';
    reason_codes.push('source_page_test_pattern');
  }

  // 3. Check email domain
  const email = (lead.email || '').toLowerCase().trim();
  if (email) {
    const domain = email.split('@')[1] || '';
    if (TEST_EMAIL_DOMAINS.includes(domain)) {
      if (environment === 'production') environment = 'internal';
      reason_codes.push(`email_domain_${domain}`);
    }
  }

  // 4. Check full_name / owner_contact_name
  const name = lead.full_name || lead.owner_contact_name || '';
  if (name && TEST_NAME_PATTERNS.some((p) => p.test(name))) {
    if (environment === 'production') environment = 'internal';
    reason_codes.push('name_test_pattern');
  }

  // 5. Check business_name
  const businessName = lead.business_name || '';
  if (businessName && TEST_BUSINESS_PATTERNS.some((p) => p.test(businessName))) {
    if (environment === 'production') environment = 'demo';
    reason_codes.push('business_name_test_pattern');
  }

  // 6. Check consent_source
  const consentSource = (lead.consent_source || '').toLowerCase().trim();
  if (consentSource && TEST_SOURCE_PAGE_PATTERNS.some((p) => p.test(consentSource))) {
    if (environment === 'production') environment = 'smoke';
    reason_codes.push('consent_source_test_pattern');
  }

  // 7. Check notes / description / message
  const notesText = [lead.notes, lead.description, lead.message, lead.problem].filter(Boolean).join(' ');
  if (notesText && TEST_NOTES_PATTERNS.some((p) => p.test(notesText))) {
    if (environment === 'production') environment = 'internal';
    reason_codes.push('notes_test_pattern');
  }

  // 8. Check created_by_id — if it's an admin-created test lead
  // We can't resolve the user here, but we flag if reason_codes suggest test

  // 9. If no reason codes and no email/phone, mark unknown
  if (reason_codes.length === 0 && !email && !lead.phone && !lead.phone_number) {
    environment = 'unknown';
    reason_codes.push('missing_contact_info');
  }

  // 10. If no reason codes but missing critical fields, still production but flag
  if (reason_codes.length === 0 && !lead.consent_given) {
    // Production lead without consent — still production but blocked
    reason_codes.push('missing_consent');
  }

  const label = ENV_LABELS[environment] || ENV_LABELS.unknown;
  const reason = reason_codes.length > 0
    ? `Classified as ${environment}: ${reason_codes.join(', ')}`
    : `Classified as production: no test indicators found`;

  return { environment, label, reason, reason_codes };
}

function mapSourceToEnv(source) {
  const map = {
    smoke: 'smoke',
    test: 'internal',
    demo: 'demo',
    internal: 'internal',
    qa: 'internal',
    debug: 'internal',
  };
  return map[source] || 'unknown';
}

export const ENV_LABELS = {
  production: 'Production Trusted',
  internal: 'Internal/Test Excluded',
  smoke: 'Smoke/Proof Excluded',
  demo: 'Demo Excluded',
  unknown: 'Unknown — Needs Review',
};

export const BLOCKED_LABELS = {
  missing_consent: 'Missing Consent — Blocked',
  missing_contact: 'Missing Contact — Blocked',
};

/**
 * Classify a batch of leads and return summary counts.
 * @param {Array} leads
 * @returns {{ byEnvironment: Object, classified: Array }}
 */
export function classifyLeadBatch(leads) {
  const byEnvironment = { production: 0, internal: 0, smoke: 0, demo: 0, unknown: 0 };
  const classified = [];

  for (const lead of leads) {
    const result = classifyLeadRecord(lead);
    byEnvironment[result.environment] = (byEnvironment[result.environment] || 0) + 1;
    classified.push({ ...lead, _classification: result });
  }

  return { byEnvironment, classified };
}

/**
 * Check if a lead has missing critical fields.
 * @param {Object} lead
 * @returns {{ missingEmail: boolean, missingPhone: boolean, missingConsent: boolean, missingSourcePage: boolean, missingRequestedChannels: boolean, automationDisabled: boolean }}
 */
export function checkLeadCompleteness(lead) {
  return {
    missingEmail: !(lead.email || '').trim(),
    missingPhone: !((lead.phone || lead.phone_number || '')).trim(),
    missingConsent: !lead.consent_given,
    missingSourcePage: !(lead.source_page || '').trim(),
    missingRequestedChannels: !Array.isArray(lead.requested_channels) || lead.requested_channels.length === 0,
    automationDisabled: lead.automation_enabled === false,
  };
}