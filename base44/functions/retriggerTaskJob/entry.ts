import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_LEADS = 500;

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const { job_id } = await req.json().catch(() => ({}));
    if (!job_id) {
      return secureJson({ error: "job_id required" }, { status: 400 });
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

    const job = await base44.asServiceRole.entities.AutomationJob.get(job_id).catch(() => null);
    if (!job) {
      return secureJson({ error: "Job not found" }, { status: 404 });
    }

    if (user.role !== "admin") {
      const leads = await resolveOwnedLeads(base44, access, MAX_LEADS);
      const leadIds = new Set(leads.map((lead) => lead.id).filter(Boolean));
      if (!leadIds.has(job.lead_id)) {
        return secureJson({ error: "Unauthorized" }, { status: 403 });
      }
    }

    await base44.asServiceRole.entities.AutomationJob.update(job_id, {
      status: "queued",
      attempts: 0,
      last_error: null,
      processed_at: null,
      scheduled_for: new Date().toISOString(),
    });

    return secureJson({ success: true, message: "Job re-queued successfully" });
  } catch (error) {
    console.error("[retriggerTaskJob] retriggerTaskJob error:", error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
