import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "system@clientsurgesystems.com";
const FROM_EMAIL = "ClientSurge Systems <system@clientsurgesystems.com>";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "support@clientsurgesystems.com";
const SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "(602) 584-3227";

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

function emailShell(input: {
  badge: string;
  title: string;
  subtitle: string;
  body: string;
  footer?: string;
  logoUrl?: string;
}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.subtitle)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(input.badge)}</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">${escapeHtml(input.title)}</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">${escapeHtml(input.subtitle)}</p>${input.body}</td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">ClientSurge Systems</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">${input.footer || `Reply to this email or contact ${SUPPORT_EMAIL}. ${SUPPORT_PHONE} · Phoenix, Arizona`}</p></div></td></tr></table></td></tr></table></body></html>`;
}

function actionCard(title: string, body: string) {
  return `<td style="width:33.33%;padding:0 6px;vertical-align:top;"><div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 18px;min-height:118px;"><div style="width:34px;height:34px;border-radius:999px;background:${THEME.soft};color:${THEME.deep};line-height:34px;text-align:center;font-weight:900;">✓</div><h2 style="margin:13px 0 6px 0;color:#000;font-size:16px;line-height:21px;font-weight:900;">${escapeHtml(title)}</h2><p style="margin:0;color:${THEME.muted};font-size:13px;line-height:20px;">${escapeHtml(body)}</p></div></td>`;
}

function buildClientWelcomeEmail(input: { clientName: string; businessName: string; portalUrl: string; logoUrl?: string }) {
  const body = `<p style="margin:0 0 10px 0;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hi ${escapeHtml(input.clientName)},</p><div style="margin-top:24px;background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Account Created</div><p style="margin:10px 0 0;color:#000;font-size:15px;line-height:24px;font-weight:700;">Your ClientSurge account for <strong>${escapeHtml(input.businessName)}</strong> is ready. Your automation setup is moving into the onboarding workflow.</p></div><table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${escapeHtml(input.portalUrl)}" style="display:inline-block;padding:15px 23px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">Access Your Client Portal →</a></td></tr></table><div style="margin-top:24px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Inside your portal</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${actionCard("Track Progress", "See where your system is in the build process.")}${actionCard("Message Support", "Communicate directly with the setup team.")}${actionCard("Manage Plan", "Review your plan, status, and next steps.")}</tr></table></div><div style="margin-top:24px;background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Expected Response</div><p style="margin:9px 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">Our team will review your details and follow up within 24 hours to move the setup forward.</p></div>`;
  return emailShell({ badge: "Portal Ready", title: "Welcome to ClientSurge Systems.", subtitle: "Your account is created and your automation setup is moving into the build workflow.", body, logoUrl: input.logoUrl });
}

function buildAdminAccountEmail(input: { clientName: string; businessName: string; clientEmail: string; createdAt: string; logoUrl?: string }) {
  const body = `<div style="margin-top:24px;background:${THEME.soft};border:1px solid ${THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">New Account Created</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-collapse:collapse;"><tr><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};width:34%;color:${THEME.muted};font-size:13px;font-weight:800;">Name</td><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};color:#000;font-size:14px;font-weight:900;">${escapeHtml(input.clientName)}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};color:${THEME.muted};font-size:13px;font-weight:800;">Business</td><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};color:#000;font-size:14px;font-weight:900;">${escapeHtml(input.businessName)}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};color:${THEME.muted};font-size:13px;font-weight:800;">Email</td><td style="padding:10px 0;border-bottom:1px solid ${THEME.border};color:#000;font-size:14px;font-weight:900;"><a href="mailto:${escapeHtml(input.clientEmail)}" style="color:${THEME.navy};text-decoration:none;font-weight:900;">${escapeHtml(input.clientEmail)}</a></td></tr><tr><td style="padding:10px 0;color:${THEME.muted};font-size:13px;font-weight:800;">Time</td><td style="padding:10px 0;color:#000;font-size:14px;font-weight:900;">${escapeHtml(input.createdAt)} AZ</td></tr></table></div><div style="margin-top:20px;background:#ffffff;border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:18px 20px;"><p style="margin:0;color:#000;font-size:14px;line-height:23px;font-weight:700;">A Client record, ClientProject, and portal invitation have been created. Follow up within 24 hours.</p></div>`;
  return emailShell({ badge: "Admin Alert", title: "New client account created.", subtitle: "A new portal account entered the ClientSurge setup workflow.", body, logoUrl: input.logoUrl, footer: "Internal setup alert · system@clientsurgesystems.com" });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return secureJson({ error: "Method not allowed" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== "admin") return secureJson({ error: "Forbidden: Admin only" }, { status: 403 });

    if (!RESEND_API_KEY) return secureJson({ error: "RESEND_API_KEY not configured" }, { status: 500 });

    const { client_name, client_email, business_name } = await req.json();
    if (!client_name || !client_email || !business_name) return secureJson({ error: "client_name, client_email, and business_name are required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) return secureJson({ error: "client_email must be valid" }, { status: 400 });

    const portalUrl = "https://clientsurgesystems.com/client-portal";
    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";
    const createdAt = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });

    const clientHtml = buildClientWelcomeEmail({ clientName: client_name, businessName: business_name, portalUrl, logoUrl });
    const adminHtml = buildAdminAccountEmail({ clientName: client_name, businessName: business_name, clientEmail: client_email, createdAt, logoUrl });

    const [clientRes, adminRes] = await Promise.all([
      resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [client_email], subject: `Welcome to ClientSurge Systems, ${client_name}`, html: clientHtml }),
      }),
      resendFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject: `New Account: ${client_name} — ${business_name}`, html: adminHtml }),
      }),
    ]);

    const clientData = await clientRes.json();
    const adminData = await adminRes.json();
    if (!clientRes.ok) throw new Error(`Resend client email failed: ${JSON.stringify(clientData)}`);
    if (!adminRes.ok) throw new Error(`Resend admin email failed: ${JSON.stringify(adminData)}`);

    return secureJson({ success: true, client_email_id: clientData.id, admin_email_id: adminData.id });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});
