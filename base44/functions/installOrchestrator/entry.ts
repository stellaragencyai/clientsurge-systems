/**
 * installOrchestrator — Unified onboarding & installation workflow.
 * Handles: order creation, service activation, checklist progression, go-live gates.
 * Replaces 8+ broken onboarding-related automations.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Support both direct invocations ({ order_id }) and entity automation payloads
  // ({ event: { entity_id }, data: { id, ... }, changed_fields: [...] })
  const order_id = body.order_id || body.data?.id || body.event?.entity_id;
  if (!order_id) return json({ error: "order_id required" }, 400);

  // If triggered by an entity automation on Order, infer the stage from the
  // current pipeline_status so downstream gates still fire correctly.
  let stage = body.stage;
  if (!stage && body.data?.pipeline_status) {
    stage = body.data.pipeline_status;
  }
  const checklist_id = body.checklist_id;

  const base44 = createClientFromRequest(req);
  const tasks = [];

  try {
    // Load order
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found" }, 404);

    console.log("[installOrchestrator] Processing order", { order_id, pipeline_status: order.pipeline_status });

    // Step 1: Initialize install OS if not exists
    if (!order.client_project_id || stage === "initialize") {
      const projects = await base44.asServiceRole.entities.ClientInstallationOS.filter(
        { order_id }, "-created_date", 1
      ).catch(() => []);
      
      if (!projects?.length) {
        const installOS = await base44.asServiceRole.entities.ClientInstallationOS.create({
          order_id,
          client_email: order.customer_email,
          business_name: order.business_name,
          workflow_stage: "intake_received",
          activation_status: "not_ready",
        }).catch(err => {
          console.error("[installOrchestrator] Install OS creation failed", { error: err.message });
          return null;
        });
        
        if (installOS) {
          await base44.asServiceRole.entities.Order.update(order_id, {
            client_project_id: installOS.id,
          }).catch(() => null);
          tasks.push(`install_os_created: ${installOS.id}`);
        }
      }
    }

    // Step 2: Transition pipeline status
    const validStatuses = ["Paid", "Ready for Install", "Configuring", "Testing", "Live", "Error"];
    if (stage && validStatuses.includes(stage)) {
      await base44.asServiceRole.entities.Order.update(order_id, {
        pipeline_status: stage,
        last_install_event_at: new Date().toISOString(),
      }).catch(() => null);
      tasks.push(`pipeline_status: ${stage}`);
    }

    // Step 3: Mark order status based on items
    if (order.items && Array.isArray(order.items)) {
      const liveItems = order.items.filter(i => i.install_status === "Live").length;
      const totalItems = order.items.length;
      
      let orderStatus = "pending_payment";
      if (order.payment_status === "paid") {
        orderStatus = liveItems === 0 ? "paid_setup_in_progress" : 
                      liveItems < totalItems ? "partially_live" : "fully_live";
      }
      
      await base44.asServiceRole.entities.Order.update(order_id, {
        order_status: orderStatus,
      }).catch(() => null);
      tasks.push(`order_status: ${orderStatus}`);
    }

    // Step 4: Log installation event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "internal",
      direction: "system",
      event_type: "service_status_changed",
      provider: "internal",
      status: "processed",
      subject: `Install orchestrator processed order ${order_id}`,
      message_body: `Order ${order_id} orchestrated. Stage: ${stage || "unchanged"}. Tasks: ${tasks.join(", ")}`,
      metadata_json: JSON.stringify({ order_id, stage, tasks }),
    }).catch(() => null);

    // Step 5: Fire aiBrainInstaller if order is ready for activation
    if (stage === "Ready for Install" || order.pipeline_status === "Ready for Install") {
      base44.asServiceRole.functions.invoke("aiBrainInstaller", { order_id }).catch(err => {
        console.warn("[installOrchestrator] aiBrainInstaller invoke failed (non-blocking)", { error: err.message });
      });
      tasks.push("ai_brain_installer_queued");
    }

    console.log("[installOrchestrator] Complete", { order_id, tasks });
    return json({ success: true, order_id, tasks });

  } catch (err) {
    console.error("[installOrchestrator] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});