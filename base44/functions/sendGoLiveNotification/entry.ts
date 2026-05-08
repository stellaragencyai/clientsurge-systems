/**
 * sendGoLiveNotification — #435
 * Fires when ALL package services confirmed active.
 * Sends Telegram to Nolan + welcome email to client.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Mark order as live
    await base44.asServiceRole.entities.Order.update(order_id, {
      workflow_stage: "Live",
      went_live_at: new Date().toISOString(),
      billing_status: "active",
    });

    // Telegram to Nolan
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "-1003533494424",
          text: `@trinity\n\n🚀 <b>System Live!</b>\nClient: ${order.client_name || "Unknown"}\nTier: ${order.package_key || "—"}\nOrder: ${order_id}\nAll services confirmed active.`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }

    // Welcome email to client
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (order.client_email && resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "system@clientsurgesystems.com",
          reply_to: "nolan@clientsurgesystems.com",
          to: order.client_email,
          subject: "🚀 Your AI system is live!",
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px">
            <h2 style="color:#0A0F1E;font-size:22px;font-weight:800">Your system is live! 🎉</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6">Hey ${order.client_name || "there"},</p>
            <p style="color:#374151;font-size:15px;line-height:1.6">Your ClientSurge AI automation system is fully active and responding to leads right now. Every call, every form submission, every inquiry — handled automatically, 24/7.</p>
            <p style="color:#374151;font-size:15px;line-height:1.6">Reply to this email anytime if you need anything. We're here.</p>
            <p style="color:#374151;font-size:14px">— Nolan @ ClientSurge Systems</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "sendGoLiveNotification", log_type: "info",
      summary: `System live: ${order.client_name} (${order.package_key})`,
      details: JSON.stringify({ order_id }), service: "install_pipeline",
      requires_nolan: false, resolved: true,
    }).catch(() => {});

    return Response.json({ success: true, order_id, went_live_at: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
