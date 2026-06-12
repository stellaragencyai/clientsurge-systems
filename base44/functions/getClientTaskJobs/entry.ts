import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 500;
const MAX_RESPONSE_ITEMS = 100;
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

function normalizeLimit(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), MAX_RESPONSE_ITEMS);
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
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = normalizeLimit(body?.limit, 50);

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

    if (leadIds.size === 0) {
      return secureJson({
        jobs: [],
        stats: { total: 0, completed: 0, queued: 0, processing: 0, failed: 0 },
        events: [],
      });
    }

    const leadMap = {};
    leads.forEach((lead) => {
      leadMap[lead.id] = lead;
    });

    const scanLimit = Math.min(Math.max(limit * 8, 300), MAX_RECENT_SCAN);
    const [recentJobs, orderEvents, projectEvents, recentEvents] = await Promise.all([
      safeList(base44.asServiceRole.entities.AutomationJob, "-created_date", scanLimit),
      user.role !== "admin" && access?.order?.id
        ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { order_id: access.order.id }, "-created_date", limit)
        : [],
      user.role !== "admin" && access?.project?.id
        ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { client_project_id: access.project.id }, "-created_date", limit)
        : [],
      safeList(base44.asServiceRole.entities.CommunicationEvent, "-created_date", scanLimit),
    ]);

    const ownedJobs = recentJobs
      .filter((job) => leadIds.has(job.lead_id))
      .sort(sortByCreatedDateDesc)
      .slice(0, limit);

    const enrichedJobs = ownedJobs.map((job) => ({
      ...job,
      lead_name: leadMap[job.lead_id]?.full_name || "Unknown Lead",
      lead_business: leadMap[job.lead_id]?.business_name || "",
    }));

    const stats = {
      total: enrichedJobs.length,
      completed: enrichedJobs.filter((job) => job.status === "completed").length,
      queued: enrichedJobs.filter((job) => job.status === "queued").length,
      processing: enrichedJobs.filter((job) => job.status === "processing").length,
      failed: enrichedJobs.filter((job) => job.status === "failed").length,
    };

    const ownedEvents = dedupeById([
      ...orderEvents,
      ...projectEvents,
      ...recentEvents.filter((event) => leadIds.has(event.lead_id)),
    ])
      .sort(sortByCreatedDateDesc)
      .slice(0, limit)
      .map((event) => ({
        ...event,
        lead_name: leadMap[event.lead_id]?.full_name || "Unknown Lead",
        lead_business: leadMap[event.lead_id]?.business_name || "",
      }));

    return secureJson({ jobs: enrichedJobs, stats, events: ownedEvents });
  } catch (error) {
    console.error("[getClientTaskJobs] getClientTaskJobs error:", error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
