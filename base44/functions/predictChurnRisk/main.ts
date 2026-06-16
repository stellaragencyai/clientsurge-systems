import { secureJson } from "../_shared/response.ts";
/**
 * predictChurnRisk — #253
 * Runs weekly on all active Orders. Scores churn risk 0-100.
 * Alerts Nolan via Telegram if score > 70.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function calculateChurnScore(order) {
  let score = 0;
  const now = Date.now();
  const daysSinceLive = order.went_live_at
    ? (now - new Date(order.went_live_at).getTime()) / 86400000 : 0;
  const daysSinceContact = order.last_client_contact_at
    ? (now - new Date(order.last_client_contact_at).getTime()) / 86400000 : 30;

  if (order.billing_status === "past_due") score += 40;
  if (daysSinceContact > 14) score += 20;
  if (daysSinceContact > 30) score += 15;
  if (order.support_tickets_open > 2) score += 15;
  if (daysSinceLive < 7 && daysSinceContact > 3) score += 10;

  return Math.min(score, 100);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order
      .filter({ payment_status: "paid" }).catch(() => []);

    const highRisk = [];
    for (const order of (orders || [])) {
      const score = calculateChurnScore(order);
      await base44.asServiceRole.entities.Order.update(order.id, { churn_risk_score: score }).catch(() => {});
      if (score > 70) highRisk.push({ id: order.id, name: order.client_name, score });
    }

    if (highRisk.length > 0) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (botToken) {
        const lines = highRisk.map(o => \`• \${o.name || "Unknown"} — Score: \${o.score}\`).join("\n");
        await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: "-1003533494424",
            text: \`@trinity\n\n⚠️ <b>Churn Risk Alert</b>\n\${highRisk.length} client(s) at risk:\n\${lines}\`,
            parse_mode: "HTML" }),
        }).catch(() => {});
      }
    }

    return secureJson({ success: true, scored: orders?.length || 0, high_risk: highRisk.length });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
