export const CRM_HEALTH_MAX_FETCH = 25000;

export const CRM_HEALTH_INDUSTRIES = [
  "roofing",
  "hvac",
  "dental",
  "med_spa",
  "plumbing",
  "other",
];

export const CRM_LAUNCH_TASKS = [
  "Verify live Leads schema",
  "Confirm CRM source of truth",
  "Calculate usable lead count",
  "Backfill industry and crm_tag",
  "Backfill source_history",
  "Identify missing email/phone/website",
  "Identify duplicate email groups",
  "Identify duplicate phone groups",
  "Review high-confidence duplicates",
  "Prepare 25-lead preview",
  "Confirm suppression rules",
  "Confirm campaign attribution fields",
];

export const CRM_LAUNCH_PROOFS = [
  "CRM schema scan",
  "Lead count scan",
  "Duplicate dry-run",
  "Suppression dry-run",
  "First campaign dry-run preview",
];

const TERMINAL_STAGE_TOKENS = new Set(["won", "lost", "closed"]);
const RECENT_CONTACT_WINDOW_DAYS = 14;

function compact(value) {
  return String(value || "").trim();
}

function normalizeToken(value) {
  return compact(value).toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeEmail(value) {
  return compact(value).toLowerCase();
}

function digitsOnly(value) {
  return compact(value).replace(/\D/g, "");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasValue(value) {
  return compact(value).length > 0;
}

export function maskEmail(value) {
  const email = normalizeEmail(value);
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  const first = local.slice(0, 1) || "*";
  return `${first}***@${domain}`;
}

export function maskPhone(value) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  return `***-***-${digits.slice(-4).padStart(4, "*")}`;
}

export function hasLeadEmail(lead = {}) {
  return hasValue(lead.email || lead.normalized_email);
}

export function hasLeadPhone(lead = {}) {
  return hasValue(lead.phone || lead.normalized_phone);
}

export function hasLeadWebsite(lead = {}) {
  return hasValue(lead.website_url || lead.website || lead.business_website || lead.domain);
}

export function hasLeadIndustryOrTag(lead = {}) {
  return [
    lead.industry,
    lead.business_type,
    lead.crm_tag,
    ...toArray(lead.industry_tags),
  ].some(hasValue);
}

export function isTerminalLead(lead = {}) {
  const status = normalizeToken(lead.status);
  const crmStage = normalizeToken(lead.crm_stage);
  return TERMINAL_STAGE_TOKENS.has(status) || TERMINAL_STAGE_TOKENS.has(crmStage);
}

export function getSuppressionReasons(lead = {}) {
  const reasons = [];
  if (lead.do_not_contact || lead.dnc || normalizeToken(lead.outreach_status) === "do_not_contact") {
    reasons.push("do_not_contact");
  }
  if (lead.email_unsubscribed || lead.unsubscribed) {
    reasons.push("unsubscribed");
  }
  if (lead.email_bounced || lead.bounced || lead.hard_bounced) {
    reasons.push("bounced");
  }
  if (isTerminalLead(lead)) {
    reasons.push("closed_won_lost");
  }
  return reasons;
}

export function isSuppressedLead(lead = {}) {
  return getSuppressionReasons(lead).length > 0;
}

export function isUsableLead(lead = {}) {
  return hasLeadEmail(lead) && !isSuppressedLead(lead) && hasLeadIndustryOrTag(lead);
}

function leadIndustryTokens(lead = {}) {
  return [
    lead.industry,
    lead.business_type,
    lead.crm_tag,
    ...toArray(lead.industry_tags),
  ].map(normalizeToken).filter(Boolean);
}

export function leadMatchesIndustry(lead = {}, requestedIndustry = "other") {
  const requested = normalizeToken(requestedIndustry);
  if (!requested || requested === "all") return true;
  const tokens = leadIndustryTokens(lead);
  if (requested === "other") {
    return !CRM_HEALTH_INDUSTRIES
      .filter((industry) => industry !== "other")
      .some((industry) => tokens.includes(industry) || tokens.includes(`${industry}_lead`));
  }
  return tokens.some((token) =>
    token === requested ||
    token === `${requested}_lead` ||
    token.includes(requested) ||
    requested.includes(token)
  );
}

function primaryIndustry(lead = {}) {
  const tokens = leadIndustryTokens(lead);
  for (const industry of CRM_HEALTH_INDUSTRIES) {
    if (industry !== "other" && leadMatchesIndustry(lead, industry)) {
      return industry;
    }
  }
  return tokens[0] || "unknown";
}

function parseDate(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function wasRecentlyContacted(lead = {}, { now = new Date().toISOString(), windowDays = RECENT_CONTACT_WINDOW_DAYS } = {}) {
  const contactedAt = parseDate(lead.last_contacted_at) || parseDate(lead.last_contacted_date);
  if (!contactedAt) return false;
  const nowTimestamp = parseDate(now) || Date.now();
  return contactedAt >= nowTimestamp - windowDays * 24 * 60 * 60 * 1000;
}

function buildGroups(leads, keyBuilder) {
  const groups = new Map();
  for (const lead of leads) {
    const key = keyBuilder(lead);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(lead);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, count: group.length, leads: group }));
}

export function buildDuplicateRisk(leads = []) {
  const emailGroups = buildGroups(leads, (lead) => normalizeEmail(lead.normalized_email || lead.email));
  const phoneGroups = buildGroups(leads, (lead) => digitsOnly(lead.normalized_phone || lead.phone));
  const dedupeGroups = buildGroups(leads, (lead) => normalizeToken(lead.dedupe_group_key || lead.dedupe_key));
  const explicitCandidates = leads.filter((lead) =>
    ["duplicate_candidate", "manual_review", "merged_duplicate"].includes(normalizeToken(lead.dedupe_status))
  );

  return {
    duplicate_groups: emailGroups.length + phoneGroups.length + dedupeGroups.length,
    duplicate_email_groups: emailGroups.length,
    duplicate_phone_groups: phoneGroups.length,
    dedupe_key_groups: dedupeGroups.length,
    explicit_duplicate_candidates: explicitCandidates.length,
    dry_run_review: [...emailGroups, ...phoneGroups, ...dedupeGroups].slice(0, 10).map((group) => ({
      group_key_masked: group.key.includes("@") ? maskEmail(group.key) : group.key.replace(/\d(?=\d{4})/g, "*"),
      count: group.count,
      sample_leads: group.leads.slice(0, 3).map((lead, index) => ({
        label: lead.business_name || `Lead ${index + 1}`,
        email_masked: maskEmail(lead.email || lead.normalized_email),
        phone_masked: maskPhone(lead.phone || lead.normalized_phone),
        dedupe_status: lead.dedupe_status || "unmarked",
      })),
    })),
  };
}

function previewRow(lead, index) {
  return {
    label: lead.business_name || `Lead ${index + 1}`,
    email_masked: maskEmail(lead.email || lead.normalized_email),
    phone_masked: maskPhone(lead.phone || lead.normalized_phone),
    industry: primaryIndustry(lead),
    crm_stage: lead.crm_stage || lead.status || "Unknown",
  };
}

export function buildFirstCampaignDryRun(leads = [], {
  industry = "roofing",
  maxCount = 25,
  excludeSuppressed = true,
  excludeMissingEmail = true,
  excludeRecentlyContacted = true,
  now = new Date().toISOString(),
} = {}) {
  const boundedMax = Math.max(1, Math.min(Number(maxCount) || 25, 50));
  const matching = leads.filter((lead) => leadMatchesIndustry(lead, industry));
  const missingEmail = matching.filter((lead) => !hasLeadEmail(lead));
  const suppressed = matching.filter(isSuppressedLead);
  const missingWebsite = matching.filter((lead) => !hasLeadWebsite(lead));
  const recentlyContacted = matching.filter((lead) => wasRecentlyContacted(lead, { now }));

  let candidates = matching;
  if (excludeMissingEmail) candidates = candidates.filter(hasLeadEmail);
  if (excludeSuppressed) candidates = candidates.filter((lead) => !isSuppressedLead(lead));
  if (excludeRecentlyContacted) candidates = candidates.filter((lead) => !wasRecentlyContacted(lead, { now }));

  const seenEmails = new Set();
  const selected = [];
  let duplicateExcluded = 0;

  for (const lead of candidates) {
    const email = normalizeEmail(lead.normalized_email || lead.email);
    if (email && seenEmails.has(email)) {
      duplicateExcluded += 1;
      continue;
    }
    if (email) seenEmails.add(email);
    selected.push(lead);
    if (selected.length >= boundedMax) break;
  }

  return {
    industry,
    max_count: boundedMax,
    total_matching: matching.length,
    suppressed_excluded: excludeSuppressed ? suppressed.length : 0,
    missing_email_excluded: excludeMissingEmail ? missingEmail.length : 0,
    missing_website_count: missingWebsite.length,
    duplicate_excluded_count: duplicateExcluded,
    recently_contacted_excluded: excludeRecentlyContacted ? recentlyContacted.length : 0,
    final_selected_count: selected.length,
    safe_to_send: false,
    dry_run_only: true,
    selected_preview_masked: selected.slice(0, 5).map(previewRow),
  };
}

export function buildCrmHealthSnapshot(leads = [], {
  now = new Date().toISOString(),
  previewIndustry = "roofing",
  previewMaxCount = 25,
} = {}) {
  const duplicateRisk = buildDuplicateRisk(leads);
  const suppressedLeads = leads.filter(isSuppressedLead);
  const usableLeads = leads.filter(isUsableLead);
  const campaignEligibleLeads = leads.filter((lead) =>
    isUsableLead(lead) && !wasRecentlyContacted(lead, { now })
  );

  const industryBreakdown = Object.entries(
    leads.reduce((acc, lead) => {
      const industry = primaryIndustry(lead);
      if (!acc[industry]) {
        acc[industry] = { industry, total: 0, usable: 0, suppressed: 0, campaign_eligible: 0 };
      }
      acc[industry].total += 1;
      if (isUsableLead(lead)) acc[industry].usable += 1;
      if (isSuppressedLead(lead)) acc[industry].suppressed += 1;
      if (campaignEligibleLeads.includes(lead)) acc[industry].campaign_eligible += 1;
      return acc;
    }, {})
  ).map(([, row]) => ({
    ...row,
    ready_for_25: row.campaign_eligible >= 25,
  })).sort((left, right) => right.total - left.total);

  const suppressionBreakdown = suppressedLeads.reduce((acc, lead) => {
    const reasons = getSuppressionReasons(lead);
    for (const reason of reasons.length ? reasons : ["other"]) {
      acc[reason] = (acc[reason] || 0) + 1;
    }
    return acc;
  }, {});

  const missingData = {
    missing_email: leads.filter((lead) => !hasLeadEmail(lead)).length,
    missing_phone: leads.filter((lead) => !hasLeadPhone(lead)).length,
    missing_website: leads.filter((lead) => !hasLeadWebsite(lead)).length,
    missing_industry_or_crm_tag: leads.filter((lead) => !hasLeadIndustryOrTag(lead)).length,
    missing_source_history: leads.filter((lead) => !toArray(lead.source_history).length).length,
    missing_normalized_email: leads.filter((lead) => hasLeadEmail(lead) && !hasValue(lead.normalized_email)).length,
    missing_normalized_phone: leads.filter((lead) => hasLeadPhone(lead) && !hasValue(lead.normalized_phone)).length,
  };

  const first25Preview = buildFirstCampaignDryRun(leads, {
    industry: previewIndustry,
    maxCount: previewMaxCount,
    now,
  });

  return {
    generated_at: now,
    source_of_truth: "Base44 Leads entity",
    summary: {
      total_leads: leads.length,
      usable_leads: usableLeads.length,
      missing_email: missingData.missing_email,
      missing_phone: missingData.missing_phone,
      missing_website: missingData.missing_website,
      suppressed_leads: suppressedLeads.length,
      unsubscribed: suppressionBreakdown.unsubscribed || 0,
      bounced: suppressionBreakdown.bounced || 0,
      dnc: suppressionBreakdown.do_not_contact || 0,
      duplicate_groups: duplicateRisk.duplicate_groups,
      campaign_eligible_leads: campaignEligibleLeads.length,
      first_25_preview_eligible: first25Preview.final_selected_count,
      high_risk_data_issues: leads.filter((lead) =>
        !hasLeadEmail(lead) || isSuppressedLead(lead) || ["duplicate_candidate", "manual_review"].includes(normalizeToken(lead.dedupe_status))
      ).length,
    },
    industry_breakdown: industryBreakdown,
    suppression_breakdown: suppressionBreakdown,
    missing_data: missingData,
    duplicate_risk: duplicateRisk,
    first_campaign_preview: first25Preview,
    backfill_readiness: {
      industry_and_crm_tag_needed: missingData.missing_industry_or_crm_tag,
      source_history_needed: missingData.missing_source_history,
      normalized_email_needed: missingData.missing_normalized_email,
      normalized_phone_needed: missingData.missing_normalized_phone,
      website_needed: missingData.missing_website,
    },
    launch_command_center: {
      category: "F CRM / Leads",
      mode: "documentation_only_until_launch_entities_exist",
      tasks: CRM_LAUNCH_TASKS,
      proofs: CRM_LAUNCH_PROOFS,
    },
  };
}
