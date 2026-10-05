import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { secureJson } from "../_shared/response.ts";

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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.subtitle)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(input.badge)}</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">${escapeHtml(input.title)}</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">${escapeHtml(input.subtitle)}</p>${input.body}</td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">Need anything before the call?</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email or call <a href="tel:+16025843227" style="color:#fff;text-decoration:underline;font-weight:900;">(602) 584-3227</a>. ClientSurge Systems · Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

function prepFocusForIndustry(industrySlug = "") {
  const slug = String(industrySlug || "").toLowerCase();
  if (slug === "roofing") return "storm leads, roof repair leads, quote requests, missed inspection requests, and estimate follow-up";
  if (slug === "hvac") return "after-hours AC/heating leads, emergency calls, appointment booking, seasonal demand spikes, and maintenance plan opportunities";
  if (slug === "dental") return "new-patient calls, appointment requests, front desk overload, recall/follow-up, and missed patient inquiries";
  if (slug === "med_spa" || slug === "med-spa") return "consultation requests, aesthetic treatment inquiries, missed DMs/calls, booking handoff, and lead nurture";
  if (slug === "plumbing") return "emergency leaks, drain repair, water heater calls, urgent missed calls, and dispatch handoff expectations";
  return "lead capture, follow-up, booking handoff, and missed-call recovery";
}

function prepItem(title: string, copy: string) {
  return `<div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;margin-top:10px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">${escapeHtml(title)}</div><p style="margin:8px 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">${escapeHtml(copy)}</p></div>`;
}

function buildPrepEmail(input: { fullName: string; businessName: string; formattedDate: string; formattedTime: string; prepFocus: string; logoUrl?: string }) {
  const body = `<p style="margin:0 0 10px;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hi <strong>${escapeHtml(input.fullName)}</strong>,</p><div style="margin-top:24px;background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Audit Schedule</div><p style="margin:10px 0 0;color:#000;font-size:20px;line-height:28px;font-weight:900;">${escapeHtml(input.formattedDate)}<br/>${escapeHtml(input.formattedTime)}</p></div><div style="margin-top:24px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Bring these 4 things</div>${prepItem("Booking Process", "Your current booking link or how appointments are currently scheduled.")}${prepItem("Lead Volume", "A rough sense of how many leads you receive in a normal month.")}${prepItem("Main Bottleneck", `The biggest issue you want fixed first for ${input.businessName || "your business"}.`)}${prepItem("Industry Context", `Any notes about ${input.prepFocus}.`)}</div><div style="margin-top:24px;background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">How we will use this</div><p style="margin:9px 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">We will tailor the audit around ${escapeHtml(input.prepFocus)}, then make the next steps specific to your business.</p></div>`;
  return emailShell({ badge: "Audit Prep", title: "How to prepare for your free automation audit.", subtitle: "A focused audit is only useful if we look at the right bottlenecks. Bring these details so the call becomes specific, not generic.", body, logoUrl: input.logoUrl });
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);
    const { email, full_name, business_name, scheduled_date, scheduled_time, industry_slug } = await req.json();

    if (!email || !full_name || !scheduled_date || !scheduled_time) return secureJson({ error: "Missing required fields" }, { status: 400 });

    const dateObj = new Date(`${scheduled_date}T12:00:00`);
    const formattedDate = dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const [hour, minute] = scheduled_time.split(":");
    const h = parseInt(hour, 10);
    const formattedTime = `${h > 12 ? h - 12 : h}:${minute} ${h >= 12 ? "PM" : "AM"} (Arizona Time)`;
    const prepFocus = prepFocusForIndustry(industry_slug);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return secureJson({ error: "Resend credentials not configured" }, { status: 500 });

    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";
    const emailBody = buildPrepEmail({ fullName: full_name, businessName: business_name || "your business", formattedDate, formattedTime, prepFocus, logoUrl });

    const response = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: safeResendFrom(), to: [email], subject: `How to prepare for your ${formattedDate} Free Automation Audit`, html: emailBody }),
    });

    const data = await response.json();
    if (!response.ok) return secureJson({ error: data.message || "Email send failed" }, { status: 500 });

    return secureJson({ success: true, email_id: data.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
