import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── inlined helpers (no local imports — Deno deploys each function independently) ──

function secureJson(data: Record<string, unknown> = {}, options: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status: options.status || 200,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY", "Cache-Control": "no-store" },
  });
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string): string {
  return cleanString(value).toLowerCase();
}

function sortByCreatedDateDesc(a: any, b: any): number {
  return new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime();
}

function dedupeById(records: any[] = []): any[] {
  const seen = new Set();
  return records.filter((record) => {
    if (!record?.id || seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

async function safeFilter(collection: any, query: any, sort = "-created_date", limit = 25): Promise<any[]> {
  try {
    const results = await collection.filter(query, sort, limit);
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

async function safeGet(collection: any, id: string): Promise<any | null> {
  if (!id) return null;
  try {
    return await collection.get(id);
  } catch {
    return null;
  }
}

async function resolveClientPortalAccess(base44: any, userEmail: string) {
  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!normalizedUserEmail) {
    return { status: "not_found", code: "portal_user_email_missing" };
  }

  const [clientsByEmail, paidOrdersByEmail, projectsByEmail] = await Promise.all([
    safeFilter(base44.asServiceRole.entities.Client, { email: normalizedUserEmail }, "-created_date", 25),
    safeFilter(base44.asServiceRole.entities.Order, { customer_email: normalizedUserEmail }, "-created_date", 50),
    safeFilter(base44.asServiceRole.entities.ClientProject, { client_email: normalizedUserEmail }, "-created_date", 25),
  ]);

  const exactClients = dedupeById(
    clientsByEmail.filter((c: any) => normalizeEmail(c.email) === normalizedUserEmail)
  ).sort(sortByCreatedDateDesc);
  const uniqueClient = exactClients.length === 1 ? exactClients[0] : null;

  const linkedPaidOrders = paidOrdersByEmail
    .filter((o: any) => normalizeEmail(o.customer_email) === normalizedUserEmail)
    .filter((o: any) => o.payment_status === "paid" && o.client_project_id)
    .sort(sortByCreatedDateDesc);

  const linkedOrderCandidates: any[] = [];
  for (const order of linkedPaidOrders) {
    const project = await safeGet(base44.asServiceRole.entities.ClientProject, order.client_project_id);
    if (!project) continue;
    const linkedClient =
      (order.client_id && await safeGet(base44.asServiceRole.entities.Client, order.client_id)) || uniqueClient;
    linkedOrderCandidates.push({ order, project, client: linkedClient || null });
  }

  const uniqueLinkedProjects = dedupeById(linkedOrderCandidates.map((c) => c.project));
  if (uniqueLinkedProjects.length > 1) {
    return { status: "ambiguous", code: "portal_project_ambiguous", resolution_type: "linked_paid_order_conflict" };
  }

  if (linkedOrderCandidates.length === 1) {
    return {
      status: "resolved",
      resolution_type: "linked_paid_order",
      project: linkedOrderCandidates[0].project,
      client: linkedOrderCandidates[0].client,
      order: linkedOrderCandidates[0].order,
    };
  }

  if (uniqueClient) {
    const projectsByClientId = dedupeById(
      await safeFilter(base44.asServiceRole.entities.ClientProject, { client_id: uniqueClient.id }, "-created_date", 25)
    ).sort(sortByCreatedDateDesc);

    if (projectsByClientId.length > 1) {
      return { status: "ambiguous", code: "portal_project_ambiguous", resolution_type: "client_link_conflict" };
    }
    if (projectsByClientId.length === 1) {
      return { status: "resolved", resolution_type: "client_id_link", project: projectsByClientId[0], client: uniqueClient, order: null };
    }
  }

  const exactEmailProjects = dedupeById(
    projectsByEmail.filter((p: any) => normalizeEmail(p.client_email) === normalizedUserEmail)
  ).sort(sortByCreatedDateDesc);

  if (exactEmailProjects.length > 1) {
    return { status: "ambiguous", code: "portal_project_ambiguous", resolution_type: "legacy_email_conflict" };
  }
  if (exactEmailProjects.length === 1) {
    return { status: "resolved", resolution_type: "legacy_email_match", project: exactEmailProjects[0], client: uniqueClient, order: null };
  }

  return { status: "not_found", code: "portal_project_not_found" };
}

// ── main handler ──

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      project_id,
      business_name,
      industry,
      phone,
      website,
      brand_voice,
      business_hours,
      booking_link,
      calendar_system,
      requires_consultation,
      response_speed,
      customer_questions,
      twilio_number,
      sms_template,
      missed_call_sms_template,
      resend_from_email,
      lead_notification_email,
      email_confirmation_template,
    } = body;

    const access = await resolveClientPortalAccess(base44, user.email);

    if (access.status !== "resolved" || !access.project?.id) {
      return secureJson({ error: "Forbidden — no client project found for your account" }, { status: 403 });
    }

    if (project_id && project_id !== access.project.id) {
      return secureJson({ error: "Forbidden — project mismatch" }, { status: 403 });
    }

    const updates: Record<string, unknown> = { quick_start_completed: true };

    if (business_name !== undefined) updates.business_name = business_name || "";
    if (industry !== undefined) updates.industry = industry || "";
    if (phone !== undefined) updates.phone = phone || "";
    if (website !== undefined) updates.website = website || "";
    if (brand_voice !== undefined) updates.brand_voice = brand_voice || "";
    if (business_hours !== undefined) updates.business_hours = business_hours || "";
    if (booking_link !== undefined) updates.booking_link = booking_link || "";
    if (calendar_system !== undefined) updates.calendar_system = calendar_system || "";
    if (requires_consultation !== undefined) updates.requires_consultation = requires_consultation || "";
    if (response_speed !== undefined) updates.response_speed = response_speed || "";
    if (customer_questions !== undefined) updates.customer_questions = customer_questions || "";
    if (twilio_number !== undefined) updates.twilio_number = twilio_number || "";
    if (sms_template !== undefined) updates.sms_template = sms_template || "";
    if (missed_call_sms_template !== undefined) updates.missed_call_sms_template = missed_call_sms_template || "";
    if (resend_from_email !== undefined) updates.resend_from_email = resend_from_email || "";
    if (lead_notification_email !== undefined) updates.lead_notification_email = lead_notification_email || "";
    if (email_confirmation_template !== undefined) updates.email_confirmation_template = email_confirmation_template || "";

    const updatedProject = await base44.asServiceRole.entities.ClientProject.update(access.project.id, updates);

    console.log(`[saveQuickStartConfig] Quick start config saved for project ${access.project.id} by ${user.email}`);
    return secureJson({ success: true, project: updatedProject });
  } catch (error) {
    console.error("[saveQuickStartConfig] error:", error);
    return secureJson({ error: error.message || "Failed to save configuration" }, { status: 500 });
  }
});