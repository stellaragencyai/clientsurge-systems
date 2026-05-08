/**
 * generatePackageComparisonEmail — #475
 * Day-60 upsell for Starter and Growth clients.
 * Shows what they're missing vs next tier.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const UPGRADE_CONTENT: Record<string, any> = {
  starter: {
    current_tier: "Starter", next_tier: "Growth", upgrade_price: "$997/mo",
    they_have: ["Instant Lead Response", "Missed Call Text-Back"],
    they_missing: ["Follow-Up Sequences (Day 1, 3, 7)", "AI Appointment Booking"],
    cta_url: "https://clientsurgesystems.com/pricing",
    headline: "You're leaving bookings on the table",
    body: "Your Starter system is working — but Growth clients get 2 more AI systems that follow up automatically and book appointments without you lifting a finger.",
  },
  growth: {
    current_tier: "Growth", next_tier: "Elite", upgrade_price: "$1,997/mo",
    they_have: ["Instant Lead Response", "Missed Call Text-Back", "Follow-Up Sequences", "AI Appointment Booking"],
    they_missing: ["Review Request AI (auto 5-star Google reviews)", "Reactivation Campaign (re-engage old clients)"],
    cta_url: "https://clientsurgesystems.com/pricing",
    headline: "Two more systems that basically pay for themselves",
    body: "Elite adds automated review requests and a reactivation campaign that brings back old clients. Most Elite clients recoup the upgrade cost within 30 days.",
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    let orders: any[] = [];
    if (order_id) {
      const o = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
      if (o) orders = [o];
    } else {
      // Find Starter/Growth clients who have been live ~60 days
      const allOrders = await base44.asServiceRole.entities.Order.filter({ payment_status: "paid" }).catch(() => []);
      const sixty = Date.now() - 60 * 86400000;
      orders = (allOrders || []).filter((o: any) =>
        ["starter", "growth"].includes(o.package_key) &&
        o.went_live_at && new Date(o.went_live_at).getTime() <= sixty
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let sent = 0;
    for (const order of orders) {
      const content = UPGRADE_CONTENT[order.package_key];
      if (!content || !order.client_email || !resendKey) continue;

      const haveList = content.they_have.map((s: string) => `<li style="color:#374151;margin-bottom:4px">✅ ${s}</li>`).join("");
      const missingList = content.they_missing.map((s: string) => `<li style="color:#374151;margin-bottom:4px">❌ ${s}</li>`).join("");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "system@clientsurgesystems.com", reply_to: "nolan@clientsurgesystems.com",
          to: order.client_email,
          subject: `${content.headline} — ${order.client_name}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff">
            <h2 style="color:#0A0F1E;font-size:20px;font-weight:800">${content.headline}</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6">Hey ${order.client_name || "there"},</p>
            <p style="color:#374151;font-size:15px;line-height:1.6">${content.body}</p>
            <div style="display:flex;gap:16px;margin:24px 0;flex-wrap:wrap">
              <div style="flex:1;min-width:200px"><p style="font-weight:700;color:#0A0F1E;font-size:13px">Your ${content.current_tier} system includes:</p><ul style="padding-left:16px;margin:0">${haveList}</ul></div>
              <div style="flex:1;min-width:200px"><p style="font-weight:700;color:#0A0F1E;font-size:13px">${content.next_tier} adds:</p><ul style="padding-left:16px;margin:0">${missingList}</ul></div>
            </div>
            <div style="text-align:center;margin:28px 0">
              <a href="${content.cta_url}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:800;text-decoration:none">Upgrade to ${content.next_tier} — ${content.upgrade_price}</a>
            </div>
            <p style="color:#6B7280;font-size:13px">Questions? Just reply — Nolan will help you decide if it makes sense.</p>
          </div>`,
        }),
      }).catch(() => {});
      sent++;
    }

    return Response.json({ success: true, emails_sent: sent });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
