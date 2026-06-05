import { secureJson } from "../_shared/response.ts";
/**
 * sendDemoConfirmationEmail — #132
 * Formats scheduled_date/time in Arizona local time for all emails.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

function buildScheduledDateTime(payload: Record<string, unknown>) {
  if (payload.scheduled_datetime) return String(payload.scheduled_datetime);
  if (payload.scheduled_date && payload.scheduled_time) {
    return `${payload.scheduled_date}T${payload.scheduled_time}:00`;
  }
  return "";
}

function formatAZTime(isoStr: string): string {
  if (!isoStr) return "TBD";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " (Arizona time)";
}

function auditCopyForIndustry(industrySlug = "") {
  if (industrySlug === "dental") {
    return {
      subjectPrefix: "Dental Automation Audit confirmed",
      heading: "Your Dental Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review missed new-patient calls, appointment request routing, front desk overload, website lead capture, and patient follow-up.",
    };
  }

  if (industrySlug === "roofing") {
    return {
      subjectPrefix: "Roofing Automation Audit confirmed",
      heading: "Your Roofing Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review missed calls, quote requests, estimate follow-up, and booked inspection handoff.",
    };
  }

  if (industrySlug === "hvac") {
    return {
      subjectPrefix: "HVAC Automation Audit confirmed",
      heading: "Your HVAC Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review missed-call text-back, emergency AC repair and heating/cooling lead response, after-hours capture, seasonal surge handling, and the path from service request to booked appointment.",
    };
  }

  return {
    subjectPrefix: "Free Automation Audit confirmed",
    heading: "Your Free Automation Audit is confirmed",
    body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review the highest-friction parts of your lead capture, follow-up, and booking path.",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { lead_id, business_name, email } = payload;
    if (!email) return secureJson({ error: "email required" }, { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "No Resend key" }, { status: 500 });

    const formatted = formatAZTime(buildScheduledDateTime(payload));
    const auditCopy = auditCopyForIndustry(String(payload.industry_slug || ""));

    await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "system@clientsurgesystems.com",
        reply_to: "nolan@clientsurgesystems.com",
        to: email,
        subject: `${auditCopy.subjectPrefix} - ${formatted}`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#fff">
          <h2 style="color:#0A0F1E;font-size:18px;font-weight:800">${auditCopy.heading}</h2>
          <p style="color:#374151">Hey ${business_name || "there"},</p>
          <div style="background:#F0FDF4;border-radius:12px;padding:16px 20px;margin:20px 0;border-left:4px solid #00FFB3">
            <p style="color:#065F46;font-weight:700;font-size:15px;margin:0">📅 ${formatted}</p>
          </div>
          <p style="color:#374151;font-size:14px">${auditCopy.body}</p>
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
