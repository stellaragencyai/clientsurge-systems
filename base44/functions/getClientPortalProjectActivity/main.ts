import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_EVENTS = 50;
const MAX_CHECKLISTS = 100;
const MAX_STEPS = 500;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLimit(value, fallback = 20, max = MAX_EVENTS) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function sortByDateDesc(a, b) {
  return new Date(b?.created_date || b?.updated_date || 0).getTime() - new Date(a?.created_date || a?.updated_date || 0).getTime();
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

async function loadOwnedEvents(base44, access, limit) {
  const eventBuckets = await Promise.all([
    access?.order?.id
      ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { order_id: access.order.id }, "-created_date", limit)
      : [],
    access?.project?.id
      ? safeFilter(base44.asServiceRole.entities.CommunicationEvent, { client_project_id: access.project.id }, "-created_date", limit)
      : [],
  ]);

  return dedupeById(eventBuckets.flat())
    .sort(sortByDateDesc)
    .slice(0, limit);
}

function buildSystemStatus(events = []) {
  if (!events.length) {
    return {
      status: "slow",
      last_activity: null,
      recent_failures: 0,
    };
  }

  const latest = events[0];
  const recentFailures = events.filter((event) => event.status === "failed").length;
  const hoursSinceLast = (Date.now() - new Date(latest.created_date || 0).getTime()) / (1000 * 60 * 60);

  if (recentFailures >= 3) {
    return {
      status: "issue",
      last_activity: latest.created_date || null,
      recent_failures: recentFailures,
    };
  }

  if (hoursSinceLast > 72) {
    return {
      status: "slow",
      last_activity: latest.created_date || null,
      recent_failures: recentFailures,
    };
  }

  return {
    status: "active",
    last_activity: latest.created_date || null,
    recent_failures: recentFailures,
  };
}

async function loadOwnedChecklists(base44, access) {
  if (!access?.order?.id) {
    return [];
  }

  const [records, stepRecords] = await Promise.all([
    safeFilter(base44.asServiceRole.entities.AutomationChecklist, { order_id: access.order.id }, "-created_date", MAX_CHECKLISTS),
    safeFilter(base44.asServiceRole.entities.AutomationChecklistStep, { order_id: access.order.id }, "step_order", MAX_STEPS),
  ]);

  const stepsByChecklist = new Map();
  for (const step of stepRecords) {
    const current = stepsByChecklist.get(step.automation_checklist_id) || [];
    current.push(step);
    stepsByChecklist.set(step.automation_checklist_id, current);
  }

  return records.map((record) => ({
    ...record,
    steps: (stepsByChecklist.get(record.id) || []).sort(
      (a, b) => (a.step_order || 0) - (b.step_order || 0)
    ),
  }));
}

function buildChecklistSummary(checklists = []) {
  const allSteps = checklists.flatMap((record) => record.steps || []);
  const completed = allSteps.filter((step) => step.status === "complete").length;
  const total = allSteps.length;

  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return secureJson({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (access.status !== "resolved" || !access.project?.id) {
      return secureJson({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const section = cleanString(body?.section) || "all";
    const limit = normalizeLimit(
      body?.limit,
      section === "status" ? 10 : 20
    );

    if (!["all", "timeline", "status", "checklist"].includes(section)) {
      return secureJson({ error: "Unsupported section" }, { status: 400 });
    }

    const response = {
      success: true,
      project_id: access.project.id,
      order_id: access.order?.id || null,
    };

    const needsEvents = ["all", "timeline", "status"].includes(section);
    const needsChecklist = ["all", "checklist"].includes(section);

    let events = [];
    if (needsEvents) {
      events = await loadOwnedEvents(base44, access, limit);
      if (section !== "status") {
        response.events = events;
      }
      response.system_status = buildSystemStatus(events);
    }

    if (needsChecklist) {
      const checklists = await loadOwnedChecklists(base44, access);
      response.checklists = checklists;
      response.checklist_summary = buildChecklistSummary(checklists);
    }

    return secureJson(response);
  } catch (error) {
    console.error("[getClientPortalProjectActivity] Error:", error.message);
    return secureJson({ error: error.message }, { status: 500 });
  }
});
