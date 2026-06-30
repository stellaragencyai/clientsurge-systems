function clean(value) {
  return String(value || '').trim().toLowerCase();
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

const TEST_EMAIL_PATTERNS = [
  'clientsurge.test',
  'clientsurge-install.internal',
  '@clientsurge.test',
  '.internal',
  'test@example.com',
  'backfill-test',
];

const TEST_SOURCE_PATTERNS = [
  'crm_live_smoke_test',
  'smoke',
  'install_test',
  'post_patch_verification',
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
  'sarah smoke test',
  'admin test lead',
  'install test',
  'test owner',
  'crm smoke',
  'backfill test',
  'test hvac co',
];

export function getWebsiteLeadOutboundSuppression(lead = {}) {
  const reasons = [];
  const emailText = clean(lead.email);
  const sourceText = [
    lead.source,
    lead.consent_source,
    lead.source_page,
    lead.routing_key,
    lead.quality_notes,
    lead.message,
    lead.call_summary,
    lead.user_agent,
  ].map(clean).join(' ');
  const nameText = [lead.business_name, lead.full_name, lead.first_name].map(clean).join(' ');
  const phoneDigits = digits(lead.phone_number || lead.phone);

  if (!lead || !lead.id) reasons.push('missing_lead');
  if (lead.archived === true) reasons.push('archived');
  if (lead.automation_enabled === false) reasons.push('automation_disabled');
  if (lead.cadence_paused === true) reasons.push('cadence_paused');
  if (clean(lead.lead_status) === 'ignored') reasons.push('ignored_status');
  if (includesAny(emailText, TEST_EMAIL_PATTERNS)) reasons.push('test_email_marker');
  if (includesAny(sourceText, TEST_SOURCE_PATTERNS)) reasons.push('test_source_marker');
  if (includesAny(nameText, TEST_NAME_PATTERNS)) reasons.push('test_name_marker');
  if (phoneDigits.length >= 7 && phoneDigits.includes('555')) reasons.push('reserved_phone_pattern');
  if (clean(lead.business_type) === 'test') reasons.push('test_business_type');

  return {
    suppressed: reasons.length > 0,
    reasons: [...new Set(reasons)],
  };
}

export function isWebsiteLeadSafeForOutbound(lead = {}) {
  return !getWebsiteLeadOutboundSuppression(lead).suppressed;
}

export async function logSuppressedWebsiteLeadOutbound(base44, { lead, source, channel = 'internal', step = null, reason = [] } = {}) {
  const reasons = Array.isArray(reason) ? reason : [reason].filter(Boolean);
  return base44.asServiceRole.entities.CommunicationEvent.create({
    context_id: lead?.id || 'unknown',
    context_type: 'website_lead',
    channel,
    direction: 'outbound',
    event_type: 'outbound_suppressed',
    provider: 'internal_guardrail',
    status: 'skipped',
    subject: `Outbound suppressed by ${source || 'lead guardrail'}`,
    message_body: reasons.join(', ') || 'Outbound blocked by lead quality guardrail',
    metadata_json: JSON.stringify({
      source: source || 'unknown',
      step,
      reasons,
      lead_id: lead?.id || null,
      timestamp: new Date().toISOString(),
    }),
  }).catch((error) => {
    console.warn('[outboundLeadGuards] Failed to log suppressed outbound:', error?.message || error);
    return null;
  });
}
