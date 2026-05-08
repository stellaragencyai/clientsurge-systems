/**
 * detectAnalyticsAnomalies — #460
 * Auto-flags: lead volume drop >30% WoW, churn risk spike, stalled installs.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = Date.now();
    const week1Start = new Date(now - 14 * 86400000).toISOString();
    const week2Start = new Date(now - 7 * 86400000).toISOString();
    const todayStart = new Date(now - 86400000).toISOString();

    const [leads, orders] = await Promise.all([
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
      base44.asServiceRole.entities.Order.list().catch(() => []),
    ]);

    const prevWeekLeads = (leads || []).filter((l: any) => l.created_date >= week1Start && l.created_date < week2Start).length;
    const thisWeekLeads = (leads || []).filter((l: any) => l.created_date >= week2Start).length;
    const leadDropPct = prevWeekLeads > 0 ? ((prevWeekLeads - thisWeekLeads) / prevWeekLeads) * 100 : 0;

    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const highChurn = paidOrders.filter((o: any) => (o.churn_risk_score || 0) > 70).length;
    const stalledInstalls = paidOrders.filter((o: any) => {
      if (!o.updated_date || o.workflow_stage === "Live") return false;
      return (Date.now() - new Date(o.updated_date).getTime()) / 3600000 > 48;
    }).length;

    const flags: any[] = [];
    if (leadDropPct > 30) flags.push({ type: "lead_volume_drop", severity: "high", detail: `Lead volume dropped ${leadDropPct.toFixed(0)}% WoW (${thisWeekLeads} vs ${prevWeekLeads})` });
    if (highChurn > 1) flags.push({ type: "churn_risk_spike", severity: "medium", detail: `${highChurn} active clients with churn risk > 70` });
    if (stalledInstalls > 2) flags.push({ type: "stalled_installs", severity: "high", detail: `${stalledInstalls} installs stalled > 48h without progress` });

    // Alert Nolan via Telegram if high severity
    const highFlags = flags.filter(f => f.severity === "high");
    if (highFlags.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const lines = highFlags.map(f => `• ${f.detail}`).join("
");
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: "-1003533494424",
            text: `@trinity

🚨 <b>Analytics Anomalies Detected</b>
${lines}`,
            parse_mode: "HTML" }),
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, anomalies: flags, metrics: { thisWeekLeads, prevWeekLeads, highChurn, stalledInstalls } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
