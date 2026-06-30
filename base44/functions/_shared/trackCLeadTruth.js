export const TRACK_C_HARD_QUARANTINE_LEAD_IDS = [
  "69e2bd29d9ec1b06557fd711",
  "69ea658174e51452cbde7fcf",
  "69f7cc256c782458984497d4",
  "6a1dcba673a5affa0402a583",
  "6a42c05482e15f30278b0798",
  "6a430d45dc40488938dbe1e6",
];

const TRACK_C_REASON_CODES_BY_ID = {
  "69e2bd29d9ec1b06557fd711": ["test_email_domain", "lifecycle_contradiction"],
  "69ea658174e51452cbde7fcf": ["fake_business_name", "test_phone", "gibberish_submission", "lifecycle_contradiction", "duplicate_candidate"],
  "69f7cc256c782458984497d4": ["internal_email_domain", "nolan_internal_qa", "internal_test", "lifecycle_contradiction"],
  "6a1dcba673a5affa0402a583": ["nolan_internal_qa", "test_phone", "lifecycle_contradiction", "duplicate_candidate"],
  "6a42c05482e15f30278b0798": ["nolan_internal_qa", "fake_business_name", "gibberish_submission"],
  "6a430d45dc40488938dbe1e6": ["internal_email_domain", "fake_business_name", "gibberish_submission", "lifecycle_contradiction"],
};

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

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
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

export function buildTrackCLeadQuarantinePatch(lead = {}, now = new Date().toISOString()) {
  const reasonCodes = unique([
    ...(Array.isArray(lead.quality_reason_codes) ? lead.quality_reason_codes : []),
    ...(TRACK_C_REASON_CODES_BY_ID[lead.id] || ["internal_test"]),
    "track_c_quarantine",
    "dashboard_excluded",
  ]);

  const flags = unique([
    ...(Array.isArray(lead.data_quality_flags) ? lead.data_quality_flags : []),
    "track_c_quarantine",
    "dashboard_excluded",
    ...reasonCodes,
  ]);

  return {
    quality_review_status: "quarantined",
    quality_reason: "Track C hard quarantine: internal/test/fake lead excluded from production CRM truth. No deletion performed.",
    quality_reason_codes: reasonCodes,
    quality_confidence: 98,
    audited_at: now,
    data_quality_checked_at: now,
    data_quality_flags: flags,
  };
}
