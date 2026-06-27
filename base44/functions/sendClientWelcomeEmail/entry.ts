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
 * sendClientWelcomeEmail — sends welcome email to new client after order payment.
 * Uses Order.customer_email / customer_name (canonical field names).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const customerEmail = order.customer_email || order.client_email;
    if (!customerEmail) return secureJson({ error: "No customer email on order" }, { status: 400 });

    const customerName = order.customer_name || order.client_name || "there";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    const portalUrl = `https://clientsurgesystems.com/client-portal?order_id=${order_id}`;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        reply_to: "nolan@clientsurgesystems.com",
        to: customerEmail,
        subject: `Welcome to ClientSurge, ${customerName}! 👋`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#003B8F;font-size:20px;font-weight:800">Welcome aboard, ${customerName}! 👋</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6">Your AI automation system is being set up and will be live within 5–7 days.</p>
          <p style="color:#374151;font-size:15px;line-height:1.6">You can track your setup progress and see your AI system status anytime through your client portal:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#003B8F,#00AEEF);color:#FFFFFF;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:800;text-decoration:none">
              View My Client Portal →
            </a>
          </div>
          <p style="color:#374151;font-size:14px;line-height:1.6">Have questions at any point? Reply directly to this email — Nolan will respond personally.</p>
          <p style="color:#6B7280;font-size:13px">— Nolan @ ClientSurge Systems</p>
        </div>`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Resend error ${res.status}`);
    }

    return secureJson({ success: true, sent_to: customerEmail, portal_url: portalUrl });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});