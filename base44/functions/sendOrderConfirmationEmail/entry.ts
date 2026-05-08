/**
 * sendOrderConfirmationEmail — #501
 * Human-readable service labels (not raw service_key strings).
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const SERVICE_LABELS: Record<string, string> = {
  instant_response: "Instant Lead Response (24/7 AI replies)",
  missed_call_textback: "Missed Call Text-Back",
  followup_sequences: "Follow-Up Sequences (Day 1, 3 & 7)",
  appointment_booking_ai: "AI Appointment Booking",
  review_request_ai: "Review Request AI (auto 5-star requests)",
  reactivation_campaign: "Reactivation Campaign (re-engage past clients)",
};

import { getServicesForTier } from "../shared/tierServiceMap.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!order.client_email || !resendKey) return Response.json({ error: "No email or Resend key" }, { status: 400 });

    const services = getServicesForTier(order.package_key || "starter");
    const serviceList = services.map(k => `<li style="color:#374151;margin-bottom:6px">✅ ${SERVICE_LABELS[k] || k}</li>`).join("");

    const tierPrices: Record<string, { monthly: number; setup: number }> = {
      starter: { monthly: 497, setup: 797 },
      growth: { monthly: 997, setup: 1297 },
      elite: { monthly: 1997, setup: 2497 },
    };
    const pricing = tierPrices[order.package_key || "starter"] || tierPrices.starter;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: order.client_email,
        subject: `🎉 Order confirmed — ${order.client_name} (${order.package_key?.charAt(0).toUpperCase()}${order.package_key?.slice(1)})`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:20px;font-weight:800">You're in! 🎉</h2>
          <p style="color:#374151;font-size:15px">Hey ${order.client_name || "there"}, your <b>${order.package_key} plan</b> is confirmed.</p>
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:#0A0F1E;font-weight:700;margin:0 0 12px">What you're getting:</p>
            <ul style="margin:0;padding-left:16px">${serviceList}</ul>
          </div>
          <div style="display:flex;gap:16px;margin:16px 0">
            <div style="flex:1;background:#F0FDF4;border-radius:10px;padding:14px;text-align:center">
              <p style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px">Monthly</p>
              <p style="color:#059669;font-size:22px;font-weight:900;margin:0">$${pricing.monthly}/mo</p>
            </div>
            <div style="flex:1;background:#EFF6FF;border-radius:10px;padding:14px;text-align:center">
              <p style="color:#6B7280;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px">Setup (one-time)</p>
              <p style="color:#2563EB;font-size:22px;font-weight:900;margin:0">$${pricing.setup}</p>
            </div>
          </div>
          <p style="color:#374151;font-size:14px;line-height:1.6"><b>Next step:</b> You'll receive a credentials setup link within the next few minutes. It takes about 5 minutes to complete.</p>
          <p style="color:#6B7280;font-size:13px">Questions? Just reply to this email — Nolan reads every one.</p>
        </div>`,
      }),
    });

    return Response.json({ success: true, sent_to: order.client_email });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
