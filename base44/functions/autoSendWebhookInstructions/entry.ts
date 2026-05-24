import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const APP_URL = (Deno.env.get("APP_URL") || "https://clientsurgesystems.com").replace(/\/+$/, "");

function buildInstructionsEmail(order) {
  const businessName = order.business_name || order.customer_name || "your business";
  const portalUrl = `${APP_URL}/setup?order_id=${encodeURIComponent(order.id)}`;
  const subject = `ClientSurge setup instructions for ${businessName}`;
  const text = [
    `Hi ${order.customer_name || "there"},`,
    "",
    `Thanks for starting your ClientSurge setup for ${businessName}.`,
    "",
    "Next steps:",
    "1. Open your secure setup page and confirm your business details.",
    "2. Add your booking link, business hours, and lead notification email.",
    "3. If you already have Twilio, Calendly, CRM, or webhook details, add them there. If not, our team will provision or connect them during install.",
    "",
    `Setup page: ${portalUrl}`,
    "",
    "Reply to this email if you are not sure what to provide. We will not ask you to paste secrets into chat.",
    "",
    "ClientSurge Systems",
  ].join("\n");
  const html = text
    .split("\n")
    .map((line) => (line ? `<p>${line.replace(portalUrl, `<a href="${portalUrl}">${portalUrl}</a>`)}</p>` : "<br />"))
    .join("");

  return { subject, text, html, portalUrl };
}

async function sendEmail({ to, subject, text, html }) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return { sent: false, reason: "RESEND_API_KEY missing" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "ClientSurge Systems <system@clientsurgesystems.com>",
      to,
      subject,
      text,
      html,
      reply_to: Deno.env.get("SUPPORT_EMAIL") || "support@clientsurgesystems.com",
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message || "Resend send failed");
  }
  return { sent: true, provider_message_id: body?.id || null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return Response.json({ error: "order_id required" }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const to = order.customer_email || order.client_email;
    if (!to) return Response.json({ error: "Order customer email missing" }, { status: 422 });

    const email = buildInstructionsEmail(order);
    const result = await sendEmail({ to, ...email });
    const now = new Date().toISOString();

    await base44.asServiceRole.entities.Order.update(order_id, {
      webhook_instructions_sent_at: now,
      setup_instructions_sent_at: now,
    }).catch(() => {});

    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "email",
      direction: "outbound",
      event_type: result.sent ? "email_sent" : "workflow_triggered",
      provider: result.sent ? "resend" : "internal",
      status: result.sent ? "sent" : "pending",
      subject: email.subject,
      message_body: email.text,
      provider_message_id: result.provider_message_id || null,
      metadata_json: JSON.stringify({
        source: "autoSendWebhookInstructions",
        portal_url: email.portalUrl,
        send_reason: result.reason || null,
      }),
    }).catch(() => {});

    return Response.json({ success: true, order_id, sent: result.sent, reason: result.reason || null });
  } catch (error) {
    console.error("[autoSendWebhookInstructions]", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
