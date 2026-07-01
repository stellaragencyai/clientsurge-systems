const JUNK_QUALITY_STATUSES = new Set([
  'quarantine_candidate',
  'quarantined',
  'duplicate_candidate',
]);

const REVIEW_ONLY_QUALITY_STATUSES = new Set(['audit_pending']);
const JUNK_DEDUPE_STATUSES = new Set(['duplicate_candidate', 'merged_duplicate']);

const INTERNAL_REASON_CODES = new Set([
  'internal_test',
  'internal_test_source',
  'internal_test_business_name',
  'internal_test_full_name',
  'example_email',
  'test_phone_555',
  'test_website',
  'generic_inquiry_name',
  'email_marker',
  'source_marker',
  'name_marker',
  'reserved_phone_pattern',
]);

const RAW_IMPORT_REASON_CODES = new Set([
  'raw_import_no_contact',
  'missing_city_state_no_contact',
  'generic_business_name',
  'chain_franchise',
  'duplicate_no_contact',
]);

const TEST_SOURCE_PATTERNS = [
  'crm_live_smoke_test',
  'smoke',
  'qa',
  'install_test',
  'post_patch_verification',
  'post-patch verification',
  'runtime verification',
  'verification=',
  'email-template-runtime',
  'runaibraininstallerbackfill',
  'admin_test_lead',
  'testwebsiteleadautomation',
  'launch audit',
  'backfill',
];

const TEST_NAME_PATTERNS = [
  'clientsurge smoke qa',
  'clientsurge crm smoke',
  'client surge smoke',
  'clientsurge internal test verification',
  'nolan runtime verify',
  'sarah smoke test',
  'admin test lead',
  'install test',
  'qa ',
  ' qa',
  'smoke',
  'test owner',
  'crm smoke',
  'backfill test',
  'test hvac co',
];

const TEST_EMAIL_PATTERNS = [
  'clientsurge.test',
  'clientsurge-install.internal',
  'example.com',
  'test@example.com',
  'testbusiness.com',
  'testlead.com',
  'backfill-test',
  '@clientsurge.test',
  '.internal',
];

const CONVERSION_STATES = new Set(['BOOKED', 'WON']);
const CONVERSION_STATUSES = new Set(['Booked', 'Closed']);
const CONVERSION_CRM_STAGES = new Set(['Audit Booked', 'Won Pending Payment', 'Won']);

function compact(value) {
  return String(value || '').trim().toLowerCase();
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function hasPattern(value, patterns) {
  const text = compact(value);
  return Boolean(text) && patterns.some((pattern) => text.includes(pattern));
}

function hasReasonCode(lead, codeSet) {
  return (lead?.quality_reason_codes || []).some((code) => codeSet.has(String(code || '').trim()));
}

function hasAnyUsefulContact(lead) {
  return Boolean(
    compact(lead?.email) ||
    compact(lead?.phone) ||
    compact(lead?.website) ||
    compact(lead?.website_url) ||
    compact(lead?.canonical_website_url) ||
    compact(lead?.business_website_url) ||
    compact(lead?.phone_number)
  );
}

function hasHardJunkStatus(lead = {}) {
  return JUNK_QUALITY_STATUSES.has(lead.quality_review_status) || JUNK_DEDUPE_STATUSES.has(lead.dedupe_status);
}

function hasInternalTestSignal(lead = {}) {
  const signals = getLeadCleanupSignals(lead);
  return signals.some((signal) =>
    signal.includes('test/internal') ||
    signal.includes('555 test phone') ||
    signal.includes('internal/test reason code') ||
    signal.includes('quality status') ||
    signal.includes('dedupe status') ||
    signal.includes('duplicate of')
  );
}

export function getTrustedLeadQueryFilter() {
  return {
    quality_review_status: { $nin: [...JUNK_QUALITY_STATUSES] },
    dedupe_status: { $nin: [...JUNK_DEDUPE_STATUSES] },
  };
}

export function hasLeadCommercialEvidence(lead = {}) {
  return Boolean(
    Number(lead.total_revenue || 0) > 0 ||
    Number(lead.number_of_conversions || 0) > 0 ||
    compact(lead.last_conversion_date) ||
    compact(lead.order_id) ||
    compact(lead.payment_source) === 'stripe' ||
    compact(lead.payment_source) === 'manual_payment'
  );
}

export function hasLeadConversionEvidence(lead = {}) {
  return Boolean(
    hasLeadCommercialEvidence(lead) ||
    compact(lead.booked_at) ||
    CONVERSION_STATES.has(lead.lead_state) ||
    CONVERSION_STATUSES.has(lead.status) ||
    CONVERSION_CRM_STAGES.has(lead.crm_stage) ||
    compact(lead.outreach_status) === 'replied' ||
    compact(lead.outreach_status) === 'booked' ||
    compact(lead.reply_sentiment) === 'positive'
  );
}

export function getLeadCleanupSignals(lead = {}) {
  const signals = [];
  const email = lead.email || lead.canonical_email || lead.normalized_email;
  const phone = lead.phone || lead.canonical_phone || lead.normalized_phone;
  const names = [lead.business_name, lead.full_name, lead.owner_contact_name].join(' ');
  const sourceText = [lead.source, lead.consent_source, lead.import_source, lead.source_page, lead.page_submitted_from, lead.problem, lead.notes].join(' ');
  const reason = lead.quality_reason || '';
  const phoneDigits = digits(phone);

  if (JUNK_QUALITY_STATUSES.has(lead.quality_review_status)) signals.push(`quality status ${lead.quality_review_status}`);
  if (REVIEW_ONLY_QUALITY_STATUSES.has(lead.quality_review_status) && (hasReasonCode(lead, INTERNAL_REASON_CODES) || hasReasonCode(lead, RAW_IMPORT_REASON_CODES))) signals.push('audit-pending junk pattern');
  if (JUNK_DEDUPE_STATUSES.has(lead.dedupe_status)) signals.push(`dedupe status ${lead.dedupe_status}`);
  if (lead.dedupe_duplicate_of && !hasLeadCommercialEvidence(lead)) signals.push(`duplicate of ${lead.dedupe_duplicate_of}`);
  if (hasPattern(email, TEST_EMAIL_PATTERNS)) signals.push(`test/internal email ${email}`);
  if (hasPattern(sourceText, TEST_SOURCE_PATTERNS)) signals.push(`test/internal source ${sourceText}`);
  if (hasPattern(names, TEST_NAME_PATTERNS)) signals.push(`test/internal name ${names}`);
  if (phoneDigits.length >= 7 && phoneDigits.includes('555')) signals.push(`555 test phone ${phone}`);
  if (hasReasonCode(lead, INTERNAL_REASON_CODES)) signals.push('internal/test reason code');
  if (hasReasonCode(lead, RAW_IMPORT_REASON_CODES)) signals.push('raw import/no-contact reason code');
  if (compact(reason).includes('raw import with no email, phone, or website')) signals.push('raw import with no contact data');
  if (!hasAnyUsefulContact(lead) && hasReasonCode(lead, RAW_IMPORT_REASON_CODES)) signals.push('no useful contact data');

  return [...new Set(signals.filter(Boolean))];
}

export function isLeadVisibleInSalesViews(lead = {}) {
  const signals = getLeadCleanupSignals(lead);
  if (hasHardJunkStatus(lead)) return false;
  if (signals.length === 0) return true;
  if (hasLeadCommercialEvidence(lead) && !hasInternalTestSignal(lead)) return true;
  return false;
}

export function getLeadCleanupEligibility(lead = {}) {
  const blockers = [];
  const signals = getLeadCleanupSignals(lead);

  if (hasLeadCommercialEvidence(lead)) blockers.push('has payment, order, conversion, or revenue evidence');
  if (lead.quality_review_status === 'verified_outbound_ready') blockers.push('marked verified outbound ready');
  if (lead.do_not_contact && signals.length === 0) blockers.push('do-not-contact without junk signal; preserve for compliance history');
  if (!lead.dedupe_duplicate_of && lead.dedupe_status === 'duplicate_candidate' && hasAnyUsefulContact(lead)) blockers.push('duplicate candidate has useful contact data but no keeper link');
  if (signals.length === 0) blockers.push('no strong junk/test/duplicate signal');

  return {
    eligible: blockers.length === 0,
    signals,
    blockers,
    label: blockers.length === 0 ? 'Eligible for verified-junk deletion' : 'Blocked from deletion',
  };
}

export function canHardDeleteLead(lead = {}) {
  return getLeadCleanupEligibility(lead).eligible;
}

export function getWebsiteLeadCleanupSignals(lead = {}) {
  const signals = [];
  const email = lead.email || '';
  const phone = lead.phone_number || '';
  const names = [lead.business_name, lead.full_name, lead.first_name].join(' ');
  const sourceText = [lead.source, lead.consent_source, lead.source_page, lead.message, lead.call_summary, lead.user_agent].join(' ');
  const phoneDigits = digits(phone);

  if (lead.archived === true) signals.push('archived website lead');
  if (lead.lead_status === 'ignored') signals.push('ignored website lead');
  if (hasPattern(email, TEST_EMAIL_PATTERNS)) signals.push(`test/internal email ${email}`);
  if (hasPattern(sourceText, TEST_SOURCE_PATTERNS)) signals.push(`test/internal source ${sourceText}`);
  if (hasPattern(names, TEST_NAME_PATTERNS)) signals.push(`test/internal name ${names}`);
  if (phoneDigits.length >= 7 && phoneDigits.includes('555')) signals.push(`555 test phone ${phone}`);
  if (compact(lead.business_type) === 'test') signals.push('business type is test');

  return [...new Set(signals.filter(Boolean))];
}

export function hasWebsiteLeadConversionEvidence(lead = {}) {
  return Boolean(
    compact(lead.reply_status) === 'responded' ||
    compact(lead.booking_status) === 'booked' ||
    compact(lead.booking_status) === 'clicked' ||
    ['responded', 'hot', 'booked', 'closed'].includes(compact(lead.lead_status)) ||
    Number(lead.engagement_score || 0) > 0
  );
}

export function isWebsiteLeadVisibleInSalesViews(lead = {}) {
  const signals = getWebsiteLeadCleanupSignals(lead);
  if (lead.archived === true || lead.lead_status === 'ignored') return false;
  if (signals.length === 0) return true;
  if (hasWebsiteLeadConversionEvidence(lead) && !hasPattern([lead.email, lead.source, lead.full_name, lead.business_name].join(' '), TEST_SOURCE_PATTERNS)) {
    return true;
  }
  return false;
}

export function getWebsiteLeadCleanupEligibility(lead = {}) {
  const blockers = [];
  const signals = getWebsiteLeadCleanupSignals(lead);

  if (hasWebsiteLeadConversionEvidence(lead)) blockers.push('has reply, booking, click, or engagement evidence');
  if (signals.length === 0) blockers.push('no strong website-lead junk/test signal');

  return {
    eligible: blockers.length === 0,
    signals,
    blockers,
    label: blockers.length === 0 ? 'Eligible for verified-junk deletion' : 'Blocked from deletion',
  };
}

export function canHardDeleteWebsiteLead(lead = {}) {
  return getWebsiteLeadCleanupEligibility(lead).eligible;
}
