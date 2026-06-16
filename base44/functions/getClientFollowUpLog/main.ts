import { secureJson } from "../_shared/response.ts";
/**
 * getClientFollowUpLog
 * Returns real CommunicationEvent records for the authenticated client's portal.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 500;
const MAX_EVENTS = 200;
const MAX_RECENT_SCAN = 800;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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
      ? safeFilter(base44.asServiceRole.entities.Leads, { order_id: access.order.id }, "-created_date", limit)
      : [],
    access?.project?.id
      ? safeFilter(base44.asServiceRole.entities.Leads, { client_project_id: access.project.id }, "-created_date", limit)
      : [],
    normalizedEmail
      ? safeFilter(base44.asServiceRole.entities.Leads, { created_by: normalizedEmail }, "-created_date", limit)
      : [],
  ]);

  return dedupeById(leadBuckets.flat()).slice(0, limit);
}

function sortByCreatedDateDesc(a, b) {
  return new Date(b?.created_date || 0).getTime() - new Date(a?.created_date || 0).getTime();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return secureJson({ error: "Authentication required" }, { status: 401 });
    }

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
      ? await safeList(base44.asServiceRole.entities.Leads, "-created_date", MAX_LEADS)
      : await resolveOwnedLeads(base44, access, MAX_LEADS);
    const leadIds = new Set(leads.map((lead) => lead.id).filter(Boolean));

    const [orderEvents, projectEvents, recentEvents] = await Promise.all([
      user.role !== "admin" && access?.order?.id
        ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { order_id: access.order.id }, "-created_date", MAX_EVENTS)
        : [],
      user.role !== "admin" && access?.project?.id
        ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { client_project_id: access.project.id }, "-created_date", MAX_EVENTS)
        : [],
      safeList(base44.asServiceRole.entities.CommunicationEvent, "-created_date", MAX_RECENT_SCAN),
    ]);

    const events = dedupeById([
      ...orderEvents,
      ...projectEvents,
      ...recentEvents.filter((event) => leadIds.has(event.lead_id)),
    ])
      .sort(sortByCreatedDateDesc)
      .slice(0, MAX_EVENTS);

    return secureJson({ success: true, events });
  } catch (error) {
    console.error("[getClientFollowUpLog] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
