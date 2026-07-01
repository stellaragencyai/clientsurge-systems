import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";
import {
  RESEND_TEMPLATE_ALIASES,
  clean,
  commonTemplateVariables,
  firstNameFrom,
  getFromEmail,
  labelPackage,
  logEmailEvent,
  renderMasterFallbackHtml,
  renderMasterFallbackText,
  sendClientSurgeResendTemplateEmail,
} from "../_shared/clientSurgeResendTemplates.ts";

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function formatCurrency(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0";
  return numeric.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const { order_id } = await req.json();
    if (!order_id) return secureJson({ error: "order_id required" }, { status: 400 });

    const order = await svc.entities.Order.get(order_id).catch(() => null);
    if (!order) return secureJson({ error: "Order not found" }, { status: 404 });

    const customerEmail = clean(order.customer_email || order.client_email);
    if (!customerEmail) return secureJson({ error: "No customer email on order" }, { status: 400 });

    const customerName = clean(order.customer_name || order.client_name || "there");
    const firstName = firstNameFrom(customerName);
    const businessName = clean(order.business_name || order.customer_name || "your business");
    const packageName = labelPackage(order.selected_package_type || order.package_type || order.plan_type || order.pricing_summary?.package_key || order.pricing_summary?.package_name || "ClientSurge System");
    const setupTotal = formatCurrency(order.total_setup || order.pricing_summary?.total_setup);
    const monthlyTotal = formatCurrency(order.total_monthly || order.pricing_summary?.total_monthly);
    const onboardingUrl = `https://clientsurgesystems.com/start?order_id=${encodeURIComponent(order_id)}`;
    const subject = "Your ClientSurge order is received — setup begins next";

    const rows = [
      ["Business", businessName],
      ["Package", packageName],
      ["Setup", `$${setupTotal}`],
      ["Monthly", `$${monthlyTotal}`],
      ["Reference", order_id],
    ];

    const fallbackHtml = renderMasterFallbackHtml({
      badge: "Order Received",
      headline: `${firstName}, your ClientSurge order is received.`,
      intro: "Your setup is moving into onboarding. Complete the secure checklist so we can start connecting the right systems.",
      ctaLabel: "Start Onboarding",
      ctaUrl: onboardingUrl,
      rows,
      bullets: ["Confirm onboarding details", "Collect required access", "Build and test automations", "Send launch confirmation"],
      proofLine: "Your setup will not be marked live until required testing and launch confirmation are complete.",
      referenceId: order_id,
    });
    const fallbackText = renderMasterFallbackText({
      headline: `${firstName}, your ClientSurge order is received.`,
      intro: "Your setup is moving into onboarding. Complete the secure checklist so we can start connecting the right systems.",
      ctaLabel: "Start Onboarding",
      ctaUrl: onboardingUrl,
      rows,
      referenceId: order_id,
    });

    const sendResult = await sendClientSurgeResendTemplateEmail({
      to: customerEmail,
      fromEmail: getFromEmail("system@clientsurgesystems.com"),
      fromName: "ClientSurge Setup Team",
      replyTo: "support@clientsurgesystems.com",
      subject,
      templateAlias: RESEND_TEMPLATE_ALIASES.orderReceived,
      variables: commonTemplateVariables({
        RECIPIENT_NAME: firstName,
        BUSINESS_NAME: businessName,
        REFERENCE_ID: order_id,
        PACKAGE_NAME: packageName,
        TOTAL_SETUP: Number(order.total_setup || order.pricing_summary?.total_setup || 0),
        TOTAL_MONTHLY: Number(order.total_monthly || order.pricing_summary?.total_monthly || 0),
        ONBOARDING_URL: onboardingUrl,
      }),
      fallbackHtml,
      fallbackText,
      tags: [
        { name: "category", value: "order_received" },
        { name: "template", value: RESEND_TEMPLATE_ALIASES.orderReceived },
      ],
      idempotencyKey: `client-order-received-${order_id}`,
    });

    await logEmailEvent(svc, {
      orderId: order_id,
      contextType: "Order",
      contextId: order_id,
      relatedEntityType: "Order",
      relatedEntityId: order_id,
      eventType: sendResult.ok ? "email_sent" : "email_failed",
      status: sendResult.ok ? "sent" : "failed",
      subject,
      bodyPreview: sendResult.ok
        ? `Order received email sent to ${customerEmail}. Template used: ${sendResult.templateUsed}. Fallback used: ${sendResult.fallbackUsed}.`
        : `Order received email failed for ${customerEmail}: ${sendResult.error}`,
      templateAlias: RESEND_TEMPLATE_ALIASES.orderReceived,
      providerMessageId: sendResult.ok ? sendResult.providerMessageId : null,
      recipient: customerEmail,
      templateUsed: sendResult.ok ? sendResult.templateUsed : false,
      fallbackUsed: sendResult.ok ? sendResult.fallbackUsed : true,
    });

    if (!sendResult.ok) {
      return secureJson({ error: "Email send failed", detail: sendResult.error }, { status: 500 });
    }

    return secureJson({
      success: true,
      sent_to: customerEmail,
      onboarding_url: onboardingUrl,
      provider_message_id: sendResult.providerMessageId,
      template_alias: RESEND_TEMPLATE_ALIASES.orderReceived,
      template_used: sendResult.templateUsed,
      fallback_used: sendResult.fallbackUsed,
    });
  } catch (err) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
