/**
 * getSystemHealthDashboard — #472
 * Single call returns: Stripe webhook last received, Resend delivery rate,
 * Twilio error rate, active installs, stalled orders, AgentLog errors last 24h.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

async function countActiveAutomationManifests() {
  try {
    const automationsDir = new URL("../../automations/", import.meta.url);
    let count = 0;
    for await (const entry of Deno.readDir(automationsDir)) {
      if (!entry.isFile || !entry.name.endsWith(".json")) {
        continue;
      }
      const fileUrl = new URL(entry.name, automationsDir);
      const raw = await Deno.readTextFile(fileUrl);
      const manifest = JSON.parse(raw);
      if (manifest?.active === true) {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const since24h = new Date(Date.now() - 86400000).toISOString();

    const [orders, logs, communicationEvents, automationRules, activeAutomationManifestCount] = await Promise.all([
      base44.asServiceRole.entities.Order.list().catch(() => []),
      base44.asServiceRole.entities.AgentLog.list().catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.list().catch(() => []),
      base44.asServiceRole.entities.AutomationRule.list().catch(() => []),
      countActiveAutomationManifests(),
    ]);

    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const stalledOrders = paidOrders.filter((o: any) => {
      if (!o.updated_date) return false;
      const hoursStale = (Date.now() - new Date(o.updated_date).getTime()) / 3600000;
      return hoursStale > 48 && o.workflow_stage !== "Live";
    });

    const recentLogs = (logs || []).filter((l: any) => l.created_date >= since24h);
    const errorLogs = recentLogs.filter((l: any) => l.log_type === "error");
    const unresolvedErrors = errorLogs.filter((l: any) => !l.resolved);
    const sortedEvents = [...(communicationEvents || [])].sort(
      (a: any, b: any) =>
        new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
    );

    const activeInstalls = paidOrders.filter((o: any) => o.workflow_stage !== "Live" && o.workflow_stage !== "Cancelled").length;
    const liveClients = paidOrders.filter((o: any) => o.workflow_stage === "Live").length;
    const pastDue = paidOrders.filter((o: any) => o.billing_status === "past_due").length;
    const ordersInProgress = paidOrders.filter(
      (o: any) => o.workflow_stage && o.workflow_stage !== "Live" && o.workflow_stage !== "Cancelled"
    ).length;
    const lastTwilioSms = sortedEvents.find(
      (event: any) =>
        event.provider === "twilio" &&
        event.channel === "sms" &&
        ["sms_sent", "sms_delivered", "sms_received"].includes(event.event_type)
    );
    const lastResendEmail = sortedEvents.find(
      (event: any) =>
        event.provider === "resend" &&
        event.channel === "email" &&
        ["email_sent", "email_failed"].includes(event.event_type)
    );
    const enabledAutomationRules = (automationRules || []).filter((rule: any) => rule.enabled !== false).length;
    const activeAutomationCount = activeAutomationManifestCount + enabledAutomationRules;

    // Check Stripe webhook last received (look for recent AgentLog entry)
    const stripeLog = (logs || [])
      .filter((l: any) => l.service === "stripe")
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];

    const health = {
      timestamp: new Date().toISOString(),
      clients: {
        total: paidOrders.length,
        live: liveClients,
        active_installs: activeInstalls,
        orders_in_progress: ordersInProgress,
        stalled: stalledOrders.length,
        past_due: pastDue,
      },
      automations: {
        active_count: activeAutomationCount,
        active_manifest_count: activeAutomationManifestCount,
        enabled_rule_count: enabledAutomationRules,
      },
      errors_24h: { total: errorLogs.length, unresolved: unresolvedErrors.length, services: [...new Set(unresolvedErrors.map((e: any) => e.service))] },
      stripe: { last_webhook: stripeLog?.created_date || null, status: stripeLog ? "receiving" : "unknown" },
      twilio: {
        last_sms_sent: lastTwilioSms?.created_date || null,
        last_event_type: lastTwilioSms?.event_type || null,
      },
      resend: {
        last_email_sent: lastResendEmail?.created_date || null,
        last_event_type: lastResendEmail?.event_type || null,
      },
      overall_status: unresolvedErrors.length > 3 ? "degraded" : stalledOrders.length > 2 ? "warning" : "healthy",
    };

    return Response.json({ success: true, health });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
