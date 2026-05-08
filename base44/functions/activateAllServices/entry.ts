/**
 * activateAllServices — #445 CRITICAL
 * Orchestrates configureService × N services by tier.
 * Single entry point called post-payment.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getServicesForTier } from "../shared/tierServiceMap.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const package_key = order.package_key || "starter";
    const services = getServicesForTier(package_key);

    // Mark installing
    await base44.asServiceRole.entities.Order.update(order_id, { workflow_stage: "Installing" });

    const activation_log: any[] = [];
    let allOk = true;

    for (const service_key of services) {
      try {
        await base44.asServiceRole.functions.invoke("configureService", { order_id, service_key });
        activation_log.push({ service_key, status: "configured", configured_at: new Date().toISOString() });
      } catch (err: any) {
        allOk = false;
        activation_log.push({ service_key, status: "error", error: err.message, failed_at: new Date().toISOString() });
        // Queue retry
        base44.asServiceRole.functions.invoke("retryFailedServiceActivation", {
          order_id, service_key, first_attempt_error: err.message,
        }).catch(() => {});
      }
      // Write progress after each
      await base44.asServiceRole.entities.Order.update(order_id, { activation_log }).catch(() => {});
    }

    if (allOk) {
      await base44.asServiceRole.functions.invoke("sendGoLiveNotification", { order_id }).catch(() => {});
    } else {
      const failed = activation_log.filter(s => s.status === "error").map(s => s.service_key);
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: "-1003533494424",
            text: `@trinity

⚠️ <b>Partial Activation</b>
Order: ${order_id}
Failed: ${failed.join(", ")}
Retries queued.`,
            parse_mode: "HTML" }),
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, activation_log, all_configured: allOk, service_count: services.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
