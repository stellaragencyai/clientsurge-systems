import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  getPackageOffer,
  getPackageDisplayLabel,
  normalizePackageKey,
} from "../../../src/lib/salesCatalog.js";
import { formatMoney, resolveServiceRows } from "./serviceRows.shared.js";
import {
  sendCommunicationViaOutbox,
  sendResendEmailProvider,
} from "../_shared/communicationOutbox.js";
import { buildAppUrl } from "../_shared/appUrl.js";

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
  if (email.includes("<") && email.includes(">")) {
    return email;
  }
  return `ClientSurge Systems <${email}>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, portal_activation_url } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const from = formatFromAddress(Deno.env.get("RESEND_FROM_EMAIL"));
    const replyTo = Deno.env.get("ADMIN_EMAIL") || "system@clientsurgesystems.com";

    const customerEmail = order.customer_email || "";
    if (!customerEmail) {
      return Response.json({ error: "Order missing customer_email" }, { status: 400 });
    }

    const packageOffer =
      getPackageOffer(order.pricing_summary?.package_key || order.package_key) ||
      getPackageOffer(normalizePackageKey(order.package_type)) ||
      null;
    const packageLabel =
      packageOffer?.name ||
      order.plan_type ||
      getPackageDisplayLabel(order.pricing_summary) ||
      "Custom Service Bundle";
    const portalUrl =
      portal_activation_url ||
      buildAppUrl("/client-portal");
    const customerName = escapeHtml(order.customer_name || "there");
    const businessName = escapeHtml(order.business_name || "your business");
    const serviceRows = resolveServiceRows(order, packageOffer);
    const serviceList = serviceRows
      .map(
        (service) =>
          `<li style="margin-bottom:8px;color:#374151;"><strong>${escapeHtml(service.name)}</strong> - $${formatMoney(service.setup_fee)} setup / $${formatMoney(service.monthly_fee)}/mo</li>`
      )
      .join("");
    const textServiceList = serviceRows
      .map(
        (service) =>
          `- ${service.name}: $${formatMoney(service.setup_fee)} setup / $${formatMoney(service.monthly_fee)}/mo`
      )
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
      "What happens next:",
      "Your order has been recorded and linked into our install workflow. You'll receive your portal access and setup guidance as that workflow progresses.",
      "",
      `Open Client Portal: ${portalUrl}`,
      "",
      "Questions? Reply to this email and our team will help.",
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#111827;">
        <h1 style="margin:0 0 12px;font-size:28px;color:#0F172A;">Your ClientSurge order is confirmed</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hi ${customerName}, thanks for choosing ClientSurge for <strong>${businessName}</strong>.</p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0369A1;">Package</p>
          <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0F172A;">${escapeHtml(packageLabel)}</p>
          <p style="margin:0 0 6px;font-size:14px;color:#334155;">Setup total: <strong>$${formatMoney(order.total_setup)}</strong></p>
          <p style="margin:0;font-size:14px;color:#334155;">Monthly total: <strong>$${formatMoney(order.total_monthly)}/mo</strong></p>
        </div>
        <div style="margin-bottom:20px;">
          <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0F172A;">Included services</p>
          <ul style="margin:0;padding-left:20px;">${serviceList}</ul>
        </div>
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#1D4ED8;">What happens next</p>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#1E3A8A;">Your order has been recorded and linked into our install workflow. You'll receive your portal access and setup guidance as that workflow progresses.</p>
          <a href="${portalUrl}" style="display:inline-block;margin-top:8px;background:#0F172A;color:#FFFFFF;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;">Open Client Portal</a>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">Questions? Reply to this email and our team will help.</p>
      </div>
    `;

    const result = await sendCommunicationViaOutbox({
      base44,
      channel: "email",
      provider: "resend",
      recipient: customerEmail,
      subject: `Order confirmed - ${packageLabel}`,
      body: text,
      html,
      from,
      orderId: order.id,
      source: "sendOrderConfirmationEmail",
      sourceRecordId: order.id,
      templateKey: "order_confirmation",
      messageType: "transactional",
      consentBasis: "transactional_relationship",
      metadata: { reply_to: replyTo, package_label: packageLabel, portal_activation_url_present: Boolean(portal_activation_url) },
      providerSend: (providerPayload) => sendResendEmailProvider({
        ...providerPayload,
        env: (name) => Deno.env.get(name),
        fetchImpl: fetch,
      }),
    });

    if (!result.success) {
      console.error("[sendOrderConfirmationEmail] Resend request failed", {
        reason: result.reason || result.error || result.status,
        from,
        reply_to: replyTo,
        to: customerEmail,
      });
      throw new Error(`Resend request failed: ${result.reason || result.error || result.status}`);
    }

    return Response.json({ success: true, sent_to: customerEmail, email_id: result.provider_message_id, outbox_id: result.outbox?.id });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
