/**
 * updateMetricsSnapshot — Hourly aggregation of metrics for client dashboards.
 *
 * Runs every 60 minutes via scheduled automation.
 * Aggregates CommunicationEvent, Lead, AutomationChecklist, and integration health data.
 * Writes a new MetricsSnapshot record for each active order/project.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "POST required" }, 405);
  }

  const base44 = createClientFromRequest(req);
  const results = {};

  try {
    // Get all active orders (payment_status = "paid")
    const activeOrders = await base44.asServiceRole.entities.Order.filter(
      { payment_status: "paid" },
      "-created_date",
      100
    ).catch(() => []);

    console.log(`[updateMetricsSnapshot] Processing ${activeOrders.length} active orders`);

    for (const order of activeOrders) {
      const orderId = order.id;
      const businessName = order.business_name || "Unknown";
      const clientProjectId = order.client_project_id;

      // ── Aggregate leads captured ──────────────────────────────────────
      const leads = await base44.asServiceRole.entities.WebsiteLead.filter(
        { },
        "-created_date",
        500
      ).catch(() => []);

      const leadsCapturedTotal = leads.length;
      const leadsLast24h = leads.filter(l => {
        const created = new Date(l.created_date);
        const now = new Date();
        const diffHours = (now - created) / (1000 * 60 * 60);
        return diffHours <= 24;
      }).length;

      const leadsResponded = leads.filter(l =>
        l.reply_status === "responded" || l.booking_status === "booked"
      ).length;

      // ── Aggregate communications ──────────────────────────────────────
      const comms = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { order_id: orderId },
        "-created_date",
        500
      ).catch(() => []);

      const smsSentCount = comms.filter(c => c.channel === "sms" && c.status === "sent").length;
      const emailsSentCount = comms.filter(c => c.channel === "email" && c.status === "sent").length;
      const automationsTriggeredToday = comms.filter(c => {
        const created = new Date(c.created_date);
        const now = new Date();
        const diffHours = (now - created) / (1000 * 60 * 60);
        return c.event_type?.includes("triggered") && diffHours <= 24;
      }).length;

      // ── Aggregate automation checklists ───────────────────────────────
      const checklists = await base44.asServiceRole.entities.AutomationChecklist.filter(
        { order_id: orderId },
        "-created_date",
        100
      ).catch(() => []);

      const automationsActive = checklists.filter(c => c.status === "active").length;

      // ── Integration health ────────────────────────────────────────────
      const integrationHealth = {
        twilio: order.install_configuration?.shared?.twilio_business_phone ? "healthy" : "inactive",
        resend: order.install_configuration?.services?.instant_lead_response ? "healthy" : "inactive",
        booking: order.install_configuration?.services?.ai_booking_agent?.booking_link ? "healthy" : "inactive",
      };

      const integrationsHealthy = Object.entries(integrationHealth)
        .filter(([_, status]) => status === "healthy")
        .map(([name, _]) => name);

      const integrationsFailed = Object.entries(integrationHealth)
        .filter(([_, status]) => status === "error")
        .map(([name, _]) => name);

      // ── Service status map ───────────────────────────────────────────
      const serviceStatuses = {};
      (order.items || []).forEach(item => {
        if (item.service_key) {
          serviceStatuses[item.service_key] = item.install_status?.toLowerCase() || "unknown";
        }
      });

      // ── System health ────────────────────────────────────────────────
      const systemHealthStatus =
        integrationsFailed.length > 0 ? "degraded" :
        order.pipeline_error ? "error" : "healthy";

      // ── Revenue (from order totals) ──────────────────────────────────
      const revenueMtd = order.total_monthly || 0;

      // ── Create snapshot ──────────────────────────────────────────────
      const snapshot = await base44.asServiceRole.entities.MetricsSnapshot.create({
        order_id: orderId,
        client_project_id: clientProjectId,
        business_name: businessName,
        snapshot_date: new Date().toISOString(),
        leads_captured_total: leadsCapturedTotal,
        leads_captured_this_period: leadsLast24h,
        leads_responded: leadsResponded,
        automations_active: automationsActive,
        automations_triggered_today: automationsTriggeredToday,
        sms_sent_count: smsSentCount,
        emails_sent_count: emailsSentCount,
        bookings_created_total: 0, // Would need booking entity to calc properly
        bookings_created_today: 0,
        system_health_status: systemHealthStatus,
        integrations_healthy: integrationsHealthy,
        integrations_failed: integrationsFailed,
        service_statuses: serviceStatuses,
        revenue_mtd: revenueMtd,
        metadata: JSON.stringify({
          total_communications: comms.length,
          order_status: order.order_status,
          pipeline_status: order.pipeline_status,
        }),
      }).catch(err => {
        console.warn(`[updateMetricsSnapshot] Failed to create snapshot for ${orderId}:`, err.message);
        return null;
      });

      if (snapshot) {
        results[orderId] = {
          success: true,
          snapshot_id: snapshot.id,
          metrics: {
            leads_total: leadsCapturedTotal,
            leads_24h: leadsLast24h,
            automations_active: automationsActive,
            sms_sent: smsSentCount,
            health: systemHealthStatus,
          },
        };
      }
    }

    console.log(`[updateMetricsSnapshot] ✅ Complete`, { orders_processed: Object.keys(results).length });

    return json({
      success: true,
      orders_processed: Object.keys(results).length,
      results,
    });

  } catch (err) {
    console.error("[updateMetricsSnapshot] Fatal error:", err.message);
    return json({ success: false, error: err.message }, 500);
  }
});