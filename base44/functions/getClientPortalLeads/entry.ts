import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 1000;
const DEFAULT_LIMIT = 200;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLimit(value, fallback = DEFAULT_LIMIT) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_LEADS);
}

function dedupeById(records = []) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) {
      return false;
    }
    seen.add(record.id);
    return true;
  });
}

async function safeFilter(collection, query, sort = "-created_date", limit = 25) {
  try {
    const results = await collection.filter(query, sort, limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function safeList(collection, sort = "-created_date", limit = 25) {
  try {
    const results = await collection.list(sort, limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function resolveOwnedLeads(base44, access, limit = MAX_LEADS) {
  const normalizedEmail =
    cleanString(access?.project?.client_email) ||
    cleanString(access?.client?.email);

  const leadBuckets = await Promise.all([
    access?.order?.id
      ? safeFilter(base44.asServiceRole.entities.Leads, { order_id: access.order.id }, "-updated_date", limit)
      : [],
    access?.project?.id
      ? safeFilter(base44.asServiceRole.entities.Leads, { client_project_id: access.project.id }, "-updated_date", limit)
      : [],
    normalizedEmail
      ? safeFilter(base44.asServiceRole.entities.Leads, { created_by: normalizedEmail }, "-updated_date", limit)
      : [],
  ]);

  return dedupeById(leadBuckets.flat())
    .sort((a, b) => new Date(b?.updated_date || b?.created_date || 0).getTime() - new Date(a?.updated_date || a?.created_date || 0).getTime())
    .slice(0, limit);
}

function buildSummary(leads) {
  const summary = {
    total: leads.length,
    contacted: 0,
    qualified: 0,
    booked: 0,
    new_this_week: 0,
  };
  const weekStartMs = Date.now() - 7 * 86400000;

  for (const lead of leads) {
    if (["Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked"].includes(lead.status)) {
      summary.contacted += 1;
    }
    if (lead.status === "Qualified") {
      summary.qualified += 1;
    }
    if (lead.status === "Booked") {
      summary.booked += 1;
    }
    const createdAt = new Date(lead.created_date || 0).getTime();
    if (Number.isFinite(createdAt) && createdAt >= weekStartMs) {
      summary.new_this_week += 1;
    }
  }

  return summary;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = normalizeLimit(body?.limit, DEFAULT_LIMIT);

    const access = user.role === "admin"
      ? null
      : await resolveClientPortalAccess({
          base44,
          userEmail: user.email,
        });

    if (user.role !== "admin" && access?.status !== "resolved") {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const leads = user.role === "admin"
      ? await safeList(base44.asServiceRole.entities.Leads, "-updated_date", limit)
      : await resolveOwnedLeads(base44, access, limit);

    return secureJson({
      success: true,
      leads,
      summary: buildSummary(leads),
      last_updated: new Date().toISOString(),
      data_window: {
        lead_limit: limit,
        truncated: leads.length >= limit,
      },
    });
  } catch (error) {
    console.error("[getClientPortalLeads] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
