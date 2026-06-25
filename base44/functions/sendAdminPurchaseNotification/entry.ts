import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendAdminPurchaseNotification — #405 #405a #405b
 * Fires on EVERY checkout.session.completed.
 * Sends Telegram to Nolan. Falls back to email if Telegram fails.
 * FIX: Removed broken _shared/response.ts import.
 * FIX: Upgraded SDK to 0.8.31.
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, customer_name, package_key, setup_fee, monthly_rate, customer_email } = body;

    const tierLabels = {
      starter: "Starter",
      starter_system: "Starter",
      growth: "Growth",
      growth_system: "Growth",
      elite: "Pro",
      elite_system: "Pro",
      pro: "Pro",
      pro_system: "Pro",
    };
    const tier = tierLabels[package_key] || package_key || "Unknown";
    const setup = setup_fee ? `$${Number(setup_fee).toLocaleString()}` : "N/A";
    const monthly = monthly_rate ? `$${Number(monthly_rate).toLocaleString()}/mo` : "N/A";

    // #405a: Telegram message format
    const message = [
      "💳 <b>New Payment Received</b>",
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
      console.warn("[sendAdminPurchaseNotification] No TELEGRAM_BOT_TOKEN — falling back to email only");
    }

    let telegramOk = false;
    if (botToken) {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      const result = await res.json();
      telegramOk = result.ok === true;
      console.log("[sendAdminPurchaseNotification] Telegram sent:", telegramOk);
    }

    // #405b: Email fallback when Telegram fails or is unconfigured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || Deno.env.get("ADMIN_EMAIL") || "nolan@clientsurgesystems.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";

    if (resendKey && (!telegramOk)) {
      const emailBody = `<div style="font-family:sans-serif;max-width:500px;padding:24px;">
        <h2 style="color:#0A1628;margin:0 0 16px;">💳 New Payment Received</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;font-weight:bold;width:120px;">Business</td><td style="padding:8px;">${customer_name || "Unknown"}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;">Tier</td><td style="padding:8px;">${tier}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Setup</td><td style="padding:8px;">${setup}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;">Monthly</td><td style="padding:8px;">${monthly}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${customer_email || "—"}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;">Order ID</td><td style="padding:8px;font-size:11px;">${order_id || "—"}</td></tr>
        </table>
      </div>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `ClientSurge Systems <${fromEmail}>`,
          to: adminEmail,
          subject: `💳 New Payment: ${customer_name || "Unknown"} — ${tier} — ${setup} setup`,
          html: emailBody,
        }),
      }).catch(e => console.warn("[sendAdminPurchaseNotification] Email fallback failed:", e.message));
    }

    // Log to AgentLog
    base44.asServiceRole.entities.AgentLog.create({
      agent_name: "sendAdminPurchaseNotification",
      log_type: "info",
      summary: `New payment: ${customer_name} — ${tier} — ${setup} setup`,
      details: JSON.stringify({ order_id, package_key, setup_fee, monthly_rate, customer_email }),
      service: "stripe",
      requires_nolan: false,
      resolved: true,
    }).catch(() => {});

    return json({ success: true, telegram_sent: telegramOk });
  } catch (err) {
    console.error("[sendAdminPurchaseNotification]", err.message);
    return json({ error: err.message }, 500);
  }
});