/**
 * detectAnalyticsAnomalies — #460
 * Daily check for:
 * 1. Lead volume drops > 30% week-over-week
 * 2. Churn risk spike (orders with billing_status "past_due")
 * 3. Stalled installs (workflow_stage stuck for > 3 days)
 * Alerts Nolan via Telegram if HIGH severity.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

interface Anomaly {
  type: "lead_volume_drop" | "churn_risk_spike" | "stalled_install";
  severity: "low" | "medium" | "high";
  message: string;
  details: Record<string, any>;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const anomalies: Anomaly[] = [];
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 86400000);
    const lastWeekStart = new Date(now.getTime() - 14 * 86400000);

    // ── Anomaly 1: Lead volume drop > 30% WoW ────────────────────────────────
    const allLeads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []);
    const thisWeekLeads = (allLeads || []).filter((l: any) => new Date(l.created_date) >= thisWeekStart).length;
    const lastWeekLeads = (allLeads || []).filter((l: any) => {
      const d = new Date(l.created_date);
      return d >= lastWeekStart && d < thisWeekStart;
    }).length;

    if (lastWeekLeads > 0) {
      const dropPct = ((lastWeekLeads - thisWeekLeads) / lastWeekLeads) * 100;
      if (dropPct > 30) {
        anomalies.push({
          type: "lead_volume_drop",
          severity: dropPct > 50 ? "high" : "medium",
          message: `Lead volume dropped ${Math.round(dropPct)}% WoW (${lastWeekLeads} → ${thisWeekLeads})`,
          details: { this_week: thisWeekLeads, last_week: lastWeekLeads, drop_percent: dropPct },
        });
      }
    }

    // ── Anomaly 2: Churn risk spike ──────────────────────────────────────────
    const orders = await base44.asServiceRole.entities.Order.list().catch(() => []);
    const pastDueOrders = (orders || []).filter((o: any) => o.billing_status === "past_due");
    const pastDueThisWeek = pastDueOrders.filter((o: any) => new Date(o.updated_date) >= thisWeekStart).length;

    if (pastDueThisWeek > 2) {
      anomalies.push({
        type: "churn_risk_spike",
        severity: pastDueThisWeek > 5 ? "high" : "medium",
        message: `${pastDueThisWeek} orders at past_due this week (${pastDueOrders.length} total)`,
        details: { past_due_this_week: pastDueThisWeek, past_due_total: pastDueOrders.length },
      });
    }

    // ── Anomaly 3: Stalled installs (3+ days in same stage) ─────────────────
    const stalledThreshold = new Date(now.getTime() - 3 * 86400000); // 3 days ago
    const stalledOrders = (orders || []).filter((o: any) => {
      const lastUpdate = new Date(o.updated_date);
      const stuckSince = lastUpdate < stalledThreshold;
      const notLive = o.workflow_stage !== "Live" && o.workflow_stage !== "Testing";
      return stuckSince && notLive;
    });

    if (stalledOrders.length > 3) {
      anomalies.push({
        type: "stalled_install",
        severity: stalledOrders.length > 8 ? "high" : "medium",
        message: `${stalledOrders.length} orders stuck in install pipeline (3+ days no progress)`,
        details: {
          stalled_count: stalledOrders.length,
          stages: stalledOrders.map((o: any) => o.workflow_stage).filter((v: any, i: number, a: any) => a.indexOf(v) === i),
        },
      });
    }

    // ── Log to AgentLog ──────────────────────────────────────────────────────
    if (anomalies.length > 0) {
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "detectAnalyticsAnomalies",
        log_type: "warning",
        summary: `${anomalies.length} analytics anomalies detected`,
        details: JSON.stringify(anomalies),
        service: "analytics",
        requires_nolan: anomalies.some(a => a.severity === "high"),
        resolved: false,
      }).catch(() => {});
    }

    // ── Alert Nolan via Telegram if HIGH severity ───────────────────────────
    const highSeverity = anomalies.filter(a => a.severity === "high");
    if (highSeverity.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const lines = highSeverity.map(a => `• <b>${a.type}</b>: ${a.message}`).join("\n");
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "-1003533494424",
            text: `@trinity\n\n🚨 <b>Analytics Anomalies Detected</b>\n${lines}\n\nCheck AgentLog for full details.`,
            parse_mode: "HTML",
          }),
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      anomalies_found: anomalies.length,
      high_severity: highSeverity.length,
      details: anomalies,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
