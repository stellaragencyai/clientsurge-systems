import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const THEME = {
  electric: "#00AEEF",
  deep: "#0088CC",
  navy: "#005691",
  page: "#F7FBFE",
  soft: "#EEF9FF",
  border: "#C9E7FB",
  text: "#000000",
  muted: "#4B5563",
};

function safeResendFrom() {
  const configured = String(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (configured && configured.includes("@")) {
    if (configured.includes("<")) return configured;
    return `ClientSurge Systems <${configured}>`;
  }
  return "ClientSurge Systems <system@clientsurgesystems.com>";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoLockup(logoUrl?: string) {
  const src = escapeHtml(logoUrl || "");
  const mark = src
    ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function emailShell(input: { badge: string; title: string; subtitle: string; body: string; logoUrl?: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.subtitle)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(input.badge)}</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">${escapeHtml(input.title)}</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">${escapeHtml(input.subtitle)}</p>${input.body}</td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">Questions before the audit?</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email directly. Nolan @ ClientSurge Systems · Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

function buildScheduledDateTime(payload: Record<string, unknown>) {
  if (payload.scheduled_datetime) return String(payload.scheduled_datetime);
  if (payload.scheduled_date && payload.scheduled_time) return `${payload.scheduled_date}T${payload.scheduled_time}:00`;
  return "";
}

function formatAZTime(isoStr: string) {
  if (!isoStr) return "TBD";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", { timeZone: "America/Phoenix", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " (Arizona time)";
}

function auditCopyForIndustry(industrySlug: unknown) {
  const slug = String(industrySlug || "").toLowerCase();
  if (slug === "med_spa" || slug === "med-spa") return { subjectPrefix: "Med Spa Automation Audit confirmed", heading: "Your Med Spa Automation Audit is confirmed", body: "We will review consult requests, treatment inquiries, missed DMs and calls, booking handoff, and nurture before the appointment." };
  if (slug === "plumbing") return { subjectPrefix: "Plumbing Automation Audit confirmed", heading: "Your Plumbing Automation Audit is confirmed", body: "We will review emergency leak calls, drain repair requests, water heater inquiries, missed-call recovery, after-hours capture, and dispatch handoff." };
  if (slug === "dental") return { subjectPrefix: "Dental Automation Audit confirmed", heading: "Your Dental Automation Audit is confirmed", body: "We will review missed new-patient calls, appointment request routing, front desk overload, website lead capture, and patient follow-up." };
  if (slug === "roofing") return { subjectPrefix: "Roofing Automation Audit confirmed", heading: "Your Roofing Automation Audit is confirmed", body: "We will review missed calls, quote requests, estimate follow-up, and booked inspection handoff." };
  if (slug === "hvac") return { subjectPrefix: "HVAC Automation Audit confirmed", heading: "Your HVAC Automation Audit is confirmed", body: "We will review missed-call text-back, emergency service lead response, after-hours capture, seasonal surge handling, and booked appointment handoff." };
  return { subjectPrefix: "Free Automation Audit confirmed", heading: "Your Free Automation Audit is confirmed", body: "We will review the highest-friction parts of your lead capture, follow-up, and booking path." };
}

function buildDemoConfirmationHtml(input: { businessName: string; formattedTime: string; auditBody: string; heading: string; logoUrl?: string }) {
  const body = `<p style="margin:0 0 10px;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hey ${escapeHtml(input.businessName || "there")},</p><div style="margin-top:24px;background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Scheduled Audit Time</div><p style="margin:10px 0 0;color:#000;font-size:20px;line-height:28px;font-weight:900;">${escapeHtml(input.formattedTime)}</p></div><div style="margin-top:24px;background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">What we'll review</div><p style="margin:10px 0 0;color:#000;font-size:15px;line-height:24px;font-weight:700;">${escapeHtml(input.auditBody)}</p></div><div style="margin-top:20px;background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;"><p style="margin:0;color:#000;font-size:14px;line-height:23px;font-weight:700;">Nolan will call you at the number you provided. The audit takes about 15 minutes. Need to reschedule? Reply to this email.</p></div>`;
  return emailShell({ badge: "Audit Confirmed", title: input.heading, subtitle: "Your automation audit is on the calendar. Here is exactly what happens next.", body, logoUrl: input.logoUrl });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { email, business_name } = payload;
    if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return new Response(JSON.stringify({ error: "No Resend key" }), { status: 500, headers: { "Content-Type": "application/json" } });

    const formatted = formatAZTime(buildScheduledDateTime(payload));
    const auditCopy = auditCopyForIndustry(payload.industry_slug);
    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";
    const html = buildDemoConfirmationHtml({ businessName: business_name || "there", formattedTime: formatted, auditBody: auditCopy.body, heading: auditCopy.heading, logoUrl });

    const response = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: safeResendFrom(), reply_to: "nolan@clientsurgesystems.com", to: email, subject: `${auditCopy.subjectPrefix} - ${formatted}`, html }),
    });

    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: data.message || "Email send failed" }), { status: 500, headers: { "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ success: true, sent_to: email, formatted_time: formatted }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
