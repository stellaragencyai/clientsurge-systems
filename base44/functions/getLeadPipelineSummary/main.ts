import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildLeadPipelineSnapshot,
  LEAD_PIPELINE_MAX_FETCH,
} from "../_shared/leadPipeline.js";
import { isLeadProductionTrusted } from "../_shared/trackCLeadTruth.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;
const EVENT_LIMIT = 5000;

function clampPageLimit(value: unknown) {
  return Math.min(Math.max(Number(value) || DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function clampOffset(value: unknown) {
  return Math.max(Number(value) || 0, 0);
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
      base44.asServiceRole.entities.Leads.list("-updated_date", LEAD_PIPELINE_MAX_FETCH),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", EVENT_LIMIT).catch(() => []),
    ]);

    const scopedLeads = user.role === "super_admin"
      ? leads || []
      : (leads || []).filter((lead) => !lead.assigned_to || lead.assigned_to === user.email);
    const visibleLeads = scopedLeads.filter(isLeadProductionTrusted);

    const snapshot = buildLeadPipelineSnapshot({
      leads: visibleLeads,
      events: events || [],
      filters,
      limit,
      offset,
    });

    return secureJson({
      ...snapshot,
      data_window: {
        limits: {
          leads: LEAD_PIPELINE_MAX_FETCH,
          events: EVENT_LIMIT,
        },
        truncated: {
          leads_capped: (leads || []).length >= LEAD_PIPELINE_MAX_FETCH,
          events_capped: (events || []).length >= EVENT_LIMIT,
        },
        crm_filter: {
          hidden_leads: scopedLeads.length - visibleLeads.length,
          rule_set: "track_c",
        },
      },
    });
  } catch (error) {
    console.error("Error in getLeadPipelineSummary:", error);
    const message = error instanceof Error ? error.message : "Failed to load lead pipeline summary";
    return secureJson({ error: message }, { status: 500 });
  }
});
