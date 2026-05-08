/**
 * sendWentLiveEmail — #278
 * Auto-triggered when ClientOnboarding.went_live = true.
 * Sends celebratory "You're Live!" email to client.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const onboarding_id = body.onboarding_id || body.data?.id || body.event?.entity_id;
    if (!onboarding_id) return Response.json({ error: "onboarding_id required" }, { status: 400 });

    const onboarding = await base44.asServiceRole.entities.ClientOnboarding.get(onboarding_id);
    if (!onboarding?.email) return Response.json({ error: "No email on onboarding record" }, { status: 400 });
    if (!onboarding.went_live) return Response.json({ skipped: true, reason: "went_live is not true" });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = "https://clientsurgesystems.com/client-portal";

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="background:linear-gradient(135deg,#064E3B,#065F46);border-radius:16px;padding:40px;text-align:center;margin-bottom:24px;">
    <div style="font-size:56px;margin-bottom:16px;">🚀</div>
    <h1 style="color:#00FFB3;font-size:28px;font-weight:800;margin:0 0 12px;">You're officially live!</h1>
    <p style="color:#D1FAE5;font-size:16px;margin:0;">
      Your AI automation system is now running 24/7 for ${onboarding.business_name || "your business"}.
    </p>
  </div>
  <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin-bottom:24px;">
    <h2 style="color:#111827;font-size:18px;margin:0 0 16px;">What's running right now:</h2>
    <ul style="color:#374151;font-size:15px;line-height:1.8;margin:0;padding-left:20px;">
      <li>⚡ Instant lead response — every new lead gets a reply in under 60 seconds</li>
      <li>📞 Missed call text-back — no call ever goes unanswered</li>
      ${onboarding.followup_sequence_built ? '<li>🔁 Follow-up sequences — automated multi-step outreach</li>' : ''}
    </ul>
  </div>
  <div style="text-align:center;">
    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:16px 36px;font-weight:800;font-size:16px;text-decoration:none;">
      View Your Dashboard →
    </a>
  </div>
  <p style="color:#9CA3AF;font-size:13px;text-align:center;margin-top:24px;">
    Need anything? Reply to this email — Nolan reads every one.
  </p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: onboarding.email,
        subject: `🚀 You're Live! ${onboarding.business_name || "Your"} AI System is Running`,
        html,
      }),
    });

    if (!res.ok) throw new Error(`Resend ${res.status}`);

    await base44.asServiceRole.entities.AgentLog.create({
      agent_name: "Agent Smith", log_type: "INFO",
      summary: `Sent went_live email to ${onboarding.email}`,
      service: "sendWentLiveEmail", requires_nolan: false, resolved: true,
    });

    return Response.json({ success: true, email: onboarding.email });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
