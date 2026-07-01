import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resendFetch } from "../_shared/resendFetch.js";
import {
  getPackageOffer,
  getPackageDisplayLabel,
  normalizePackageKey,
} from "../../../src/lib/salesCatalog.js";
import { formatMoney, resolveServiceRows } from "./serviceRows.shared.js";
import { buildAppUrl } from "../_shared/appUrl.js";

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

function formatFromAddress(value: string | undefined | null) {
  const email = String(value || "noreply@clientsurgesystems.com").trim();
  if (email.includes("<") && email.includes(">")) return email;
  return `ClientSurge Systems <${email}>`;
}

function logoLockup(logoUrl?: string) {
  const src = escapeHtml(logoUrl || "");
  const mark = src
    ? `<img src="${src}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${THEME.electric};">Systems</span></div><div style="margin-top:5px;color:${THEME.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function moneyCard(label: string, value: string) {
  return `<td style="width:50%;padding:0 6px;vertical-align:top;"><div style="background:${THEME.soft};border:1px solid ${THEME.border};border-radius:16px;padding:17px 16px;"><div style="color:${THEME.muted};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</div><div style="margin-top:7px;color:#000000;font-size:20px;line-height:25px;font-weight:900;">${escapeHtml(value)}</div></div></td>`;
}

function serviceCards(serviceRows: Array<{ name: string; setup_fee: number; monthly_fee: number }>) {
  if (!serviceRows.length) {
    return `<div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:18px 20px;color:#000;font-size:14px;line-height:22px;font-weight:700;">Service bundle confirmed.</div>`;
  }
  return serviceRows
    .map((service, index) => `<div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:17px 18px;margin-top:${index === 0 ? "0" : "10px"};"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Included Service</div><div style="margin-top:6px;color:#000;font-size:16px;line-height:22px;font-weight:900;">${escapeHtml(service.name)}</div><div style="margin-top:5px;color:${THEME.muted};font-size:13px;line-height:20px;font-weight:700;">$${formatMoney(service.setup_fee)} setup / $${formatMoney(service.monthly_fee)}/mo</div></div>`)
    .join("");
}

function buildOrderConfirmationHtml(input: {
  customerName: string;
  businessName: string;
  packageLabel: string;
  setupTotal: string;
  monthlyTotal: string;
  portalUrl: string;
  supportEmail: string;
  serviceRows: Array<{ name: string; setup_fee: number; monthly_fee: number }>;
  logoUrl?: string;
}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Your ClientSurge order is confirmed</title></head><body style="margin:0;padding:0;background:${THEME.page};color:#000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your ClientSurge order is confirmed and moving into installation.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${THEME.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#fff;border:1px solid ${THEME.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${THEME.deep},${THEME.electric},${THEME.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${THEME.border};background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle;">${logoLockup(input.logoUrl)}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${THEME.soft};color:${THEME.navy};border:1px solid ${THEME.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">Order Confirmed</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><p style="margin:0 0 10px;color:${THEME.muted};font-size:15px;line-height:22px;font-weight:650;">Hi ${escapeHtml(input.customerName)},</p><h1 style="margin:0;color:#000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">Your ClientSurge order is confirmed.</h1><p style="margin:14px 0 0;color:#262626;font-size:17px;line-height:27px;font-weight:500;">Thanks for choosing ClientSurge for <strong>${escapeHtml(input.businessName)}</strong>. Your package is now recorded and moving into the installation workflow.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${THEME.deep}" style="border-radius:999px;background:linear-gradient(90deg,${THEME.deep},${THEME.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${escapeHtml(input.portalUrl)}" style="display:inline-block;padding:15px 23px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">Open Client Portal →</a></td></tr></table></td></tr><tr><td style="padding:24px 26px 0;"><div style="background:#ffffff;border:1px solid ${THEME.border};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">Package</div><div style="margin-top:7px;color:#000;font-size:24px;line-height:30px;font-weight:900;">${escapeHtml(input.packageLabel)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse;"><tr>${moneyCard("Setup Total", `$${input.setupTotal}`)}${moneyCard("Monthly", `$${input.monthlyTotal}/mo`)}</tr></table></div></td></tr><tr><td style="padding:24px 32px 0;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:12px;">Included Services</div>${serviceCards(input.serviceRows)}</td></tr><tr><td style="padding:24px 32px 0;"><div style="background:${THEME.soft};border:1px solid ${THEME.border};border-left:6px solid ${THEME.electric};border-radius:16px;padding:20px 22px;"><div style="color:${THEME.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">What happens next</div><p style="margin:10px 0 0;color:#000;font-size:14px;line-height:23px;font-weight:700;">Your order has been linked into the install workflow. You will receive portal access and setup guidance as the team prepares your automation system.</p></div></td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000;border-radius:16px;padding:20px 22px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#fff;font-size:15px;line-height:22px;font-weight:900;">Need help?</p><p style="margin:8px 0 0;color:#DFF6FF;font-size:13px;line-height:20px;">Reply to this email or contact <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#fff;text-decoration:underline;font-weight:900;">${escapeHtml(input.supportEmail)}</a>. ClientSurge Systems · Phoenix, Arizona</p></div></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, portal_activation_url } = await req.json();

    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return secureJson({ error: "RESEND_API_KEY missing" }, { status: 500 });

    const from = formatFromAddress(Deno.env.get("RESEND_FROM_EMAIL"));
    const supportEmail = Deno.env.get("RESEND_REPLY_TO_SUPPORT") || Deno.env.get("SUPPORT_EMAIL") || "support@clientsurgesystems.com";
    const replyTo = Deno.env.get("ADMIN_EMAIL") || supportEmail;
    const customerEmail = order.customer_email || "";
    if (!customerEmail) return secureJson({ error: "Order missing customer_email" }, { status: 400 });

    const packageOffer =
      getPackageOffer(order.pricing_summary?.package_key || order.package_key) ||
      getPackageOffer(normalizePackageKey(order.package_type)) ||
      null;
    const packageLabel = packageOffer?.name || order.plan_type || getPackageDisplayLabel(order.pricing_summary) || "Custom Service Bundle";
    const portalUrl = portal_activation_url || buildAppUrl("/client-portal");
    const serviceRows = resolveServiceRows(order, packageOffer);
    const logoUrl = Deno.env.get("CLIENTSURGE_EMAIL_LOGO_URL") || Deno.env.get("CLIENTSURGE_LOGO_URL") || "";

    const textServiceList = serviceRows
      .map((service) => `- ${service.name}: $${formatMoney(service.setup_fee)} setup / $${formatMoney(service.monthly_fee)}/mo`)
      .join("\n");
    const text = [
      `Hi ${order.customer_name || "there"},`,
      "",
      `Your ClientSurge order for ${order.business_name || "your business"} is confirmed.`,
      "",
      `Package: ${packageLabel}`,
      `Setup total: $${formatMoney(order.total_setup)}`,
      `Monthly total: $${formatMoney(order.total_monthly)}/mo`,
      "",
      "Included services:",
      textServiceList || "- Service bundle",
      "",
      `Open Client Portal: ${portalUrl}`,
      "",
      `Questions? Reply to this email or contact ${supportEmail}.`,
    ].join("\n");

    const html = buildOrderConfirmationHtml({
      customerName: order.customer_name || "there",
      businessName: order.business_name || "your business",
      packageLabel,
      setupTotal: formatMoney(order.total_setup),
      monthlyTotal: formatMoney(order.total_monthly),
      portalUrl,
      supportEmail,
      serviceRows,
      logoUrl,
    });

    const response = await resendFetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, reply_to: replyTo, to: customerEmail, subject: `Order confirmed - ${packageLabel}`, text, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[sendOrderConfirmationEmail] Resend request failed", { status: response.status, from, reply_to: replyTo, order_id });
      throw new Error(`Resend request failed: ${response.status} ${body}`);
    }

    return secureJson({ success: true, sent_to: customerEmail });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
