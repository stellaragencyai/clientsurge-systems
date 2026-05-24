/**
 * sendClientWelcomeEmail — #502
 * Fixed: correct /client-portal link + Reply-To: nolan@clientsurgesystems.com header.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order?.client_email) return Response.json({ error: "No client email" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return Response.json({ error: "No Resend key" }, { status: 500 });

    // #502: correct portal URL + Reply-To fix
    const appUrl = (Deno.env.get("APP_URL") || "https://clientsurgesystems.com").replace(/\/+$/, "");
    const portalUrl = `${appUrl}/client-portal?order_id=${encodeURIComponent(order_id)}`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",   // #502: fixed Reply-To
        to: order.client_email,
        subject: `Welcome to ClientSurge, ${order.client_name || ""}! 👋`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:20px;font-weight:800">Welcome aboard, ${order.client_name || ""}! 👋</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6">Your AI automation system is being set up and will be live within 5–7 days.</p>
          <p style="color:#374151;font-size:15px;line-height:1.6">You can track your setup progress and see your AI system status anytime through your client portal:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:800;text-decoration:none">
              View My Client Portal →
            </a>
          </div>
          <p style="color:#374151;font-size:14px;line-height:1.6">Have questions at any point? Reply directly to this email — Nolan will respond personally.</p>
          <p style="color:#6B7280;font-size:13px">— Nolan @ ClientSurge Systems</p>
        </div>`,
      }),
    });

    return Response.json({ success: true, sent_to: order.client_email, portal_url: portalUrl });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
