import { resendFetch } from "../_shared/resendFetch.js";
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
 * sendWentLiveEmail — Auto-triggered when ClientInstallationOS goes live.
 * Sends celebratory "You're Live!" email to client.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const install_os_id = body.install_os_id || body.onboarding_id || body.data?.id || body.event?.entity_id;
    if (!install_os_id) return secureJson({ error: "install_os_id required" }, { status: 400 });

    const installOS = await base44.asServiceRole.entities.ClientInstallationOS.get(install_os_id).catch(() => null);
    if (!installOS) return secureJson({ error: "ClientInstallationOS record not found" }, { status: 404 });

    const customerEmail = installOS.client_email;
    if (!customerEmail) return secureJson({ error: "No email on installation record" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    const portalUrl = "https://clientsurgesystems.com/client-portal";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="background:linear-gradient(135deg,#003B8F,#00AEEF);border-radius:16px;padding:40px;text-align:center;margin-bottom:24px;">
    <div style="font-size:56px;margin-bottom:16px;">🚀</div>
    <h1 style="color:#FFFFFF;font-size:28px;font-weight:800;margin:0 0 12px;">You're officially live!</h1>
    <p style="color:#E0F2FE;font-size:16px;margin:0;">
      Your AI automation system is now running 24/7 for ${installOS.business_name || "your business"}.
    </p>
  </div>
  <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px;">What's running right now:</h2>
    <ul style="color:#374151;font-size:15px;line-height:1.8;margin:0;padding-left:20px;">
      <li>⚡ Instant lead response — every new lead gets a reply in under 60 seconds</li>
      <li>📞 Missed call text-back — no call ever goes unanswered</li>
      <li>🔁 Follow-up sequences — automated multi-step outreach</li>
    </ul>
  </div>
  <div style="text-align:center;">
    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#003B8F,#00AEEF);color:#FFFFFF;border-radius:9999px;padding:16px 36px;font-weight:800;font-size:16px;text-decoration:none;">
      View Your Dashboard →
    </a>
  </div>
  <p style="color:#9CA3AF;font-size:13px;text-align:center;margin-top:24px;">
    Need anything? Reply to this email — Nolan reads every one.
  </p>
</div>`;

    const res = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        reply_to: "nolan@clientsurgesystems.com",
        to: customerEmail,
        subject: `🚀 You're Live! ${installOS.business_name || "Your"} AI System is Running`,
        html,
      }),
    });

    if (!res.ok) throw new Error(`Resend ${res.status}`);

    // Log to CommunicationEvent instead of non-existent AgentLog
    await base44.asServiceRole.entities.CommunicationEvent.create({
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      provider: "resend",
      status: "sent",
      subject: `Went live email sent to ${customerEmail}`,
      message_body: `Sent went_live email to ${customerEmail}`,
      metadata_json: JSON.stringify({ install_os_id, business_name: installOS.business_name }),
    }).catch(() => {});

    return secureJson({ success: true, email: customerEmail });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});