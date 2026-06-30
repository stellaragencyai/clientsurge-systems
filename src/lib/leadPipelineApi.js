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

export function getLeadPipelineError(error, fallback) {
  return error?.data?.error || error?.message || fallback;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row?.[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
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

function normalizeLead(lead) {
  const stageGroup = lead.stage_group || deriveStageGroup(lead.status);
  return {
    ...lead,
    stage_group: stageGroup,
    crm_stage: deriveCrmStage(lead),
    industry: lead.industry || lead.business_type || lead.niche || "",
    intake_type: lead.intake_type || "legacy",
    source: lead.source || "unknown",
    actionability: lead.actionability || [],
    next_action: lead.next_action || {
      label: lead.status === "New" ? "Review lead" : "Follow up",
      detail: "Review lead context and choose the next operator action.",
    },
    recommended_offer: lead.recommended_offer || null,
    recent_movement: lead.recent_movement || {
      label: "Imported lead",
      detail: lead.updated_date || lead.created_date ? `Last updated ${new Date(lead.updated_date || lead.created_date).toLocaleDateString()}` : "No tracked activity yet.",
    },
  };
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

  if (filters.status && filters.status !== "all" && lead.status !== filters.status) return false;
  if (filters.source && filters.source !== "all" && lead.source !== filters.source) return false;
  if (filters.intake_type && filters.intake_type !== "all" && lead.intake_type !== filters.intake_type) return false;
  if (filters.stage_group && filters.stage_group !== "all" && lead.stage_group !== filters.stage_group) return false;
  if (filters.priority && filters.priority !== "all" && lead.activation_priority !== filters.priority) return false;
  if (filters.segment && filters.segment !== "all" && !(lead.actionability || []).includes(filters.segment)) return false;
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

function scopeTrustedLeads(leads, filters = {}) {
  return filters.includeFlagged === true ? leads : leads.filter(isLeadVisibleInSalesViews);
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
      status_counts: countBy(trustedScope, "status"),
      crm_stage_counts: countBy(trustedScope, "crm_stage"),
      stage_counts: countBy(trustedScope, "stage_group"),
      source_counts: countBy(trustedScope, "source"),
      intake_counts: countBy(trustedScope, "intake_type"),
      industry_counts: countBy(trustedScope, "industry"),
      segment_counts: {},
      recommended_offer_counts: {},
      recent_imports: [],
      recent_lead_activity: recentLeadActivity,
      priority_queue: [...filtered]
        .sort((left, right) => (right.lead_score ?? 0) - (left.lead_score ?? 0))
        .slice(0, 12),
      activation_segments: [],
      last7Days: [],
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
      segments: [],
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

function isEmptySummary(data) {
  const total = Number(data?.summary?.total_leads || 0);
  const rawTotal = Number(data?.summary?.raw_total_leads || 0);
  const rowsLoaded = Number(data?.data_window?.rows_loaded?.leads || data?.data_window?.rows_loaded || 0);
  return !data?.leads?.length && total === 0 && rawTotal === 0 && rowsLoaded === 0;
}

function applyTrustedLeadScope(data, filters = {}) {
  if (filters.includeFlagged === true) return data;

  const leads = Array.isArray(data.leads) ? data.leads.filter(isLeadVisibleInSalesViews) : [];
  const priorityQueue = Array.isArray(data.summary?.priority_queue)
    ? data.summary.priority_queue.filter(isLeadVisibleInSalesViews)
    : [];
  const recentLeadActivity = Array.isArray(data.summary?.recent_lead_activity)
    ? data.summary.recent_lead_activity.filter(isLeadVisibleInSalesViews)
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

export async function fetchLeadPipelineSummary(filters = {}) {
  const response = await base44.functions.invoke("getLeadPipelineSummary", filters);
  let data = response?.data || {
    summary: {},
    leads: [],
    pagination: {},
    filter_options: {},
  };

  if (isEmptySummary(data)) {
    data = await fetchDirectLeadsSnapshot(filters);
  }

  data = applyTrustedLeadScope(data, filters);

  // Sort lead list and priority queue by lead_score descending (high-intent first)
  if (Array.isArray(data.leads)) {
    data.leads = [...data.leads].sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0));
  }
  if (Array.isArray(data.summary?.priority_queue)) {
    data.summary.priority_queue = [...data.summary.priority_queue].sort(
      (a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0)
    );
  }

  return data;
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
