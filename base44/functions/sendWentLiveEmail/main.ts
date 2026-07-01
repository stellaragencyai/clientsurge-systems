import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

const THEME = { electric: "#00AEEF", deep: "#0088CC", navy: "#005691", page: "#F7FBFE", soft: "#EEF9FF", border: "#C9E7FB", muted: "#4B5563" };

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function logoLockup(logoUrl = "") {
  const src = escapeHtml(logoUrl);
  const mark = src ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />` : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function activeCard(title: string, copy: string) {
  return `<div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;margin-top:10px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Active System</div><div style="margin-top:7px;color:#000;font-size:16px;line-height:22px;font-weight:900;">${escapeHtml(title)}</div><p style="margin:6px 0 0;color:${THEME.muted};font-size:13px;line-height:20px;font-weight:700;">${escapeHtml(copy)}</p></div>`;
}

function buildWentLiveEmail(input: { businessName: string; portalUrl: string; followupActive: boolean; logoUrl?: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your AI system is live</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">System Live</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">Your AI system is officially live.</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">Your ClientSurge automation system is now running 24/7 for <strong>${escapeHtml(input.businessName || "your business")}</strong>.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${escapeHtml(input.portalUrl)}" style="display:inline-block;padding:15px 23px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">View Your Dashboard →</a></td></tr></table><div style="margin-top:24px;background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Live Status</div><p style="margin:10px 0 0;color:#000;font-size:15px;line-height:24px;font-weight:800;">The core automation layer is active. New leads and missed calls can now move through your ClientSurge response system.</p></div><div style="margin-top:24px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">What's running now</div>${activeCard("Instant Lead Response", "New leads get routed into a fast-response workflow.")}${activeCard("Missed Call Text-Back", "Missed calls can trigger automated follow-up instead of going cold.")}${input.followupActive ? activeCard("Follow-Up Sequences", "Multi-step outreach is active for ongoing lead nurture.") : ""}</div></td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">Need anything after launch?</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email. ClientSurge Systems · Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const onboarding_id = body.onboarding_id || body.data?.id || body.event?.entity_id;
    if (!onboarding_id) return secureJson({ error: "onboarding_id required" }, { status: 400 });
    const onboarding = await base44.asServiceRole.entities.ClientOnboarding.get(onboarding_id);
    if (!onboarding?.email) return secureJson({ error: "No email on onboarding record" }, { status: 400 });
    if (!onboarding.went_live) return secureJson({ skipped: true, reason: "went_live is not true" });
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const portalUrl = "https://clientsurgesystems.com/client-portal";
    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";
    const html = buildWentLiveEmail({ businessName: onboarding.business_name || "your business", portalUrl, followupActive: Boolean(onboarding.followup_sequence_built), logoUrl });
    const res = await resendFetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "ClientSurge Systems <system@clientsurgesystems.com>", reply_to: "nolan@clientsurgesystems.com", to: onboarding.email, subject: `${onboarding.business_name || "Your"} AI system is live`, html }) });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    await base44.asServiceRole.entities.AgentLog.create({ agent_name: "Agent Smith", log_type: "INFO", summary: `Sent went_live email to ${onboarding.email}`, service: "sendWentLiveEmail", requires_nolan: false, resolved: true });
    return secureJson({ success: true, email: onboarding.email });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
