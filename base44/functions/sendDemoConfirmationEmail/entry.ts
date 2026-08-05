import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function buildBrandedEmail(heading, body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif}.container{max-width:600px;margin:0 auto;background:#FFF}.header{background:linear-gradient(135deg,#003B8F 0%,#006BB0 52%,#00AEEF 100%);padding:32px 24px;text-align:center}.logo{font-size:24px;font-weight:900;color:#FFF;margin:0}.content{padding:32px 24px;color:#1F2937}h1{margin:0 0 16px;font-size:28px;font-weight:900;color:#0A0F1E;font-family:'Montserrat',Arial,sans-serif}p{line-height:1.6;margin:16px 0;color:#374151}.footer{padding:24px;text-align:center;border-top:1px solid #E5E7EB;color:#6B7280;font-size:13px}</style></head><body><div class="container"><div class="header"><p class="logo">ClientSurge</p></div><div class="content"><h1>${heading}</h1>${body}</div><div class="footer"><p>© 2026 ClientSurge Systems</p></div></div></body></html>`;
}

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

/**
 * sendDemoConfirmationEmail
 * Formats scheduled_date/time in Arizona local time for all emails.
 * Uses safeResendFrom() for consistent sender formatting.
 */

function buildScheduledDateTime(payload) {
  if (payload.scheduled_datetime) return String(payload.scheduled_datetime);
  if (payload.scheduled_date && payload.scheduled_time) {
    return `${payload.scheduled_date}T${payload.scheduled_time}:00`;
  }
  return "";
}

function formatAZTime(isoStr) {
  if (!isoStr) return "TBD";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " (Arizona time)";
}

function auditCopyForIndustry(industrySlug) {
  const slug = String(industrySlug || "").toLowerCase();

  if (slug === "med_spa" || slug === "med-spa") {
    return {
      subjectPrefix: "Med Spa Automation Audit confirmed",
      heading: "Your Med Spa Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review consult requests, aesthetic treatment inquiries, missed DMs and calls, booking handoff, and nurture before the appointment.",
    };
  }

  if (slug === "plumbing") {
    return {
      subjectPrefix: "Plumbing Automation Audit confirmed",
      heading: "Your Plumbing Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided. The audit takes about 15 minutes, and we will review emergency leak calls, drain repair requests, water heater inquiries, missed-call recovery, after-hours capture, and dispatch handoff.",
    };
  }

  if (slug === "dental") {
    return {
      subjectPrefix: "Dental Automation Audit confirmed",
      heading: "Your Dental Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided for your dental automation audit. The audit takes about 15 minutes, and we will review missed new-patient calls, appointment request routing, front desk overload, website lead capture, and patient follow-up.",
    };
  }

  if (slug === "roofing") {
    return {
      subjectPrefix: "Roofing Automation Audit confirmed",
      heading: "Your Roofing Automation Audit is confirmed",
      body: "Nolan will call you at the number you provided for your roofing automation audit. The audit takes about 15 minutes, and we will review missed calls, quote requests, estimate follow-up, and booked inspection handoff.",
    };
  }

  if (slug === "hvac") {
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

    const { email, business_name } = payload;
    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "No Resend key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formatted = formatAZTime(buildScheduledDateTime(payload));
    const auditCopy = auditCopyForIndustry(String(payload.industry_slug || ""));

    const emailHtml = buildBrandedEmail(
      auditCopy.heading,
      `<p><strong>📅 ${formatted}</strong></p><p>${auditCopy.body}</p><p>Need to reschedule? Just reply to this email.</p>`
    );

    const response = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: safeResendFrom(),
        reply_to: "nolan@clientsurgesystems.com",
        to: email,
        subject: `${auditCopy.subjectPrefix} - ${formatted}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || "Email send failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sent_to: email, formatted_time: formatted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});