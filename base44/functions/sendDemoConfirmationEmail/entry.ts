import { secureJson } from "../_shared/response.ts";
/**
 * sendDemoConfirmationEmail — #132
 * Formats scheduled_date/time in Arizona local time for all emails.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import { formatFromAddress, getLeadFromEmail, getLeadReplyTo } from "../_shared/emailConfig.js";

function formatAZTime(isoStr: string): string {
  if (!isoStr) return "TBD";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " (Arizona time)";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, scheduled_datetime, business_name, email } = await req.json();
    if (!email) return secureJson({ error: "email required" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    const formatted = formatAZTime(scheduled_datetime);

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: formatFromAddress(getLeadFromEmail()),
        reply_to: getLeadReplyTo(),
        to: email,
        subject: `✅ Demo confirmed — ${formatted}`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:18px;font-weight:800">Your demo is confirmed ✅</h2>
          <p style="color:#374151">Hey ${business_name || "there"},</p>
          <div style="background:#F0FDF4;border-radius:12px;padding:16px 20px;margin:20px 0;border-left:4px solid #00FFB3">
            <p style="color:#065F46;font-weight:700;font-size:15px;margin:0">📅 ${formatted}</p>
          </div>
          <p style="color:#374151;font-size:14px">Nolan will call you at the number you provided. The call takes about 20 minutes — we'll walk through exactly how the system works for your business.</p>
          <p style="color:#374151;font-size:14px">Need to reschedule? Just reply to this email.</p>
          <p style="color:#6B7280;font-size:13px">— Nolan @ ClientSurge Systems</p>
        </div>`,
      }),
    });

    return secureJson({ success: true, sent_to: email, formatted_time: formatted });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
