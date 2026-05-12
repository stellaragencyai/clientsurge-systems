/**
 * detectAnalyticsAnomalies — #460
 * Daily anomaly detection: 30% lead drop WoW, churn spikes, stalled installs.
 * Alerts Nolan via Telegram if HIGH severity anomalies found.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

interface Anomaly {
  type: "lead_drop" | "churn_risk" | "stalled_install";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  metric?: number;
  affected_count?: number;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const anomalies: Anomaly[] = [];

    // ─ 1. Lead volume WoW drop >30% ─────────────────────────────────────────
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Monday
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    const allLeads = await base44.asServiceRole.entities.SpaLead.list().catch(() => []) || [];
    
    const thisWeekLeads = allLeads.filter((l: any) => {
      const d = new Date(l.created_date);
      return d >= thisWeekStart && d <= thisWeekEnd;
    }).length;

    const lastWeekLeads = allLeads.filter((l: any) => {
      const d = new Date(l.created_date);
      return d >= lastWeekStart && d < thisWeekStart;
    }).length;

    if (lastWeekLeads > 0) {
      const dropPct = ((lastWeekLeads - thisWeekLeads) / lastWeekLeads) * 100;
      if (dropPct > 30) {
        anomalies.push({
          type: "lead_drop",
          severity: "HIGH",
          description: `Lead volume dropped ${Math.round(dropPct)}% WoW (${thisWeekLeads} this week vs ${lastWeekLeads} last week)`,
          metric: thisWeekLeads,
        });
      }
    }

    // ─ 2. Churn risk: paid orders with status != "Live" for >14 days ─────────
    const orders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []) || [];
    const stalledOrders = orders.filter((o: any) => {
      if (o.workflow_stage === "Live") return false;
      const daysStalled = (Date.now() - new Date(o.created_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysStalled > 14;
    });

    if (stalledOrders.length > 0) {
      anomalies.push({
        type: "stalled_install",
        severity: "MEDIUM",
        description: \`\${stalledOrders.length} paid orders stuck in setup for 14+ days\`,
        affected_count: stalledOrders.length,
      });
    }

    // ─ 3. Churn risk: active clients with declining activity ─────────────────
    const activeClients = orders.filter((o: any) => o.workflow_stage === "Live" && o.payment_status === "paid");
    const churnRisks = [];
    for (const client of activeClients) {
      const clientLeads = allLeads.filter((l: any) => l.created_by === client.created_by);
      const last30Days = clientLeads.filter((l: any) => {
        const d = new Date(l.created_date);
        return d >= new Date(Date.now() - 30 * 86400000);
      }).length;
      const prior30Days = clientLeads.filter((l: any) => {
        const d = new Date(l.created_date);
        return d >= new Date(Date.now() - 60 * 86400000) && d < new Date(Date.now() - 30 * 86400000);
      }).length;

      if (prior30Days > 0) {
        const decline = ((prior30Days - last30Days) / prior30Days) * 100;
        if (decline > 40) {
          churnRisks.push({
            client_name: client.client_name || "Unknown",
            order_id: client.id,
            decline_pct: Math.round(decline),
          });
        }
      }
    }

    if (churnRisks.length > 0) {
      anomalies.push({
        type: "churn_risk",
        severity: "HIGH",
        description: \`\${churnRisks.length} active clients showing >40% lead volume decline\`,
        affected_count: churnRisks.length,
      });
    }

    // ─ Alert if HIGH severity ───────────────────────────────────────────────
    const highSeverity = anomalies.filter(a => a.severity === "HIGH");
    if (highSeverity.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const alertText = highSeverity.map(a => \`⚠️ \${a.type.toUpperCase()}: \${a.description}\`).join("\n");
        await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "-1003533494424",
            text: \`@trinity\n\n🚨 <b>Analytics Anomalies Detected</b>\n\${alertText}\n\nCheck dashboard immediately.\`,
            parse_mode: "HTML",
          }),
        }).catch(() => {});
      }
    }

    // ─ Log all findings ──────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "detectAnalyticsAnomalies",
      log_type: anomalies.length > 0 ? "warning" : "info",
      summary: \`Daily anomaly check: \${anomalies.length} total (\${highSeverity.length} HIGH)\`,
      details: JSON.stringify({ anomalies, churn_risks: churnRisks }),
      service: "analytics", requires_nolan: highSeverity.length > 0, resolved: false,
    }).catch(() => {});

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      anomalies,
      high_severity_count: highSeverity.length,
      alert_sent: highSeverity.length > 0,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
