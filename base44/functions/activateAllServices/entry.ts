/**
 * activateAllServices — #415 / #445
 * Orchestrates full service activation pipeline for a paid order.
 *
 * Flow:
 *   1. Read order + package_key → determine allowed services via TIER_SERVICE_MAP
 *   2. Run generateServiceTemplates first (AI personalization)
 *   3. Validate tier gate (#479) — confirm package allows requested services
 *   4. Call configureService for each allowed service in sequence
 *   5. Per-service error handling — one failure does NOT halt the whole pipeline
 *   6. Log final result to AgentLog + Telegram Nolan
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

// #411 — Tier service map (single source of truth)
const TIER_SERVICE_MAP: Record<string, string[]> = {
  starter: ["instant_lead_response", "missed_call_text_back"],
  growth:  ["instant_lead_response", "missed_call_text_back", "ai_booking_agent", "nurture_sequence_14d"],
  elite:   ["instant_lead_response", "missed_call_text_back", "ai_booking_agent", "nurture_sequence_14d", "review_request", "lead_reactivation"],
};

function getTier(packageKey = ""): string {
  const k = packageKey.toLowerCase();
  if (k.includes("elite")) return "elite";
  if (k.includes("growth")) return "growth";
  return "starter";
}

async function sendTelegram(botToken: string, chatId: string, message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.warn("[activateAllServices] Telegram send failed:", e.message);
  }
}

Deno.serve(async (req) => {
  const TELEGRAM_BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8495239862:AAF_ScgymDF8MlcwGVKzrPfTldxpSMunZn4";
  const TELEGRAM_NOLAN = Deno.env.get("TELEGRAM_NOLAN_ID") || "7776809236";

  try {
    const base44 = createClientFromRequest(req);
    const { order_id, dry_run = false } = await req.json();

    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const tier = getTier(order.package_key || "");
    const allowedServices = TIER_SERVICE_MAP[tier];

    console.log(`[activateAllServices] order=${order_id} tier=${tier} services=${allowedServices.join(",")}`);

    // Step 1: Generate AI templates first
    if (!dry_run) {
      try {
        await base44.functions.invoke("generateServiceTemplates", { order_id });
        console.log("[activateAllServices] Templates generated ✅");
      } catch (e) {
        console.warn("[activateAllServices] Template generation failed (non-fatal):", e.message);
      }
    }

    // Step 2: Activate each service — per-service error handling, no full halt
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const serviceKey of allowedServices) {
      if (dry_run) {
        results[serviceKey] = { success: true };
        continue;
      }
      try {
        await base44.functions.invoke("configureService", { order_id, service_key: serviceKey });
        results[serviceKey] = { success: true };
        console.log(`[activateAllServices] ${serviceKey} ✅`);
      } catch (e) {
        results[serviceKey] = { success: false, error: e.message };
        console.error(`[activateAllServices] ${serviceKey} ❌ — ${e.message}`);
      }
    }

    const passed = Object.values(results).filter(r => r.success).length;
    const failed = Object.values(results).filter(r => !r.success).length;

    // Step 3: Log to AgentLog
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "Agent Smith",
      log_type: failed > 0 ? "WARNING" : "INFO",
      summary: `activateAllServices: ${passed}/${allowedServices.length} services activated for order ${order_id}`,
      details: JSON.stringify(results),
      service: "activateAllServices",
      requires_nolan: failed > 0,
      resolved: failed === 0,
    });

    // Step 4: Telegram Nolan if any failures
    if (failed > 0 && !dry_run) {
      const failedKeys = Object.entries(results).filter(([,v]) => !v.success).map(([k]) => k).join(", ");
      await sendTelegram(TELEGRAM_BOT, TELEGRAM_NOLAN,
        `⚠️ <b>Service Activation Partial Failure</b>\nOrder: ${order_id}\nTier: ${tier}\nPassed: ${passed}/${allowedServices.length}\nFailed: ${failedKeys}\n\nCheck AgentLog for details.`
      );
    }

    return Response.json({ success: true, order_id, tier, results, passed, failed, dry_run });
  } catch (err) {
    console.error("[activateAllServices] Fatal error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
