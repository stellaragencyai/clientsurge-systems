import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

export const LEAD_PIPELINE_MAX_FETCH = 25000;

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;
const PAGE_SIZE = 5000;
const EVENT_LIMIT = 5000;
const LEAD_STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];
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

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

function clampPageLimit(value: unknown) {
  return Math.min(Math.max(Number(value) || DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function clampOffset(value: unknown) {
  return Math.max(Number(value) || 0, 0);
}

function countBy(rows: Record<string, unknown>[], key: string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const value = String(row?.[key] || "unknown");
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function deriveStageGroup(status: unknown) {
  if (status === "Closed") return "closed";
  if (status === "Booked") return "booked";
  if (status === "Qualified") return "qualified";
  if (status === "Booking Prompt Sent" || status === "Contacted" || status === "Replied") return "working";
  return "new";
}

function deriveCrmStage(lead: Record<string, unknown>) {
  if (CRM_STAGES.includes(String(lead.crm_stage || ""))) return lead.crm_stage;
  if (lead.status === "Closed") return "Won";
  if (lead.status === "Booked") return "Audit Booked";
  if (lead.status === "Replied" || lead.status === "Qualified" || lead.status === "Booking Prompt Sent") return "Replied";
  if (lead.status === "Contacted") return "Contacted";
  return "Not Contacted";
}

function normalizeLead(lead: Record<string, unknown>) {
  const stageGroup = String(lead.stage_group || deriveStageGroup(lead.status));
  return {
    ...lead,
    stage_group: stageGroup,
    crm_stage: deriveCrmStage(lead),
    industry: lead.industry || lead.business_type || lead.niche || "",
    intake_type: lead.intake_type || "legacy",
    source: lead.source || "unknown",
    actionability: Array.isArray(lead.actionability) ? lead.actionability : [],
    next_action: lead.next_action || {
      label: lead.status === "New" ? "Review lead" : "Follow up",
      detail: "Review lead context and choose the next operator action.",
    },
    recommended_offer: lead.recommended_offer || null,
    recent_movement: lead.recent_movement || {
      label: "Imported lead",
      detail: lead.updated_date || lead.created_date
        ? `Last updated ${new Date(String(lead.updated_date || lead.created_date)).toLocaleDateString()}`
        : "No tracked activity yet.",
    },
  };
}

function matchesFilter(lead: Record<string, unknown>, filters: Record<string, unknown> = {}) {
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
  if (filters.segment && filters.segment !== "all" && !(lead.actionability as unknown[] || []).includes(filters.segment)) return false;
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

async function fetchAll(entity: { list: (sort?: string, limit?: number, skip?: number) => Promise<Record<string, unknown>[]> }, sort: string, maxRows: number) {
  const rows: Record<string, unknown>[] = [];
  for (let skip = 0; skip < maxRows; skip += PAGE_SIZE) {
    const page = await entity.list(sort, Math.min(PAGE_SIZE, maxRows - skip), skip);
    rows.push(...(page || []));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

export function buildLeadPipelineSnapshot({
  leads,
  events = [],
  filters = {},
  limit = DEFAULT_LIMIT,
  offset = 0,
}: {
  leads: Record<string, unknown>[];
  events?: Record<string, unknown>[];
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}) {
  const normalized = leads.map(normalizeLead);
  const filtered = normalized.filter((lead) => matchesFilter(lead, filters));
  const page = filtered.slice(offset, offset + limit);
  const recentLeadActivity = [...normalized]
    .sort((left, right) =>
      new Date(String(right.updated_date || right.created_date || 0)).getTime() -
      new Date(String(left.updated_date || left.created_date || 0)).getTime()
    )
    .slice(0, 10);
  const priorityQueue = [...filtered]
    .sort((left, right) => Number(right.lead_score || 0) - Number(left.lead_score || 0))
    .slice(0, 12);

  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_leads: normalized.length,
      filtered_leads: filtered.length,
      actionable_leads: filtered.filter((lead) => lead.status !== "Closed").length,
      status_counts: countBy(normalized, "status"),
      crm_stage_counts: countBy(normalized, "crm_stage"),
      stage_counts: countBy(normalized, "stage_group"),
      source_counts: countBy(normalized, "source"),
      intake_counts: countBy(normalized, "intake_type"),
      industry_counts: countBy(normalized, "industry"),
      segment_counts: {},
      recommended_offer_counts: {},
      recent_imports: events.slice(0, 10),
      recent_lead_activity: recentLeadActivity,
      priority_queue: priorityQueue,
      activation_segments: [],
      last7Days: [],
    },
    leads: page,
    pagination: {
      limit,
      offset,
      returned: page.length,
      total_filtered: filtered.length,
      has_more: offset + page.length < filtered.length,
    },
    filter_options: {
      statuses: LEAD_STATUSES,
      crm_stages: CRM_STAGES,
      stage_groups: STAGE_GROUPS,
      intake_types: Object.keys(countBy(normalized, "intake_type")).sort(),
      segments: [],
      sources: Object.keys(countBy(normalized, "source")).sort(),
      industries: Object.keys(countBy(normalized, "industry")).sort(),
    },
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const filters = await req.json().catch(() => ({}));
    const limit = clampPageLimit(filters.limit);
    const offset = clampOffset(filters.offset);
    const [leads, events] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.Leads, "-updated_date", LEAD_PIPELINE_MAX_FETCH),
      fetchAll(base44.asServiceRole.entities.CommunicationEvent, "-created_date", EVENT_LIMIT).catch(() => []),
    ]);
    const scopedLeads = user.role === "super_admin"
      ? leads
      : leads.filter((lead) => !lead.assigned_to || lead.assigned_to === user.email);
    const snapshot = buildLeadPipelineSnapshot({ leads: scopedLeads, events, filters, limit, offset });

    return secureJson({
      ...snapshot,
      data_window: {
        limits: {
          leads: LEAD_PIPELINE_MAX_FETCH,
          events: EVENT_LIMIT,
        },
        rows_loaded: scopedLeads.length,
        truncated: {
          leads_capped: leads.length >= LEAD_PIPELINE_MAX_FETCH,
          events_capped: events.length >= EVENT_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error("Error in getLeadPipelineSummary:", error);
    const message = error instanceof Error ? error.message : "Failed to load lead pipeline summary";
    return secureJson({ error: message }, { status: 500 });
  }
});
