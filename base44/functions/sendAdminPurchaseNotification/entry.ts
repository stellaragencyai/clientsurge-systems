/**
 * sendAdminPurchaseNotification — #405 #405a #405b
 * Fires on EVERY checkout.session.completed — sends Telegram to Nolan.
 * Format: "💳 New Payment: [Business] — [Tier] — $[Setup] setup + $[Monthly]/mo"
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
} from "../_shared/communicationOutbox.js";

async function sendBackupEmail(base44, payload, message, reason) {
  const to = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com";
  try {
    const body = `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:640px;margin:0 auto;padding:28px 20px;">
  <h2 style="margin:0 0 12px;color:#0A1628;">New Payment Received</h2>
  <p style="margin:0 0 16px;color:#374151;">Telegram delivery failed or was unavailable, so this backup email was sent instead.</p>
  <pre style="white-space:pre-wrap;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;color:#0F172A;">${message.replace(/<[^>]*>/g, "")}</pre>
  <p style="margin:16px 0 0;color:#64748B;font-size:13px;">Reason: ${reason}</p>
</div>`;
    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "email",
      provider: "resend",
      recipient: to,
      subject: `New payment alert fallback - ${payload.customer_name || "Unknown client"}`,
      body,
      html: body,
      orderId: payload.order_id,
      source: "sendAdminPurchaseNotification",
      sourceRecordId: payload.order_id || payload.customer_email || "unknown",
      templateKey: "admin_purchase_fallback_email",
      messageType: "transactional",
      consentBasis: "internal_notification",
      metadata: { reason, customer_email: payload.customer_email },
      providerSend: (providerPayload) => sendResendEmailProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });
    return Boolean(result.success);
  } catch (error) {
    console.warn("[sendAdminPurchaseNotification] Backup email failed:", error.message);
    return false;
  }
}

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
      const backup_sent = await sendBackupEmail(base44, body, message, "TELEGRAM_BOT_TOKEN missing");
      return Response.json({ success: backup_sent, telegram_sent: false, backup_email_sent: backup_sent, error: "No bot token" });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
    });
    const result = await res.json();
    let backupEmailSent = false;
    if (!res.ok || !result?.ok) {
      backupEmailSent = await sendBackupEmail(
        base44,
        body,
        message,
        `Telegram API returned ${res.status}: ${JSON.stringify(result)}`
      );
    }

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
    return Response.json({
      success: Boolean(result.ok || backupEmailSent),
      telegram_sent: Boolean(result.ok),
      backup_email_sent: backupEmailSent,
    });
  } catch (err) {
    console.error("[sendAdminPurchaseNotification]", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
