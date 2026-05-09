/**
 * detectAnalyticsAnomalies — #460
 * Runs daily. Flags lead volume drops > 30% WoW, churn risk spikes, stalled installs.
 * HIGH severity → Telegram alert to Nolan.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

interface Anomaly {
  type: string;
  severity: "low" | "mid" | "high";
  message: string;
  affected_count?: number;
  metric?: string;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekIso = thisWeekStart.toISOString();
    const lastWeekIso = lastWeekStart.toISOString();

    const [thisWeekLeads, lastWeekLeads, orders, installs] = await Promise.all([
      base44.asServiceRole.entities.SpaLead.filter({}).catch(() => []),
      base44.asServiceRole.entities.SpaLead.filter({}).catch(() => []),
      base44.asServiceRole.entities.Order.filter({}).catch(() => []),
      base44.asServiceRole.entities.ClientOnboarding.filter({}).catch(() => []),
    ]);

    const anomalies: Anomaly[] = [];

    // Filter by date
    const thisWeek = (thisWeekLeads || []).filter((l: any) => l.created_date >= thisWeekIso);
    const lastWeek = (lastWeekLeads || []).filter((l: any) => l.created_date >= lastWeekIso && l.created_date < thisWeekIso);

    // ── Lead volume drop > 30% WoW
    const thisWeekCount = thisWeek.length;
    const lastWeekCount = lastWeek.length;
    if (lastWeekCount > 0) {
      const dropPct = ((lastWeekCount - thisWeekCount) / lastWeekCount) * 100;
      if (dropPct > 30) {
        anomalies.push({
          type: "lead_volume_drop",
          severity: dropPct > 50 ? "high" : "mid",
          message: `Lead volume down ${Math.round(dropPct)}% WoW (${lastWeekCount} → ${thisWeekCount})`,
          affected_count: thisWeekCount,
          metric: "lead_count",
        });
      }
    }

    // ── Churn risk: orders with billing_status = past_due
    const pastDue = (orders || []).filter((o: any) => o.billing_status === "past_due" || o.churn_risk_score > 75);
    if (pastDue.length > 2) {
      anomalies.push({
        type: "churn_risk_spike",
        severity: pastDue.length > 5 ? "high" : "mid",
        message: `${pastDue.length} orders at high churn risk (billing past-due or score > 75)`,
        affected_count: pastDue.length,
      });
    }

    // ── Stalled installs: workflow_stage = "Configuring" for > 3 days
    const stalledInstalls = (installs || []).filter((i: any) => {
      if (i.workflow_stage !== "Configuring") return false;
      const createdDate = new Date(i.created_date);
      const daysSince = (Date.now() - createdDate.getTime()) / 86400000;
      return daysSince > 3;
    });
    if (stalledInstalls.length > 0) {
      anomalies.push({
        type: "stalled_installs",
        severity: stalledInstalls.length > 3 ? "high" : "mid",
        message: `${stalledInstalls.length} installs stalled in Configuring stage > 3 days`,
        affected_count: stalledInstalls.length,
      });
    }

    // Log to AgentLog
    if (anomalies.length > 0) {
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "detectAnalyticsAnomalies",
        log_type: "warning",
        summary: `${anomalies.length} anomalies detected`,
        details: JSON.stringify(anomalies),
        service: "analytics",
        requires_nolan: anomalies.some(a => a.severity === "high"),
        resolved: false,
      }).catch(() => {});
    }

    // ── Alert Nolan if HIGH severity
    const highSeverity = anomalies.filter(a => a.severity === "high");
    if (highSeverity.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const lines = highSeverity.map(a => `🚨 ${a.message}`).join("\n");
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "-1003533494424",
            text: `@trinity\n\n⚠️ <b>Analytics Anomalies Detected</b>\n${lines}\n\nReview in admin dashboard.`,
            parse_mode: "HTML",
          }),
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      anomalies_detected: anomalies.length,
      high_severity: highSeverity.length,
      anomalies: anomalies.slice(0, 10),
      this_week_leads: thisWeekCount,
      last_week_leads: lastWeekCount,
      past_due_orders: pastDue.length,
      stalled_installs: stalledInstalls.length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
