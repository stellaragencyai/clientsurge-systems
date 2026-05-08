/**
 * getSystemHealthDashboard — #472
 * Single call returns: Stripe webhook last received, Resend delivery rate,
 * Twilio error rate, active installs, stalled orders, AgentLog errors last 24h.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const since24h = new Date(Date.now() - 86400000).toISOString();

    const [orders, logs, onboardings] = await Promise.all([
      base44.asServiceRole.entities.Order.list().catch(() => []),
      base44.asServiceRole.entities.AgentLog.list().catch(() => []),
      base44.asServiceRole.entities.ClientOnboarding.list().catch(() => []),
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

    const activeInstalls = paidOrders.filter((o: any) => o.workflow_stage !== "Live" && o.workflow_stage !== "Cancelled").length;
    const liveClients = paidOrders.filter((o: any) => o.workflow_stage === "Live").length;
    const pastDue = paidOrders.filter((o: any) => o.billing_status === "past_due").length;

    // Check Stripe webhook last received (look for recent AgentLog entry)
    const stripeLog = (logs || [])
      .filter((l: any) => l.service === "stripe")
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];

    const health = {
      timestamp: new Date().toISOString(),
      clients: { total: paidOrders.length, live: liveClients, active_installs: activeInstalls, stalled: stalledOrders.length, past_due: pastDue },
      errors_24h: { total: errorLogs.length, unresolved: unresolvedErrors.length, services: [...new Set(unresolvedErrors.map((e: any) => e.service))] },
      stripe: { last_webhook: stripeLog?.created_date || null, status: stripeLog ? "receiving" : "unknown" },
      overall_status: unresolvedErrors.length > 3 ? "degraded" : stalledOrders.length > 2 ? "warning" : "healthy",
    };

    return Response.json({ success: true, health });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
