import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const PAGE_SIZE = 500;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dedupeById(records = []) {
  const seen = new Set();
  return records.filter((r) => {
    if (!r?.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

async function safeFilter(collection, query, limit = 500) {
  try {
    const results = await collection.filter(query, "-updated_date", limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function resolveOwnedLeads(base44, access, limit, skip) {
  const email = typeof access?.project?.client_email === "string"
    ? access.project.client_email.trim()
    : typeof access?.client?.email === "string"
    ? access.client.email.trim()
    : "";

  const fetchBuffer = limit + skip + 200;

  const [byOrder, byProject, byEmail] = await Promise.all([
    access?.order?.id
      ? safeFilter(base44.asServiceRole.entities.Leads, { order_id: access.order.id }, fetchBuffer)
      : [],
    access?.project?.id
      ? safeFilter(base44.asServiceRole.entities.Leads, { client_project_id: access.project.id }, fetchBuffer)
      : [],
    email
      ? safeFilter(base44.asServiceRole.entities.Leads, { created_by: email }, fetchBuffer)
      : [],
  ]);

  const sorted = dedupeById([...byOrder, ...byProject, ...byEmail])
    .sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));

  return sorted.slice(skip, skip + limit);
}

function buildSummary(leads) {
  const weekAgo = Date.now() - 7 * 86400000;
  return leads.reduce((s, l) => {
    if (["Contacted","Replied","Qualified","Booking Prompt Sent","Booked"].includes(l.status)) s.contacted++;
    if (l.status === "Qualified") s.qualified++;
    if (l.status === "Booked") s.booked++;
    if (new Date(l.created_date || 0).getTime() >= weekAgo) s.new_this_week++;
    return s;
  }, { total: leads.length, contacted: 0, qualified: 0, booked: 0, new_this_week: 0 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(1, Number(body?.limit) || PAGE_SIZE), PAGE_SIZE);
    const skip = Math.max(0, Number(body?.skip) || 0);

    let finalLeads = [];

    if (user.role === "admin" || user.role === "super_admin") {
      // Admin: fetch all leads with pagination
      try {
        const results = await base44.asServiceRole.entities.Leads.list("-updated_date", limit + skip);
        finalLeads = Array.isArray(results) ? results.slice(skip, skip + limit) : [];
      } catch {
        finalLeads = [];
      }
    } else {
      // Client: resolve access via project/order
      let access = null;
      try {
        const projects = await base44.asServiceRole.entities.ClientProject.filter(
          { client_email: user.email }, "-created_date", 1
        );
        const project = Array.isArray(projects) ? projects[0] : null;

        let order = null;
        if (project?.order_id) {
          order = await base44.asServiceRole.entities.Order.get(project.order_id).catch(() => null);
        }
        if (!order) {
          const orders = await base44.asServiceRole.entities.Order.filter(
            { customer_email: user.email }, "-created_date", 1
          ).catch(() => []);
          order = Array.isArray(orders) ? orders[0] : null;
        }

        access = { status: project || order ? "resolved" : "not_found", project, order };
      } catch {
        access = { status: "not_found" };
      }

      if (access?.status !== "resolved") {
        return json({ error: "No portal access found for this account." }, 403);
      }

      finalLeads = await resolveOwnedLeads(base44, access, limit, skip);
    }

    return json({
      success: true,
      leads: finalLeads,
      summary: buildSummary(finalLeads),
      pagination: {
        skip,
        limit,
        returned: finalLeads.length,
        has_more: finalLeads.length === limit,
      },
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[getClientPortalLeads] Error:", err.message);
    return json({ error: err.message }, 500);
  }
});