import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { buildSignedSetupUrl } from '../_shared/setupLinkToken.ts';

const PACKAGE_CATALOG = {
  starter_system: { name: "Starter System", setup_total: 797, monthly_total: 497 },
  growth_system: { name: "Growth System", setup_total: 1297, monthly_total: 997 },
  pro_system: { name: "Pro System", setup_total: 2497, monthly_total: 1997 },
};

function resolvePackageKey(raw) {
  if (!raw) return null;
  const k = String(raw).toLowerCase().trim();
  if (k.includes("pro") || k.includes("elite")) return "pro_system";
  if (k.includes("growth")) return "growth_system";
  if (k.includes("starter")) return "starter_system";
  return PACKAGE_CATALOG[k] ? k : null;
}
function getPackageOffer(key) {
  const resolved = resolvePackageKey(key);
  return resolved ? { ...PACKAGE_CATALOG[resolved], package_key: resolved } : null;
}
function formatMoney(value) {
  const num = Number(value || 0);
  return num % 1 === 0 ? String(Math.round(num)) : num.toFixed(2);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function resolveServiceRows(order, packageOffer) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item) => ({ name: item.product_name || item.service_key || "Service", setup_fee: item.setup_fee || 0, monthly_fee: item.monthly_fee || 0 }));
  }
  if (packageOffer) return [{ name: packageOffer.name, setup_fee: order.total_setup || packageOffer.setup_total, monthly_fee: order.total_monthly || packageOffer.monthly_total }];
  return [];
}
function getAppUrl() {
  return Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com";
}

const TIER_MESSAGING = {
  starter_system: { activation_copy: "Your 2 AI automation systems are activating — Instant Lead Response and Missed Call Text-Back.", timeline: "Systems are typically live within 48–72 hours." },
  growth_system: { activation_copy: "Your 4 AI automation systems are activating — Lead Response, Missed Call Text-Back, 14-Day Nurture, and AI Booking Agent.", timeline: "Systems are typically live within 48–72 hours." },
  pro_system: { activation_copy: "Your complete AI automation stack is activating — all 6 systems including Lead Response, Missed Call, Nurture, Booking Agent, Lead Reactivation, and Review Requests.", timeline: "Your Pro setup includes a custom AI-built website. Full system goes live within 5–7 business days." },
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, portal_activation_url } = await req.json().catch(() => ({}));
    if (!order_id) return Response.json({ error: "order_id required", request_id: requestId }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found", request_id: requestId }, { status: 404 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return Response.json({ error: "RESEND_API_KEY missing", request_id: requestId }, { status: 500 });

    const fromRaw = Deno.env.get("RESEND_FROM_EMAIL") || "system@clientsurgesystems.com";
    const from = fromRaw.includes("<") ? fromRaw : `ClientSurge Systems <${fromRaw}>`;
    const supportEmail = Deno.env.get("CLIENTSURGE_SUPPORT_EMAIL") || "support@clientsurgesystems.com";
    const replyTo = Deno.env.get("ADMIN_EMAIL") || supportEmail;
    const customerEmail = order.customer_email;
    if (!customerEmail) return Response.json({ error: "Order missing customer_email", request_id: requestId }, { status: 400 });

    const pkgKey = resolvePackageKey(order.package_key || order.package_type || order.selected_package_type || order.pricing_summary?.package_key);
    const packageOffer = getPackageOffer(pkgKey);
    const packageLabel = packageOffer?.name || order.plan_type || "Service Bundle";
    const appUrl = getAppUrl();
    const portalUrl = portal_activation_url || `${appUrl}/client-portal`;
    const credentialsUrl = await buildSignedSetupUrl(appUrl, order.id, customerEmail);
    const customerName = escapeHtml(order.customer_name || "there");
    const businessName = escapeHtml(order.business_name || "your business");
    const serviceRows = resolveServiceRows(order, packageOffer);
    const tierMsg = TIER_MESSAGING[pkgKey] || TIER_MESSAGING.starter_system;

    const serviceListHtml = serviceRows.map((svc) => `<li style="margin-bottom:8px;color:#374151;"><strong>${escapeHtml(svc.name)}</strong>${svc.setup_fee > 0 || svc.monthly_fee > 0 ? ` — $${formatMoney(svc.setup_fee)} setup / $${formatMoney(svc.monthly_fee)}/mo` : ""}</li>`).join("");
    const serviceListText = serviceRows.map((svc) => `- ${svc.name}${svc.setup_fee > 0 || svc.monthly_fee > 0 ? `: $${formatMoney(svc.setup_fee)} setup / $${formatMoney(svc.monthly_fee)}/mo` : ""}`).join("\n");

    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:28px;color:#0F172A;">Your ClientSurge order is confirmed ✅</h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hi ${customerName}, thanks for choosing ClientSurge for <strong>${businessName}</strong>.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0369A1;">Package</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0F172A;">${escapeHtml(packageLabel)}</p>
        ${order.total_setup ? `<p style="margin:0 0 6px;font-size:14px;color:#334155;">Setup: <strong>$${formatMoney(order.total_setup)}</strong></p>` : ""}
        ${order.total_monthly ? `<p style="margin:0;font-size:14px;color:#334155;">Monthly: <strong>$${formatMoney(order.total_monthly)}/mo</strong></p>` : ""}
      </div>
      ${serviceListHtml ? `<div style="margin-bottom:20px;"><p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0F172A;">Included services</p><ul style="margin:0;padding-left:20px;">${serviceListHtml}</ul></div>` : ""}
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#1D4ED8;">What happens next</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1E3A8A;">${tierMsg.activation_copy}</p>
        <p style="margin:0 0 14px;font-size:13px;color:#1E3A8A;opacity:0.8;">${tierMsg.timeline}</p>
        <a href="${credentialsUrl}" style="display:inline-block;background:#0F172A;color:#FFFFFF;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;">Complete Setup →</a>
        <a href="${portalUrl}" style="display:inline-block;background:transparent;border:1px solid #BFDBFE;color:#1D4ED8;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:600;font-size:13px;">Client Portal</a>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">Questions? Reply to this email or contact <a href="mailto:${supportEmail}" style="color:#0369A1;text-decoration:none;font-weight:700;">${supportEmail}</a> and our team will help.</p>
    </div>`;

    const text = [`Hi ${order.customer_name || "there"},`, "", `Your ClientSurge order for ${order.business_name || "your business"} is confirmed.`, "", `Package: ${packageLabel}`, order.total_setup ? `Setup: $${formatMoney(order.total_setup)}` : "", order.total_monthly ? `Monthly: $${formatMoney(order.total_monthly)}/mo` : "", "", "Included services:", serviceListText || "- Service bundle", "", "What happens next:", tierMsg.activation_copy, tierMsg.timeline, "", `Complete Setup: ${credentialsUrl}`, `Open Client Portal: ${portalUrl}`, "", `Questions? Contact ${supportEmail}`].filter((l) => l !== null).join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, reply_to: replyTo, to: customerEmail, subject: `Order confirmed — ${packageLabel} | ClientSurge`, html, text }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => response.status);
      console.error("[sendOrderConfirmationEmail] Resend failed:", errText, `request_id=${requestId}`);
      throw new Error(`Resend error: ${response.status} ${errText}`);
    }

    console.log("[sendOrderConfirmationEmail] Sent to:", customerEmail, "Package:", packageLabel, `request_id=${requestId}`);
    return Response.json({ success: true, request_id: requestId, sent_to: customerEmail });
  } catch (err) {
    console.error("[sendOrderConfirmationEmail]", err.message, `request_id=${requestId}`);
    return Response.json({ error: err.message, request_id: requestId }, { status: 500 });
  }
});
