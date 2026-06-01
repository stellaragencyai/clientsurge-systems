import { secureJson } from "../_shared/response.ts";
/**
 * sendNPSSurvey — #117
 * Triggered 7 days after order_status = "fully_live".
 * Sends 1-question NPS email.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { formatFromAddress, getReviewFromEmail, getSupportReplyTo } from "../_shared/emailConfig.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order?.client_email) return secureJson({ error: "No client email" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    const scores = [1,2,3,4,5,6,7,8,9,10];
    const scoreLinks = scores.map(s =>
      `<a href="https://clientsurgesystems.com/nps?order_id=${order_id}&score=${s}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:${s >= 9 ? '#00FFB3' : s >= 7 ? '#F59E0B' : '#EF4444'}22;border:1.5px solid ${s >= 9 ? '#00FFB3' : s >= 7 ? '#F59E0B' : '#EF4444'}60;color:#0A0F1E;font-weight:800;font-size:13px;text-decoration:none;margin:2px;">${s}</a>`
    ).join(" ");

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: formatFromAddress(getReviewFromEmail()),
        reply_to: getSupportReplyTo(),
        to: order.client_email,
        subject: "Quick question about your ClientSurge experience 🙏",
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:18px;font-weight:800">How likely are you to recommend us?</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6">Hey ${order.client_name || "there"}, your system has been live for a week — we'd love to know how it's going.</p>
          <p style="color:#374151;font-size:14px"><b>On a scale of 1–10, how likely are you to recommend ClientSurge Systems to another business owner?</b></p>
          <div style="margin:24px 0;display:flex;flex-wrap:wrap;gap:4px">${scoreLinks}</div>
          <p style="color:#6B7280;font-size:11px;margin-top:16px">1 = Not at all · 10 = Definitely would</p>
          <p style="color:#6B7280;font-size:13px;margin-top:24px">Reply to this email with any feedback and our support team will review it.</p>
        </div>`,
      }),
    });

    await base44.asServiceRole.entities.Order.update(order_id, { nps_sent_at: new Date().toISOString() });
    return secureJson({ success: true, sent_to: order.client_email });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
