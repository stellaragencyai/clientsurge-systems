/**
 * installPipelineExecutor.ts — #415a #415b #415c
 * Sequential execution with individual try/catch per service.
 * Tracks partial success, calls sendGoLiveNotification on full completion.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getServicesForTier } from "../shared/tierServiceMap.ts";

export async function executeInstallPipeline(base44: any, order_id: string, package_key: string) {
  const services = getServicesForTier(package_key);
  // #415b: track partial success
  const activation_log: { service_key: string; status: string; error?: string; configured_at?: string }[] = [];

  // #415a: sequential execution with individual try/catch
  for (const service_key of services) {
    try {
      await base44.asServiceRole.functions.invoke("configureService", { order_id, service_key });
      activation_log.push({ service_key, status: "configured", configured_at: new Date().toISOString() });
      // Write progress after each service
      await base44.asServiceRole.entities.Order.update(order_id, { activation_log });
    } catch (err: any) {
      activation_log.push({ service_key, status: "error", error: err.message });
      await base44.asServiceRole.entities.Order.update(order_id, { activation_log });
      // Trigger retry asynchronously (fire and forget)
      base44.asServiceRole.functions.invoke("retryFailedServiceActivation", {
        order_id, service_key, first_attempt_error: err.message,
      }).catch(() => {});
    }
  }

  const allConfigured = activation_log.every(s => s.status === "configured");

  // #415c: on full completion, call sendGoLiveNotification
  if (allConfigured) {
    await base44.asServiceRole.functions.invoke("sendGoLiveNotification", { order_id }).catch(() => {});
  } else {
    // Partial success — alert Nolan
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const errored = activation_log.filter(s => s.status === "error").map(s => s.service_key);
    if (botToken && errored.length > 0) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "-1003533494424",
          text: `@trinity\n\n⚠️ <b>Partial Install</b>\nOrder: ${order_id}\nFailed: ${errored.join(", ")}\nRetries scheduled.`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }
  }

  return { activation_log, all_configured: allConfigured };
}
