/**
 * retryFailedServiceActivation — #436
 * If configureService fails, waits 5 min and retries once.
 * Logs attempt to AgentLog regardless of outcome.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, service_key, first_attempt_error } = await req.json();
    if (!order_id || !service_key) return Response.json({ error: "order_id and service_key required" }, { status: 400 });

    // Wait 5 minutes before retry
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));

    // Retry configureService
    const result = await base44.asServiceRole.functions.invoke("configureService", { order_id, service_key }).catch(e => ({ error: e.message }));
    const success = !result?.error;

    // Log attempt
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "retryFailedServiceActivation", log_type: success ? "info" : "error",
      summary: `Retry ${service_key} for order ${order_id}: ${success ? "SUCCESS" : "FAILED again"}`,
      details: JSON.stringify({ first_attempt_error, retry_result: result }),
      service: "install_pipeline", requires_nolan: !success, resolved: success,
    }).catch(() => {});

    if (!success) {
      // Alert Nolan
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "-1003533494424",
            text: `@trinity\n\n🚨 <b>Service Activation Failed (retry)</b>\nOrder: ${order_id}\nService: ${service_key}\nError: ${result?.error}\nManual intervention needed.`,
            parse_mode: "HTML",
          }),
        }).catch(() => {});
      }
    }

    return Response.json({ success, order_id, service_key, retried: true, result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
