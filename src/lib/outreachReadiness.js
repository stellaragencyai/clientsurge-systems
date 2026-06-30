import { getLeadCleanupSignals, hasLeadConversionEvidence, isLeadVisibleInSalesViews } from './leadCleanupGuards';

function clean(value) {
  return String(value || '').trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

function has(value) {
  return Boolean(clean(value));
}

export function getLeadContactFields(lead = {}) {
  return {
    email: clean(lead.email || lead.normalized_email || lead.canonical_email),
    phone: clean(lead.phone || lead.normalized_phone || lead.canonical_phone),
    website: clean(lead.website || lead.website_url || lead.canonical_website_url || lead.business_website_url),
    businessName: clean(lead.business_name),
    location: [lead.city, lead.state].map(clean).filter(Boolean).join(', '),
  };
}

export function evaluateOutreachReadiness(lead = {}) {
  const reasons = [];
  const blockers = [];
  const warnings = [];
  const contact = getLeadContactFields(lead);
  const cleanupSignals = getLeadCleanupSignals(lead);
  const visible = isLeadVisibleInSalesViews(lead);

  if (!visible || cleanupSignals.length > 0) {
    blockers.push('hidden by CRM quality guard');
    reasons.push(...cleanupSignals.map((signal) => `quality: ${signal}`));
  }
  if (['quarantine_candidate', 'quarantined'].includes(clean(lead.quality_review_status))) {
    blockers.push(`quality status ${lead.quality_review_status}`);
  }
  if (clean(lead.quality_review_status) === 'duplicate_candidate' || clean(lead.dedupe_status) === 'duplicate_candidate' || has(lead.dedupe_duplicate_of)) {
    blockers.push('duplicate review required');
  }
  if (lead.do_not_contact === true || lower(lead.sms_opt_out_status) === 'opted_out' || lower(lead.email_opt_out_status) === 'opted_out') {
    blockers.push('do-not-contact or opt-out flag');
  }
  if (hasLeadConversionEvidence(lead)) {
    warnings.push('already has booking/reply/payment evidence');
  }
  if (!contact.email && !contact.phone) {
    blockers.push('missing both email and phone');
  }
  if (!contact.businessName) {
    warnings.push('missing business name');
  }
  if (!contact.website) {
    warnings.push('missing website');
  }
  if (!contact.location) {
    warnings.push('missing city/state');
  }

  const hasMinimumIdentity = Boolean(contact.businessName && (contact.website || contact.location));
  if (!hasMinimumIdentity) {
    warnings.push('needs business identity verification');
  }

  let status = 'ready';
  if (blockers.length > 0) status = 'blocked';
  else if (warnings.length > 0) status = 'needs_verification';

  return {
    status,
    label: status === 'ready' ? 'Ready to Contact' : status === 'blocked' ? 'Blocked' : 'Needs Verification',
    contact,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    reasons: [...new Set(reasons)],
  };
}

export function summarizeOutreachReadiness(leads = []) {
  const rows = (leads || []).map((lead) => ({ lead, readiness: evaluateOutreachReadiness(lead) }));
  return {
    rows,
    ready: rows.filter((row) => row.readiness.status === 'ready'),
    needs_verification: rows.filter((row) => row.readiness.status === 'needs_verification'),
    blocked: rows.filter((row) => row.readiness.status === 'blocked'),
  };
}
