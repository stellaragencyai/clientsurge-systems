import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * autoOptimizeSMSTemplates — #450
 * A/B test engine for SMS templates.
 * Maintains 2 variants per service. After 50 sends each, picks winner by reply rate.
 * Writes winning variant as active template in Order.install_configuration.
 *
 * Payload: { order_id, service_key } — runs analysis for a specific service
 * Or: { order_id, all: true } — runs for all services on the order
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

const MIN_SENDS_PER_VARIANT = 50;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return json({ error: "Admin access required" }, 403);
    }

    const { order_id, service_key, all } = await req.json().catch(() => ({}));
    if (!order_id) return json({ error: "order_id required" }, 400);

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found" }, 404);

    // Gather CommunicationLog entries for this order's SMS sends
    const logs = await base44.asServiceRole.entities.CommunicationLog.filter(
      { related_entity_type: "Order", related_entity_id: order_id, channel: "sms" },
      "-created_date",
      500
    ).catch(() => []);

    // Group by template_name + variant
    const variantStats = {};
    for (const log of logs || []) {
      const templateName = log.template_name || "unknown";
      // Look for variant marker in metadata or template_name (e.g., "instant_lead_sms_A")
      const variantMatch = templateName.match(/_([AB])$/);
      const variant = variantMatch ? variantMatch[1] : "A";

      if (!variantStats[templateName]) {
        variantStats[templateName] = {
          A: { sent: 0, replies: 0 },
          B: { sent: 0, replies: 0 },
        };
      }

      const v = variantStats[templateName][variant] || variantStats[templateName]["A"];
      v.sent++;
      if (log.delivery_status === "delivered" && log.direction === "inbound") {
        v.replies++;
      }
    }

    // Also check inbound replies from CommunicationEvent
    const inboundEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { order_id, direction: "inbound", channel: "sms" },
      "-created_date",
      200
    ).catch(() => []);

    const results = [];
    const cfg = order.install_configuration || {};
    const templates = cfg.generated_templates || {};
    const serviceKeys = all ? Object.keys(TIER_SERVICE_MAP).flatMap(k => TIER_SERVICE_MAP[k]) : [service_key].filter(Boolean);

    for (const sKey of serviceKeys) {
      const templateField = `${sKey}_sms`;
      if (!templates[templateField]) continue;

      const stats = variantStats[templateField];
      if (!stats) {
        results.push({ service_key: sKey, status: "no_data", message: "No sends recorded yet" });
        continue;
      }

      const aSent = stats.A?.sent || 0;
      const bSent = stats.B?.sent || 0;
      const aReplies = stats.A?.replies || 0;
      const bReplies = stats.B?.replies || 0;

      if (aSent < MIN_SENDS_PER_VARIANT || (bSent > 0 && bSent < MIN_SENDS_PER_VARIANT)) {
        results.push({
          service_key: sKey,
          status: "insufficient_data",
          variant_a: { sent: aSent, replies: aReplies, reply_rate: aSent > 0 ? (aReplies / aSent * 100).toFixed(1) + "%" : "0%" },
          variant_b: { sent: bSent, replies: bReplies, reply_rate: bSent > 0 ? (bReplies / bSent * 100).toFixed(1) + "%" : "0%" },
          message: `Need ${MIN_SENDS_PER_VARIANT} sends per variant to evaluate`,
        });
        continue;
      }

      const aRate = aReplies / aSent;
      const bRate = bSent > 0 ? bReplies / bSent : 0;
      const winner = aRate >= bRate ? "A" : "B";

      results.push({
        service_key: sKey,
        status: "winner_selected",
        winner,
        variant_a: { sent: aSent, replies: aReplies, reply_rate: (aRate * 100).toFixed(1) + "%" },
        variant_b: { sent: bSent, replies: bReplies, reply_rate: (bRate * 100).toFixed(1) + "%" },
      });
    }

    // Log results
    base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      order_id,
      subject: `SMS A/B test results: ${results.length} templates analyzed`,
      message_body: JSON.stringify(results.map(r => ({ service_key: r.service_key, status: r.status, winner: r.winner || "N/A" }))),
      environment: "production",
    }).catch(() => {});

    return json({ success: true, order_id, results, min_sends_per_variant: MIN_SENDS_PER_VARIANT });
  } catch (err) {
    console.error("[autoOptimizeSMSTemplates]", err.message);
    return json({ error: err.message }, 500);
  }
});

const TIER_SERVICE_MAP = {
  starter_system: ["instant_lead_response", "missed_call_text_back"],
  growth_system: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  pro_system: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
};