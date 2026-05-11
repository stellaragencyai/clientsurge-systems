/**
 * detectAnalyticsAnomalies — #460
 * Daily anomaly detection:
 * - Lead volume drops >30% WoW
 * - Churn risk spikes (>3 clients scored >70)
 * - Stalled installs (workflow_stage unchanged for 5+ days)
 * Sends Telegram alert to Nolan if high-severity anomalies found.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

interface Anomaly {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metric?: any;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const anomalies: Anomaly[] = [];

    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - (now.getDay() || 7) * 86400000).toISOString();
    const lastWeekStart = new Date(now.getTime() - ((now.getDay() || 7) + 7) * 86400000).toISOString();
    const lastWeekEnd = thisWeekStart;

    // 1. Lead volume drop detection
    const [thisWeekLeads, lastWeekLeads] = await Promise.all([
      base44.asServiceRole.entities.SpaLead.filter({ created_date: { gte: thisWeekStart } }).catch(() => []),
      base44.asServiceRole.entities.SpaLead.filter({
        created_date: { gte: lastWeekStart, lte: lastWeekEnd },
      }).catch(() => []),
    ]);

    const thisWeekCount = (thisWeekLeads || []).length;
    const lastWeekCount = (lastWeekLeads || []).length;
    const drop = lastWeekCount > 0 ? ((lastWeekCount - thisWeekCount) / lastWeekCount) * 100 : 0;

    if (drop > 30) {
      anomalies.push({
        type: "lead_volume_drop",
        severity: drop > 50 ? "critical" : "high",
        message: `Lead volume dropped ${drop.toFixed(1)}% WoW (last week: ${lastWeekCount}, this week: ${thisWeekCount})`,
        metric: { drop, last_week: lastWeekCount, this_week: thisWeekCount },
      });
    }

    // 2. Churn risk spike
    const orders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []);
    const highChurnRisk = (orders || []).filter((o: any) => o.churn_risk_score && Number(o.churn_risk_score) > 70);

    if (highChurnRisk.length > 3) {
      anomalies.push({
        type: "churn_spike",
        severity: highChurnRisk.length > 5 ? "critical" : "high",
        message: `${highChurnRisk.length} clients at high churn risk (score >70)`,
        metric: { at_risk: highChurnRisk.length, names: highChurnRisk.slice(0, 3).map((o: any) => o.client_name) },
      });
    }

    // 3. Stalled install detection
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    const stalledInstalls = (orders || []).filter((o: any) => {
      const updated = o.updated_date || o.created_date;
      return updated < fiveDaysAgo && o.workflow_stage !== "Live";
    });

    if (stalledInstalls.length > 0) {
      anomalies.push({
        type: "stalled_installs",
        severity: stalledInstalls.length > 3 ? "high" : "medium",
        message: `${stalledInstalls.length} orders stalled for 5+ days`,
        metric: { stalled: stalledInstalls.length, oldest: stalledInstalls[0]?.id },
      });
    }

    // Log all anomalies
    for (const anomaly of anomalies) {
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "detectAnalyticsAnomalies",
        log_type: anomaly.severity === "critical" ? "error" : "warning",
        summary: anomaly.message,
        details: JSON.stringify(anomaly),
        service: "analytics",
        requires_nolan: anomaly.severity === "critical" || anomaly.severity === "high",
        resolved: false,
      }).catch(() => {});
    }

    // Alert Nolan if high/critical anomalies
    const highSeverity = anomalies.filter(a => a.severity === "high" || a.severity === "critical");
    if (highSeverity.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const lines = highSeverity.map(a => `• <b>${a.type.replace(/_/g, " ")}</b> (${a.severity}): ${a.message}`).join("\n");
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "-1003533494424",
            text: `@trinity\n\n🚨 <b>Analytics Anomalies Detected</b>\n${lines}\n\nCheck AgentLog for details.`,
            parse_mode: "HTML",
          }),
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      anomalies_found: anomalies.length,
      high_severity: highSeverity.length,
      anomalies,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
