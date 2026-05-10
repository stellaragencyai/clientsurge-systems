/**
 * detectAnalyticsAnomalies — #460
 * Daily check: flag lead volume drops >30% WoW, churn spikes, stalled installs.
 * High-severity → Telegram alert to Nolan.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

interface Anomaly {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  metric_value?: number | string;
  threshold?: number | string;
  affected_clients?: string[];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - (now.getDay() + 7) * 86400000).toISOString();
    const lastWeekStart = new Date(now.getTime() - (now.getDay() + 14) * 86400000).toISOString();
    const lastWeekEnd = new Date(now.getTime() - (now.getDay() + 7) * 86400000).toISOString();
    const anomalies: Anomaly[] = [];

    // Fetch all leads created this week vs last week
    const [thisWeekLeads, lastWeekLeads, orders, allLeads] = await Promise.all([
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
      base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []),
      base44.asServiceRole.entities.SpaLead.list().catch(() => []),
    ]);

    const thisWeekCount = (thisWeekLeads || []).filter((l: any) => l.created_date >= thisWeekStart).length;
    const lastWeekCount = (lastWeekLeads || []).filter((l: any) => l.created_date >= lastWeekStart && l.created_date < lastWeekEnd).length;

    // #460a: Lead volume drop >30% WoW
    if (lastWeekCount > 0) {
      const drop = ((lastWeekCount - thisWeekCount) / lastWeekCount) * 100;
      if (drop > 30) {
        anomalies.push({
          type: "lead_volume_drop",
          severity: drop > 50 ? "high" : "medium",
          description: `Lead volume dropped ${Math.round(drop)}% WoW (${thisWeekCount} leads this week vs ${lastWeekCount} last week)`,
          metric_value: thisWeekCount,
          threshold: lastWeekCount,
        });
      }
    }

    // #460b: Churn risk spike
    const highChurnOrders = (orders || []).filter((o: any) => o.churn_risk_score > 70);
    if (highChurnOrders.length > 3) {
      anomalies.push({
        type: "churn_spike",
        severity: highChurnOrders.length > 5 ? "high" : "medium",
        description: \`\${highChurnOrders.length} clients now at high churn risk (score > 70)\`,
        metric_value: highChurnOrders.length,
        threshold: 3,
        affected_clients: highChurnOrders.map((o: any) => o.client_name),
      });
    }

    // #460c: Stalled installs (paid >5 days, still in Configuring)
    const stalledInstalls = (orders || []).filter((o: any) => {
      if (o.workflow_stage !== "Configuring") return false;
      const daysSincePaid = o.payment_date ? (now.getTime() - new Date(o.payment_date).getTime()) / 86400000 : 999;
      return daysSincePaid > 5;
    });
    if (stalledInstalls.length > 2) {
      anomalies.push({
        type: "stalled_installs",
        severity: stalledInstalls.length > 4 ? "high" : "medium",
        description: \`\${stalledInstalls.length} orders stalled in Configuring stage for >5 days\`,
        metric_value: stalledInstalls.length,
        threshold: 2,
        affected_clients: stalledInstalls.map((o: any) => o.client_name),
      });
    }

    // Log anomalies to AgentLog
    if (anomalies.length > 0) {
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "detectAnalyticsAnomalies",
        log_type: anomalies.some(a => a.severity === "high") ? "warning" : "info",
        summary: \`\${anomalies.length} anomalies detected\`,
        details: JSON.stringify(anomalies),
        service: "analytics",
        requires_nolan: anomalies.some(a => a.severity === "high"),
        resolved: false,
      }).catch(() => {});

      // #460: High-severity → Telegram alert
      const highSeverity = anomalies.filter(a => a.severity === "high");
      if (highSeverity.length > 0) {
        const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
        if (botToken) {
          const lines = highSeverity.map(a => \`• <b>\${a.type.replace(/_/g, " ")}</b>: \${a.description}\`).join("\n");
          await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: "-1003533494424",
              text: \`@trinity\n\n🚨 <b>Analytics Anomalies Detected</b>\n\${lines}\n\nCheck AgentLog for details.\`,
              parse_mode: "HTML",
            }),
          }).catch(() => {});
        }
      }
    }

    return Response.json({
      success: true,
      anomalies_found: anomalies.length,
      high_severity: anomalies.filter(a => a.severity === "high").length,
      anomalies,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
