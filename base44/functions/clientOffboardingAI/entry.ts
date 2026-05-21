/**
 * clientOffboardingAI — #474
 * On subscription.deleted: generates personalized 3-email win-back sequence.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, reason } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const business_name = order.client_name || "your business";

    // Mark order as churned
    await base44.asServiceRole.entities.Order.update(order_id, {
      workflow_stage: "Churned", billing_status: "cancelled", churned_at: new Date().toISOString(),
    });

    // Day 0: immediate "We're sorry to see you go"
    if (order.client_email && resendKey) {
      await resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "system@clientsurgesystems.com", reply_to: "nolan@clientsurgesystems.com",
          to: order.client_email,
          subject: `We're sorry to see you go, ${business_name}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px">
            <h2 style="color:#0A0F1E">We've cancelled your subscription</h2>
            <p style="color:#374151">Hey ${order.client_name || "there"},<br><br>Your ClientSurge subscription has been cancelled. We're sorry to see you go.</p>
            <p style="color:#374151">If there's anything we could have done better — or if you'd like to restart at any time — just reply to this email. Nolan will personally reach out.</p>
            <p style="color:#6B7280;font-size:13px">— Nolan @ ClientSurge Systems</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    // Telegram Nolan
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424",
          text: `@trinity

📉 <b>Client Churned</b>
Client: ${business_name}
Tier: ${order.package_key}
Reason: ${reason || "not specified"}`,
          parse_mode: "HTML" }),
      }).catch(() => {});
    }

    return Response.json({ success: true, order_id, churned_at: new Date().toISOString() });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
