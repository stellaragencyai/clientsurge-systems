import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  buildLeadPipelineSnapshot,
  LEAD_PIPELINE_MAX_FETCH,
} from "../_shared/leadPipeline.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 250;
const EVENT_LIMIT = 5000;
const LEADS_PAGE_SIZE = 500;

function clampPageLimit(value: unknown) {
  return Math.min(Math.max(Number(value) || DEFAULT_LIMIT, 1), MAX_LIMIT);
}

function clampOffset(value: unknown) {
  return Math.max(Number(value) || 0, 0);
}

async function listAllLeads(base44: any) {
  const rows: any[] = [];

  for (let skip = 0; skip < LEAD_PIPELINE_MAX_FETCH; skip += LEADS_PAGE_SIZE) {
    const page = await base44.asServiceRole.entities.Leads.list("-updated_date", LEADS_PAGE_SIZE, skip);
    const safePage = Array.isArray(page) ? page : [];
    rows.push(...safePage);

    if (safePage.length < LEADS_PAGE_SIZE) {
      break;
    }
  }

  return rows;
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
      listAllLeads(base44),
      base44.asServiceRole.entities.CommunicationEvent.list("-created_date", EVENT_LIMIT).catch(() => []),
    ]);

    // This endpoint is admin-only. Admin dashboard totals must represent the real org-wide Lead store,
    // not only records assigned to the current admin account.
    const snapshot = buildLeadPipelineSnapshot({
      leads: leads || [],
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
          lead_page_size: LEADS_PAGE_SIZE,
        },
        rows_loaded: {
          leads: (leads || []).length,
          events: (events || []).length,
        },
        truncated: {
          leads_capped: (leads || []).length >= LEAD_PIPELINE_MAX_FETCH,
          events_capped: (events || []).length >= EVENT_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error("Error in getLeadPipelineSummary:", error);
    const message = error instanceof Error ? error.message : "Failed to load lead pipeline summary";
    return secureJson({ error: message }, { status: 500 });
  }
});
