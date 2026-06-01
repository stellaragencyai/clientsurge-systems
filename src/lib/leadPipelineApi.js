import { base44 } from "@/api/base44Client";

const DIRECT_LEADS_PAGE_SIZE = 5000;
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

function normalizeLead(lead) {
  const stageGroup = lead.stage_group || deriveStageGroup(lead.status);
  return {
    ...lead,
    stage_group: stageGroup,
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

  return true;
}

async function fetchDirectLeadsSnapshot(filters = {}) {
  const allLeads = [];

  for (let skip = 0; skip < DIRECT_LEADS_MAX_ROWS; skip += DIRECT_LEADS_PAGE_SIZE) {
    const page = await base44.entities.Leads.list("-created_date", DIRECT_LEADS_PAGE_SIZE, skip);
    allLeads.push(...(page || []));
    if (!page || page.length < DIRECT_LEADS_PAGE_SIZE) break;
  }

  const normalized = allLeads.map(normalizeLead);
  const filtered = normalized.filter((lead) => matchesFilter(lead, filters));
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 250);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  const leads = filtered.slice(offset, offset + limit);
  const recentLeadActivity = [...normalized]
    .sort((left, right) => new Date(right.updated_date || right.created_date || 0) - new Date(left.updated_date || left.created_date || 0))
    .slice(0, 8);

  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_leads: normalized.length,
      filtered_leads: filtered.length,
      actionable_leads: filtered.filter((lead) => lead.status !== "Closed").length,
      status_counts: countBy(normalized, "status"),
      stage_counts: countBy(normalized, "stage_group"),
      source_counts: countBy(normalized, "source"),
      intake_counts: countBy(normalized, "intake_type"),
      segment_counts: {},
      recommended_offer_counts: {},
      recent_imports: [],
      recent_lead_activity: recentLeadActivity,
      priority_queue: [...filtered]
        .sort((left, right) => (right.lead_score ?? 0) - (left.lead_score ?? 0))
        .slice(0, 12),
      activation_segments: [],
      last7Days: [],
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
      stage_groups: STAGE_GROUPS,
      intake_types: Object.keys(countBy(normalized, "intake_type")).sort(),
      segments: [],
      sources: Object.keys(countBy(normalized, "source")).sort(),
    },
    data_window: {
      direct_entity_fallback: true,
      rows_loaded: normalized.length,
      max_rows: DIRECT_LEADS_MAX_ROWS,
    },
  };
}

function isEmptySummary(data) {
  return !data?.leads?.length && Number(data?.summary?.total_leads || 0) === 0;
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
