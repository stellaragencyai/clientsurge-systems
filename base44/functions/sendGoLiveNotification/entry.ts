import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

/**
 * sendGoLiveNotification — Fires when ALL package services confirmed active.
 * Sends Telegram to Nolan + welcome email to client.
 * Uses Order.customer_email / customer_name (canonical field names).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    // Mark order pipeline as live
    await base44.asServiceRole.entities.Order.update(order_id, {
      pipeline_status: "Live",
      activation_completed_at: new Date().toISOString(),
      order_status: "fully_live",
    });

    // Telegram to Nolan
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: "-1003533494424",
          text: `@trinity\n\n🚀 <b>System Live!</b>\nClient: ${order.customer_name || "Unknown"}\nTier: ${order.package_type || order.selected_package_type || "—"}\nOrder: ${order_id}\nAll services confirmed active.`,
          parse_mode: "HTML",
        }),
      }).catch(() => {});
    }

    // Welcome email to client
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const customerEmail = order.customer_email || order.client_email;
    const customerName = order.customer_name || order.client_name || "there";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";

    if (customerEmail && resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          reply_to: "nolan@clientsurgesystems.com",
          to: customerEmail,
          subject: "🚀 Your AI system is live!",
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px">
            <h2 style="color:#003B8F;font-size:22px;font-weight:800">Your system is live! 🎉</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6">Hey ${customerName},</p>
            <p style="color:#374151;font-size:15px;line-height:1.6">Your ClientSurge AI automation system is fully active and responding to leads right now. Every call, every form submission, every inquiry — handled automatically, 24/7.</p>
            <p style="color:#374151;font-size:15px;line-height:1.6">Reply to this email anytime if you need anything. We're here.</p>
            <p style="color:#374151;font-size:14px">— Nolan @ ClientSurge Systems</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    // Log to CommunicationEvent instead of non-existent AgentLog
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "internal",
      direction: "system",
      event_type: "status_update",
      provider: "internal",
      status: "processed",
      subject: `System live: ${customerName}`,
      message_body: `Order ${order_id} went fully live`,
      metadata_json: JSON.stringify({ order_id, customer_name: customerName }),
    }).catch(() => {});

    return secureJson({ success: true, order_id, went_live_at: new Date().toISOString() });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});