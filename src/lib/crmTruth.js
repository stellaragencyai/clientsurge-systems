export const TRACK_C_HARD_QUARANTINE_LEAD_IDS = [
  "69e2bd29d9ec1b06557fd711",
  "69ea658174e51452cbde7fcf",
  "69f7cc256c782458984497d4",
  "6a1dcba673a5affa0402a583",
  "6a42c05482e15f30278b0798",
  "6a430d45dc40488938dbe1e6",
];

const UNTRUSTED_QUALITY_STATUSES = new Set([
  "quarantine_candidate",
  "quarantined",
  "duplicate_candidate",
]);

const UNTRUSTED_DEDUPE_STATUSES = new Set([
  "duplicate_candidate",
  "merged_duplicate",
  "manual_review",
]);

const INTERNAL_EMAIL_PATTERNS = [
  /clientsurge\.test/i,
  /clientsurge-install\.internal/i,
  /example\.com/i,
  /crm-smoke/i,
  /backfill-test/i,
  /launch-audit-qa/i,
  /qa-live-launch-audit/i,
  /sarah-smoke-test/i,
  /^nolan.*@clientsurgesystems\.com$/i,
  /^nolan.*@gmail\.com$/i,
  /^stellaragencyai.*@gmail\.com$/i,
];

const INTERNAL_SOURCE_PATTERNS = [
  /install_test/i,
  /ai_brain_backfill/i,
  /admin_test_lead/i,
  /post_patch_verification/i,
  /crm_live_smoke_test/i,
  /smoke/i,
  /\bqa\b/i,
  /backfill/i,
];

const INTERNAL_CONTENT_PATTERNS = [
  /safe to ignore/i,
  /qa launch smoke/i,
  /smoke test/i,
  /internal test/i,
  /admin test/i,
  /install test/i,
  /backfill test/i,
  /sarah smoke test/i,
  /test hvac co/i,
  /test spa/i,
  /stripe webhook proof/i,
  /clientsurge smoke qa/i,
  /clientsurge ui function smoke/i,
  /clientsurge admin test/i,
  /\bdsfdsf\b/i,
  /\bsadfsdaf\b/i,
  /\bhyi\b/i,
  /\b1dwfsdfsdf\b/i,
];

function text(...values) {
  return values.map((value) => String(value || "")).join(" ");
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(String(value || "")));
}

export function isClearlyTestPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return false;
  return /555/.test(digits) || /^111111/.test(digits);
}

export function isTrackCHardQuarantineLeadId(id) {
  return TRACK_C_HARD_QUARANTINE_LEAD_IDS.includes(String(id || ""));
}

export function isLeadProductionTrusted(lead = {}) {
  if (isTrackCHardQuarantineLeadId(lead.id)) return false;
  if (UNTRUSTED_QUALITY_STATUSES.has(lead.quality_review_status || "active")) return false;
  if (UNTRUSTED_DEDUPE_STATUSES.has(lead.dedupe_status || "")) return false;
  if (lead.dedup_review_needed === true) return false;
  return true;
}

export function isHardTestWebsiteLead(lead = {}) {
  const email = String(lead.email || "").trim();
  if (matchesAny(email, INTERNAL_EMAIL_PATTERNS)) return true;

  const sourceText = text(
    lead.source,
    lead.source_page,
    lead.consent_source,
    lead.user_agent,
    lead.utm_source,
    lead.utm_campaign,
    lead.routing_key,
  );
  if (matchesAny(sourceText, INTERNAL_SOURCE_PATTERNS)) return true;

  const contentText = text(
    lead.full_name,
    lead.first_name,
    lead.business_name,
    lead.business_type,
    lead.service_interest,
    lead.message,
    lead.problem,
    lead.description,
    lead.call_summary,
    lead.transcript,
  );
  if (matchesAny(contentText, INTERNAL_CONTENT_PATTERNS)) return true;

  return isClearlyTestPhone(lead.phone_number);
}

export function isWebsiteLeadProductionTrusted(lead = {}) {
  if (lead.archived === true) return false;
  return !isHardTestWebsiteLead(lead);
}

export function filterProductionWebsiteLeads(leads = []) {
  return (leads || []).filter(isWebsiteLeadProductionTrusted);
}
