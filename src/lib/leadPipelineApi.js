import { base44 } from "@/api/base44Client";
import { isLeadVisibleInSalesViews } from "@/lib/leadCleanupGuards";

const DIRECT_LEADS_PAGE_SIZE = 500;
const DIRECT_LEADS_MAX_ROWS = 25000;
const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Replied",
  "Qualified",
  "Booking Prompt Sent",
  "Booked",
  "Closed",
];
const CRM_STAGES = [
  "Not Contacted",
  "Contacted",
  "Opened / Clicked",
  "Replied",
  "Audit Booked",
  "Audit Completed",
  "Proposal Sent",
  "Won Pending Payment",
  "Won",
  "Lost",
  "Follow Up Later",
];
const STAGE_GROUPS = ["new", "working", "qualified", "booked", "closed"];
const ACTIONABILITY_SEGMENTS = [
  "reactivation",
  "nurture",
  "qualification",
  "follow_up",
  "high_value_outreach",
  "demo_requested",
  "awaiting_close",
];

const DEFAULT_PIPELINE_SUMMARY = {
  summary: {},
  leads: [],
  pagination: {},
  filter_options: {},
};

function safeMessage(error) {
  return String(error?.data?.error || error?.message || "").trim();
}

export function getLeadPipelineError(error, fallback = "Unable to load lead overview right now.") {
  const message = safeMessage(error);
  const status = error?.status || error?.response?.status || error?.data?.status;

  if (status === 404 || /\b404\b/.test(message) || /not found/i.test(message)) {
    return "Lead pipeline service is unavailable. Direct lead records are used where possible.";
  }

  if (/network|timeout|failed to fetch/i.test(message)) {
    return "Lead pipeline service timed out. Refresh or run the pipeline check.";
  }

  return message || fallback;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sortObjectKeys(object = {}) {
  return Object.keys(object).sort().reduce((result, key) => {
    result[key] = object[key];
    return result;
  }, {});
}

function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function deriveStageGroup(status) {
  if (status === "Closed") return "closed";
  if (status === "Booked") return "booked";
  if (status === "Qualified" || status === "Booking Prompt Sent") return "qualified";
  if (status === "Contacted" || status === "Replied") return "working";
  return "new";
}

function deriveCrmStage(lead) {
  if (CRM_STAGES.includes(lead.crm_stage)) return lead.crm_stage;
  if (lead.status === "Closed") return "Won";
  if (lead.status === "Booked") return "Audit Booked";
  if (lead.status === "Replied" || lead.status === "Qualified" || lead.status === "Booking Prompt Sent") return "Replied";
  if (lead.status === "Contacted") return "Contacted";
  return "Not Contacted";
}

function normalizeOfferKey(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "unassigned";
  if (text.includes("starter")) return "starter_system";
  if (text.includes("growth")) return "growth_system";
  if (text.includes("elite") || text.includes("pro")) return "elite_system";
  if (text.includes("single")) return "single_service";
  return text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unassigned";
}

function offerKeyForLead(lead) {
  const offer = lead.recommended_offer || {};
  return normalizeOfferKey(
    offer.package_key ||
    offer.package_name ||
    offer.primary_service_name ||
    lead.recommended_offer_key ||
    lead.package_key ||
    lead.package_type ||
    lead.selected_package_type
  );
}

function deriveActionability(lead) {
  const segments = new Set(Array.isArray(lead.actionability) ? lead.actionability.filter(Boolean) : []);
  const score = numberValue(lead.lead_score, lead.intent_score, lead.intelligence_score);
  const status = lead.status;
  const stage = lead.crm_stage;

  if (score >= 75) segments.add("high_value_outreach");
  if (status === "Replied" || status === "Contacted" || stage === "Follow Up Later") segments.add("follow_up");
  if (status === "Qualified" || status === "Booking Prompt Sent") segments.add("qualification");
  if (status === "Booked" || stage === "Audit Booked") segments.add("demo_requested");
  if (stage === "Won Pending Payment" || stage === "Proposal Sent") segments.add("awaiting_close");
  if (status === "New" && score < 50) segments.add("nurture");

  const lastActivity = lead.last_activity_at || lead.updated_date || lead.created_date;
  if (lastActivity) {
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
    if (Number.isFinite(daysSinceActivity) && daysSinceActivity >= 30 && status !== "Closed") segments.add("reactivation");
  }

  return Array.from(segments).filter((segment) => ACTIONABILITY_SEGMENTS.includes(segment));
}

function normalizeLead(lead) {
  const status = lead.status || lead.lead_status || "New";
  const leadScore = numberValue(lead.lead_score, lead.intent_score, lead.intelligence_score, lead.score);
  const stageGroup = lead.stage_group || deriveStageGroup(status);
  const normalized = {
    ...lead,
    status,
    lead_score: leadScore,
    stage_group: stageGroup,
    crm_stage: lead.crm_stage || deriveCrmStage({ ...lead, status }),
    industry: lead.industry || lead.business_type || lead.niche || "",
    intake_type: lead.intake_type || "legacy",
    source: lead.source || lead.lead_source || "unknown",
    activation_priority: lead.activation_priority || (leadScore >= 80 ? "Critical" : leadScore >= 60 ? "High" : leadScore >= 35 ? "Medium" : "Review"),
    recommended_offer: lead.recommended_offer || null,
    recent_movement: lead.recent_movement || {
      label: "Imported lead",
      detail: lead.updated_date || lead.created_date
        ? `Last updated ${new Date(lead.updated_date || lead.created_date).toLocaleDateString()}`
        : "No tracked activity yet.",
    },
    next_action: lead.next_action || {
      label: status === "New" ? "Review lead" : "Follow up",
      detail: "Review lead context and choose the next operator action.",
    },
  };

  normalized.crm_stage = deriveCrmStage(normalized);
  normalized.actionability = deriveActionability(normalized);
  return normalized;
}

function matchesFilter(lead, filters = {}) {
  const search = String(filters.search || "").trim().toLowerCase();
  if (search) {
    const haystack = [
      lead.full_name,
      lead.business_name,
      lead.email,
      lead.phone,
      lead.business_type,
      lead.source,
    ].join(" ").toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  const status = filters.status || filters.lead_status;
  if (status && status !== "all" && lead.status !== status) return false;
  if (filters.source && filters.source !== "all" && lead.source !== filters.source) return false;
  if (filters.intake_type && filters.intake_type !== "all" && lead.intake_type !== filters.intake_type) return false;
  if (filters.stage_group && filters.stage_group !== "all" && lead.stage_group !== filters.stage_group) return false;
  if (filters.priority && filters.priority !== "all" && lead.activation_priority !== filters.priority) return false;
  if (filters.segment && filters.segment !== "all" && !(lead.actionability || []).includes(filters.segment)) return false;
  if (filters.lead_state && filters.lead_state !== "all" && lead.lead_state !== filters.lead_state) return false;
  if (filters.intelligence_segment && filters.intelligence_segment !== "all" && lead.intelligence_segment !== filters.intelligence_segment) return false;

  const scoreMin = filters.scoreMin || filters.score_min;
  const scoreMax = filters.scoreMax || filters.score_max;
  if (scoreMin && Number(lead.lead_score || 0) < Number(scoreMin)) return false;
  if (scoreMax && Number(lead.lead_score || 0) > Number(scoreMax)) return false;

  if (filters.industry && filters.industry !== "all") {
    const requested = String(filters.industry).trim().toLowerCase();
    const tokens = [
      lead.industry,
      lead.business_type,
      lead.niche,
      ...(Array.isArray(lead.industry_tags) ? lead.industry_tags : []),
    ].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
    if (!tokens.some((token) => token === requested || token.includes(requested) || requested.includes(token))) return false;
  }

  return true;
}

function isTrustedLead(lead) {
  try {
    return isLeadVisibleInSalesViews(lead);
  } catch {
    return true;
  }
}

function scopeTrustedLeads(leads, filters = {}) {
  return filters.includeFlagged === true ? leads : leads.filter(isTrustedLead);
}

function countSegments(leads) {
  return leads.reduce((counts, lead) => {
    (lead.actionability || []).forEach((segment) => {
      counts[segment] = (counts[segment] || 0) + 1;
    });
    return counts;
  }, {});
}

function countRecommendedOffers(leads) {
  return leads.reduce((counts, lead) => {
    const key = offerKeyForLead(lead);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildLast7Days(leads) {
  const counts = {};
  leads.forEach((lead) => {
    const value = lead.created_date || lead.created_at || lead.last_activity_at;
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    const key = dayKey(date);
    counts[key] = (counts[key] || 0) + 1;
  });

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = dayKey(date);
    return { date: key, leads: counts[key] || 0 };
  });
}

function isEmptySummary(data) {
  const total = Number(data?.summary?.total_leads || 0);
  const rawTotal = Number(data?.summary?.raw_total_leads || 0);
  const rowsLoaded = Number(data?.data_window?.rows_loaded?.leads || data?.data_window?.rows_loaded || 0);
  return !data?.leads?.length && total === 0 && rawTotal === 0 && rowsLoaded === 0;
}

async function fetchDirectLeadsSnapshot(filters = {}) {
  const allLeads = [];

  for (let skip = 0; skip < DIRECT_LEADS_MAX_ROWS; skip += DIRECT_LEADS_PAGE_SIZE) {
    const page = await base44.entities.Leads.list("-created_date", DIRECT_LEADS_PAGE_SIZE, skip);
    const safePage = Array.isArray(page) ? page : [];
    allLeads.push(...safePage);
    if (safePage.length < DIRECT_LEADS_PAGE_SIZE) break;
  }

  const normalized = allLeads.map(normalizeLead);
  const trustedScope = scopeTrustedLeads(normalized, filters);
  const filtered = trustedScope.filter((lead) => matchesFilter(lead, filters));
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 250);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  const leads = filtered.slice(offset, offset + limit);
  const recentLeadActivity = [...trustedScope]
    .sort((left, right) => new Date(right.updated_date || right.created_date || 0) - new Date(left.updated_date || left.created_date || 0))
    .slice(0, 8);

  return {
    generated_at: new Date().toISOString(),
    summary: {
      raw_total_leads: normalized.length,
      total_leads: trustedScope.length,
      trusted_leads: trustedScope.length,
      hidden_junk_leads: Math.max(0, normalized.length - trustedScope.length),
      filtered_leads: filtered.length,
      actionable_leads: filtered.filter((lead) => lead.status !== "Closed").length,
      status_counts: sortObjectKeys(countBy(trustedScope, "status")),
      crm_stage_counts: sortObjectKeys(countBy(trustedScope, "crm_stage")),
      stage_counts: sortObjectKeys(countBy(trustedScope, "stage_group")),
      source_counts: sortObjectKeys(countBy(trustedScope, "source")),
      intake_counts: sortObjectKeys(countBy(trustedScope, "intake_type")),
      industry_counts: sortObjectKeys(countBy(trustedScope, "industry")),
      segment_counts: sortObjectKeys(countSegments(trustedScope)),
      recommended_offer_counts: sortObjectKeys(countRecommendedOffers(trustedScope)),
      recent_imports: [],
      recent_lead_activity: recentLeadActivity,
      priority_queue: [...filtered]
        .sort((left, right) => (right.lead_score ?? 0) - (left.lead_score ?? 0))
        .slice(0, 12),
      activation_segments: ACTIONABILITY_SEGMENTS,
      last7Days: buildLast7Days(trustedScope),
      truth_source: "client_direct_leads_fallback",
    },
    leads,
    pagination: {
      limit,
      offset,
      returned: leads.length,
      total_filtered: filtered.length,
      has_more: offset + leads.length < filtered.length,
    },
    filter_options: {
      statuses: LEAD_STATUSES,
      crm_stages: CRM_STAGES,
      stage_groups: STAGE_GROUPS,
      intake_types: Object.keys(countBy(trustedScope, "intake_type")).sort(),
      segments: ACTIONABILITY_SEGMENTS,
      sources: Object.keys(countBy(trustedScope, "source")).sort(),
      industries: Object.keys(countBy(trustedScope, "industry")).sort(),
    },
    data_window: {
      direct_entity_fallback: true,
      rows_loaded: normalized.length,
      trusted_rows_loaded: trustedScope.length,
      hidden_junk_rows: Math.max(0, normalized.length - trustedScope.length),
      page_size: DIRECT_LEADS_PAGE_SIZE,
      max_rows: DIRECT_LEADS_MAX_ROWS,
      truncated: normalized.length >= DIRECT_LEADS_MAX_ROWS,
    },
  };
}

function applyTrustedLeadScope(data, filters = {}) {
  if (filters.includeFlagged === true) return data;

  const leads = Array.isArray(data.leads) ? data.leads.filter(isTrustedLead) : [];
  const priorityQueue = Array.isArray(data.summary?.priority_queue)
    ? data.summary.priority_queue.filter(isTrustedLead)
    : [];
  const recentLeadActivity = Array.isArray(data.summary?.recent_lead_activity)
    ? data.summary.recent_lead_activity.filter(isTrustedLead)
    : [];

  const rawTotal = Number(
    data.summary?.raw_total_leads ??
    data.data_window?.rows_loaded?.leads ??
    data.data_window?.rows_loaded ??
    data.summary?.total_leads ??
    0
  );
  const backendTotal = Number(data.summary?.total_leads || 0);
  const trustedEstimate = Number(data.summary?.trusted_leads ?? data.summary?.filtered_leads ?? backendTotal ?? leads.length);
  const hiddenJunk = Number(data.summary?.hidden_junk_leads ?? Math.max(0, rawTotal - trustedEstimate));

  return {
    ...data,
    leads,
    summary: {
      ...(data.summary || {}),
      raw_total_leads: rawTotal,
      total_leads: trustedEstimate,
      trusted_leads: trustedEstimate,
      hidden_junk_leads: hiddenJunk,
      hidden_junk_note: "Normal sales views hide quarantined/test/duplicate leads by default.",
      filtered_leads: leads.length,
      actionable_leads: leads.filter((lead) => lead.status !== "Closed").length,
      priority_queue: priorityQueue,
      recent_lead_activity: recentLeadActivity,
      truth_source: data.summary?.truth_source || "getLeadPipelineSummary",
    },
    pagination: {
      ...(data.pagination || {}),
      returned: leads.length,
    },
  };
}

function sortLeadCollections(data) {
  if (Array.isArray(data.leads)) {
    data.leads = [...data.leads].sort((left, right) => (right.lead_score ?? 0) - (left.lead_score ?? 0));
  }
  if (Array.isArray(data.summary?.priority_queue)) {
    data.summary.priority_queue = [...data.summary.priority_queue].sort(
      (left, right) => (right.lead_score ?? 0) - (left.lead_score ?? 0)
    );
  }
  return data;
}

export async function fetchLeadPipelineSummary(filters = {}) {
  let data = null;
  let usedDirectFallback = false;
  let pipelineError = null;

  try {
    const response = await base44.functions.invoke("getLeadPipelineSummary", filters);
    data = response?.data || DEFAULT_PIPELINE_SUMMARY;
  } catch (error) {
    pipelineError = error;
    usedDirectFallback = true;
    try {
      data = await fetchDirectLeadsSnapshot(filters);
    } catch (fallbackError) {
      fallbackError.data = fallbackError.data || {};
      fallbackError.data.error = "Lead records are temporarily unavailable. Verify Leads entity access or run Pipeline Check.";
      fallbackError.pipelineError = error;
      throw fallbackError;
    }
  }

  if (isEmptySummary(data)) {
    usedDirectFallback = true;
    data = await fetchDirectLeadsSnapshot(filters);
  }

  data = applyTrustedLeadScope(data, filters);

  if (usedDirectFallback) {
    data = {
      ...data,
      summary: {
        ...(data.summary || {}),
        truth_source: "client_direct_leads_fallback",
      },
      data_window: {
        ...(data.data_window || {}),
        direct_entity_fallback: true,
        fallback_reason: pipelineError ? getLeadPipelineError(pipelineError) : "Pipeline returned an empty summary.",
      },
    };
  }

  return sortLeadCollections(data);
}

export function subscribeToLeadPipelineChanges({ onChange, onError } = {}) {
  const subscribe = base44.entities?.Leads?.subscribe;
  if (typeof subscribe !== "function") {
    return null;
  }

  try {
    const subscription = subscribe((event) => {
      if (["create", "update", "delete"].includes(event?.type)) {
        onChange?.(event);
      }
    });

    return () => subscription?.unsubscribe?.();
  } catch (error) {
    onError?.(error);
    return null;
  }
}

export async function previewLeadImport({ rows, import_source = "manual_import" }) {
  const response = await base44.functions.invoke("importLeads", {
    rows,
    import_source,
    dry_run: true,
  });

  return response?.data?.preview || null;
}

export async function executeLeadImport({ rows, import_source = "manual_import" }) {
  const response = await base44.functions.invoke("importLeads", {
    rows,
    import_source,
    dry_run: false,
  });

  return response?.data?.result || null;
}

export async function triggerLeadScoring(lead_id = null) {
  const response = await base44.functions.invoke("scoreLeads", lead_id ? { lead_id } : {});
  return response?.data || {};
}

export async function runLeadDeduplication({ dry_run = true } = {}) {
  const response = await base44.functions.invoke("deduplicateLeads", { dry_run });
  return response?.data || {};
}

export async function prepareLeadOutreachQueue() {
  const dedupe = await runLeadDeduplication({ dry_run: false });
  const scoring = await triggerLeadScoring();
  return { dedupe, scoring };
}

export async function saveLeadStatus({ lead_id, status, note = "" }) {
  const response = await base44.functions.invoke("updateLeadStatus", {
    lead_id,
    status,
    note,
  });

  return response?.data || {};
}

export async function bridgeCrmWon({ lead_id, package_key, payment_source, follow_up_date = "", note = "" }) {
  const response = await base44.functions.invoke("crmWonBridge", {
    lead_id,
    package_key,
    payment_source,
    follow_up_date,
    note,
  });

  return response?.data || {};
}
