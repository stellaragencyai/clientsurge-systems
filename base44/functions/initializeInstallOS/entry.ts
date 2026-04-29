import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * Initialize ClientInstallationOS for a new order
 * Called via webhook after successful payment
 * Idempotent: safe to call multiple times for same order
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    // Get order details
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // ─────────────────────────────────────
    // IDEMPOTENCY CHECK: prevent duplicate creation
    // ─────────────────────────────────────
    const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
      { order_id },
      "-created_date",
      1
    );

    if (existing?.length > 0) {
      console.log(`[Install OS] Already initialized for order ${order_id}, skipping`);
      return Response.json({
        success: true,
        install_os_id: existing[0].id,
        already_initialized: true,
        checklist_ids: existing[0].all_automations_checklists || [],
      });
    }

    console.log(`[Install OS] Initializing Client Installation OS for order ${order_id}`);

    // Create ClientInstallationOS
    const installOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
      order_id,
      client_email: order.customer_email,
      business_name: order.business_name,
      client_id: order.client_id,
      workflow_stage: "intake_received",
      website_status: "not_started",
      activation_eligible: false,
      activation_status: "not_ready",
    });

    // Create AutomationChecklist for each service
    const allChecklistIds = [];
    for (const item of order.items || []) {
      const checklist = await base44.asServiceRole.entities.AutomationChecklist.create({
        client_email: order.customer_email,
        client_name: order.customer_name,
        business_name: order.business_name,
        order_id,
        service_key: item.service_key,
        status: "not_started",
      });
      allChecklistIds.push(checklist.id);
    }

    // Update installOS with checklist IDs
    await base44.asServiceRole.entities.ClientInstallationOS.update(installOS.id, {
      all_automations_checklists: allChecklistIds,
    });

    console.log(`[Install OS] Created successfully for order ${order_id} with ${allChecklistIds.length} automation checklists`);

    return Response.json({
      success: true,
      install_os_id: installOS.id,
      checklist_ids: allChecklistIds,
    });
  } catch (error) {
    console.error("[Install OS] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});