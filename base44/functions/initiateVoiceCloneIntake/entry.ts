/**
 * initiateVoiceCloneIntake — #423
 * Elite perk #3. After Elite payment, emails client a Retell voice recording link.
 * Instructs them to record 3 sentences for voice cloning.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order || order.package_key !== "elite") {
      return Response.json({ error: "Elite tier only" }, { status: 403 });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!order.client_email || !resendKey) {
      return Response.json({ error: "No client email or Resend key" }, { status: 400 });
    }

    const retellLink = "https://app.retellai.com/voice-clone"; // Retell voice clone intake URL

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: order.client_email,
        subject: "🎙️ Set up your AI voice (Elite perk) — takes 2 minutes",
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#fff;">
          <h2 style="color:#0A0F1E;font-size:20px;font-weight:800;margin:0 0 8px">Set up your AI voice 🎙️</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6">Hey ${order.client_name || "there"},</p>
          <p style="color:#374151;font-size:15px;line-height:1.6">As an Elite client, your AI will respond to leads in <b>your own voice</b> — not a generic robot. It takes about 2 minutes to set up.</p>
          <p style="color:#374151;font-size:15px;line-height:1.6"><b>Here's what to do:</b></p>
          <ol style="color:#374151;font-size:14px;line-height:2">
            <li>Click the link below</li>
            <li>Record yourself saying 3 short sentences (we'll send you the script)</li>
            <li>Submit — we handle the rest</li>
          </ol>
          <div style="text-align:center;margin:28px 0">
            <a href="${retellLink}" style="display:inline-block;background:linear-gradient(135deg,#00D4FF,#00FFB3);color:#0A0F1E;border-radius:9999px;padding:14px 32px;font-size:15px;font-weight:800;text-decoration:none">
              Record My Voice →
            </a>
          </div>
          <p style="color:#6B7280;font-size:13px">This is completely optional — if you prefer, we'll use a professional AI voice instead. Just reply and let us know.</p>
        </div>`,
      }),
    });

    await base44.asServiceRole.entities.Order.update(order_id, {
      voice_clone_intake_sent_at: new Date().toISOString(),
      voice_clone_status: "intake_sent",
    });

    return Response.json({ success: true, sent_to: order.client_email });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
