import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONFIRMATION_TEXT = "REPAIR BROKEN FLOW";
const DUPLICATE_GUARD_MS = 5 * 60 * 1000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Request-ID": data?.request_id || "" },
  });
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function safeStringify(value) {
  try { return JSON.stringify(value ?? null); } catch { return "null"; }
}

function parseTime(value) {
  const ms = Date.parse(value || "");
  return Number.isFinite(ms) ? ms : 0;
}

function duplicateRepair(order, action) {
  const handoff = order?.purchase_onboarding_handoff || {};
  const sameAction = handoff.last_repair_action === action;
  const lastAt = parseTime(handoff.last_repair_at);
  if (!sameAction || !lastAt) return null;
  const ageMs = Date.now() - lastAt;
  if (ageMs >= DUPLICATE_GUARD_MS) return null;
  return {
    action,
    last_request_id: handoff.last_repair_request_id || null,
    retry_after_seconds: Math.max(1, Math.ceil((DUPLICATE_GUARD_MS - ageMs) / 1000)),
  };
}

async function ensureInstallationOS(base44, order, requestId, actorEmail) {
  const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter({ order_id: order.id }, "-created_date", 1).catch(() => []);
  const payload = {
    order_id: order.id,
    client_id: order.client_id || "",
    client_project_id: order.client_project_id || "",
    client_email: order.customer_email,
    business_name: order.install_configuration?.brand?.business_name || order.business_name || order.customer_email,
    workflow_stage: "website_building",
    website_status: "not_started",
    activation_status: "not_ready",
    activation_eligible: false,
    checklist_completion_percent: order.install_configuration ? 10 : 0,
    admin_notes: `Repaired by ${actorEmail || "admin"}. request_id=${requestId}`,
    last_readiness_check_at: new Date().toISOString(),
    environment: order.environment || "production",
    dashboard_truth_status: order.install_configuration ? "warning" : "blocked",
    dashboard_truth_notes: order.install_configuration ? "Repair created install OS; proof pending." : "Repair created install OS but credentials are still missing.",
  };

  if (existing?.length > 0) {
    await base44.asServiceRole.entities.ClientInstallationOS.update(existing[0].id, payload);
    return { id: existing[0].id, created: false };
  }
  const created = await base44.asServiceRole.entities.ClientInstallationOS.create(payload);
  return { id: created?.id || null, created: true };
}

async function audit(base44, actorEmail, action, order, before, after, requestId) {
  await base44.asServiceRole.entities.AuditLog.create({
    admin_email: actorEmail || "system@clientsurgesystems.com",
    action,
    entity_name: "Order",
    record_id: order.id,
    before: safeStringify(before),
    after: safeStringify({ ...after, request_id: requestId }),
    timestamp: new Date().toISOString(),
    notes: "Broken Flow repair action executed from admin diagnostics.",
  }).catch((e) => console.warn(`[repairBrokenFlow] AuditLog failed: ${e.message}`));
}

Deno.serve(async (req) => {
  const requestId = `repair_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!isAdmin(user)) return json({ error: "Admin only", code: "admin_only", request_id: requestId }, 403);

    const body = await req.json().catch(() => ({}));
    const orderId = String(body.order_id || "").trim();
    const action = String(body.action || "").trim();
    const confirmation = String(body.confirmation || "").trim();
    const force = body.force === true;

    if (!orderId) return json({ error: "order_id required", code: "order_id_required", request_id: requestId }, 400);
    if (!action) return json({ error: "action required", code: "action_required", request_id: requestId }, 400);
    if (confirmation !== CONFIRMATION_TEXT) {
      return json({
        error: "Explicit confirmation required",
        code: "confirmation_required",
        confirmation_text: CONFIRMATION_TEXT,
        request_id: requestId,
      }, 400);
    }

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order) return json({ error: "Order not found", code: "order_not_found", request_id: requestId }, 404);

    const duplicate = duplicateRepair(order, action);
    if (duplicate && !force) {
      return json({
        error: "This repair action was executed recently",
        code: "duplicate_repair_guard",
        request_id: requestId,
        duplicate,
      }, 409);
    }

    if (action === "create_install_os" || action === "rerun_setup_handoff") {
      const before = { pipeline_status: order.pipeline_status, order_status: order.order_status, purchase_onboarding_handoff: order.purchase_onboarding_handoff || null };
      const installOs = await ensureInstallationOS(base44, order, requestId, user?.email);
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Order.update(orderId, {
        pipeline_status: order.pipeline_status === "Live" ? order.pipeline_status : "Ready for Install",
        order_status: order.order_status === "fully_live" ? order.order_status : "paid_setup_in_progress",
        last_install_event_at: now,
        purchase_onboarding_handoff: {
          ...(order.purchase_onboarding_handoff || {}),
          last_repair_action: action,
          last_repair_request_id: requestId,
          last_repair_at: now,
          last_repair_by: user?.email || "admin",
        },
      });
      await audit(base44, user?.email, `repair_${action}`, { ...order, id: orderId }, before, { installation_os_id: installOs.id, installation_os_created: installOs.created, forced: force }, requestId);
      return json({ success: true, request_id: requestId, action, installation_os_id: installOs.id, installation_os_created: installOs.created, forced: force });
    }

    if (action === "mark_draft_abandoned") {
      const handoff = order.purchase_onboarding_handoff || {};
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Order.update(orderId, {
        purchase_onboarding_handoff: {
          ...handoff,
          credentials_draft_abandoned_at: now,
          credentials_draft_abandoned_by: user?.email || "admin",
          credentials_draft: null,
          last_repair_action: action,
          last_repair_request_id: requestId,
          last_repair_at: now,
          last_repair_by: user?.email || "admin",
        },
      });
      await audit(base44, user?.email, "repair_mark_draft_abandoned", { ...order, id: orderId }, { credentials_draft_present: Boolean(handoff.credentials_draft) }, { credentials_draft_present: false, forced: force }, requestId);
      return json({ success: true, request_id: requestId, action, forced: force });
    }

    if (action === "recheck_authorization") {
      const authRows = await base44.asServiceRole.entities.SetupAuthorization.filter({ order_id: orderId, authorization_status: "accepted" }, "-created_date", 1).catch(() => []);
      await audit(base44, user?.email, "repair_recheck_authorization", { ...order, id: orderId }, {}, { authorized: authRows?.length > 0, authorization_id: authRows?.[0]?.id || null, forced: force }, requestId);
      return json({ success: true, request_id: requestId, action, authorized: authRows?.length > 0, authorization_id: authRows?.[0]?.id || null, forced: force });
    }

    return json({ error: `Unsupported repair action: ${action}`, code: "unsupported_action", request_id: requestId }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[repairBrokenFlow] Error: ${message}; request_id=${requestId}`);
    return json({ error: message, code: "repair_failed", request_id: requestId }, 500);
  }
});