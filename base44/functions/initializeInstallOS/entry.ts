import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

/**
 * Initialize ClientInstallationOS for a new order
 * Called when order is first created or when admin manually initializes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    // Get order details
    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

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

    console.log(`[Install OS] Initialized for order ${order_id} with ${allChecklistIds.length} automations`);

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