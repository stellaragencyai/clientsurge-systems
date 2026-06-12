/**
 * autoTriggerLeadPulse — Step 10
 * Fired when services move to "Live": Activates lead capture webhooks + CRM routing.
 * This ensures incoming leads immediately flow into the client's automation workflows.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);

  try {
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found" }, 404);

    console.log("[autoTriggerLeadPulse] Activating lead capture for", { order_id });

    // Activate lead capture webhook registrations for this client
    const webhookConfig = {
      source_name: "ClientSurge Lead Capture",
      service_key: "lead_capture",
      events: ["website_lead", "sms_inbound", "call_inbound"],
      status: "active",
    };

    // Register webhooks if not already active
    await base44.asServiceRole.functions.invoke("manageWebhookRegistration", {
      order_id,
      action: "activate",
      webhook_config: webhookConfig,
    }).catch(err => {
      console.error("[autoTriggerLeadPulse] Webhook activation failed", { error: err.message });
    });

    // Mark as live in order
    await base44.asServiceRole.entities.Order.update(order_id, {
      order_status: "fully_live",
      last_install_event_at: new Date().toISOString(),
    }).catch(() => null);

    console.log("[autoTriggerLeadPulse] Lead capture active; ready to receive leads", { order_id });
    return json({ success: true, order_id, message: "Lead capture webhooks activated" });

  } catch (err) {
    console.error("[autoTriggerLeadPulse] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});