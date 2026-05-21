import { secureJson } from "../_shared/response.ts";
/**
 * sendAdminPurchaseNotification — #405 #405a
 * Fires on EVERY checkout.session.completed — sends Telegram to Nolan.
 * Format: "💳 New Payment: [Business] — [Tier] — $[Setup] setup + $[Monthly]/mo"
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, customer_name, package_key, setup_fee, monthly_rate, customer_email } = body;

    const tierLabels = { starter: "Starter", growth: "Growth", elite: "Elite" };
    const tier = tierLabels[package_key] || package_key || "Unknown";
    const setup = setup_fee ? `$${Number(setup_fee).toLocaleString()}` : "N/A";
    const monthly = monthly_rate ? `$${Number(monthly_rate).toLocaleString()}/mo` : "N/A";

    // #405a: Telegram message format
    const message = [
      "@trinity",
      "",
      `💳 <b>New Payment Received</b>`,
      `Business: ${customer_name || "Unknown"}`,
      `Tier: ${tier}`,
      `Setup: ${setup}`,
      `Monthly: ${monthly}`,
      `Email: ${customer_email || "—"}`,
      `Order ID: ${order_id || "—"}`,
    ].join("\n");

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = "-1003533494424";

    if (!botToken) {
      console.warn("[sendAdminPurchaseNotification] No TELEGRAM_BOT_TOKEN set");
      return secureJson({ success: false, error: "No bot token" }, { status: 503 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    const result = await res.json();

    // Log to AgentLog
    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "sendAdminPurchaseNotification",
      log_type: "info",
      summary: `New payment: ${customer_name} — ${tier} — ${setup} setup`,
      details: JSON.stringify(body),
      service: "stripe",
      requires_nolan: false,
      resolved: true,
    }).catch(() => {});

    console.log("[sendAdminPurchaseNotification] Sent:", result.ok);
    return secureJson({ success: result.ok });
  } catch (err) {
    console.error("[sendAdminPurchaseNotification]", err.message);
    return secureJson({ error: err.message }, { status: 500 });
  }
});
