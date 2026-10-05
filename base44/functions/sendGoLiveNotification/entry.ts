import { resendFetch } from "../_shared/resendFetch.js";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

const THEME = { electric: "#00AEEF", deep: "#0088CC", navy: "#005691", page: "#F7FBFE", soft: "#EEF9FF", border: "#C9E7FB", muted: "#4B5563" };

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatFromAddress(value) {
  const email = String(value || "system@clientsurgesystems.com").trim();
  if (email.includes("<") && email.includes(">")) return email;
  return `ClientSurge Systems <${email}>`;
}

function logoLockup(logoUrl = "") {
  const src = escapeHtml(logoUrl);
  const mark = src
    ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000;">ClientSurge <span style="color:${THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function buildLiveEmail({ customerName, businessName, portalUrl, logoUrl }) {
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your AI system is live</title></head><body style="margin:0;padding:0;background:${THEME.page};font-family:Inter,Arial,Helvetica,sans-serif;color:#000;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${THEME.page};"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};"><table role="presentation" width="100%"><tr><td>${logoLockup(logoUrl)}</td><td align="right"><span style="display:inline-block;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Fully Live</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><p style="margin:0 0 10px;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hey ${escapeHtml(customerName)},</p><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-.045em;">Your AI system is live.</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">Your ClientSurge automation system is fully active for <strong>${escapeHtml(businessName)}</strong> and ready to respond to leads 24/7.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,.36);"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:15px 23px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">Open Your Dashboard →</a></td></tr></table></td></tr><tr><td style="padding:24px 32px 0;"><div style="background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.09em;">What this means</div><p style="margin:10px 0 0;color:#000;font-size:15px;line-height:24px;font-weight:800;">Calls, form submissions, and inquiries can now be routed into the automation workflow so fewer opportunities sit untouched.</p></div></td></tr><tr><td style="padding:24px 32px 0;"><div style="background:#fff;border:1px solid ${THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.09em;">Next step</div><p style="margin:10px 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">Monitor the first live leads inside your dashboard. Reply to this email anytime if something looks off or you want changes.</p></div></td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">ClientSurge Systems</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email — Nolan reads every one. Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    await base44.asServiceRole.entities.Order.update(order_id, { pipeline_status: "Live", activation_completed_at: new Date().toISOString(), order_status: "fully_live" });

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003533494424", text: `@trinity\n\n🚀 <b>System Live!</b>\nClient: ${order.customer_name || "Unknown"}\nTier: ${order.package_type || order.selected_package_type || "—"}\nOrder: ${order_id}\nAll services confirmed active.`, parse_mode: "HTML" }),
      }).catch(() => {});
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const customerEmail = order.customer_email || order.client_email;
    const customerName = order.customer_name || order.client_name || "there";
    const businessName = order.business_name || order.company_name || "your business";
    const fromEmail = formatFromAddress(Deno.env.get("RESEND_FROM_EMAIL"));
    const portalUrl = order.dashboard_url || order.portal_url || "https://clientsurgesystems.com/client-portal";
    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";

    if (customerEmail && resendKey) {
      await resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, reply_to: "nolan@clientsurgesystems.com", to: customerEmail, subject: `You're Live — ${businessName} AI System is Running`, html: buildLiveEmail({ customerName, businessName, portalUrl, logoUrl }) }),
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.CommunicationEvent.create({ channel: "internal", direction: "system", event_type: "status_update", provider: "internal", status: "processed", subject: `System live: ${customerName}`, message_body: `Order ${order_id} went fully live`, metadata_json: JSON.stringify({ order_id, customer_name: customerName }) }).catch(() => {});
    return secureJson({ success: true, order_id, went_live_at: new Date().toISOString() });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
