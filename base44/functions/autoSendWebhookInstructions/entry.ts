import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const WEBHOOK_INSTRUCTIONS_EMAIL = `
<h2>🎉 Your ClientSurge Systems Are Being Activated!</h2>
<p>To complete your setup, we need to configure your Twilio webhooks. Here's what we'll do:</p>

<h3>What Happens Next:</h3>
<ol>
  <li><strong>SMS Automation:</strong> We'll configure your Twilio number to route incoming texts to your AI system</li>
  <li><strong>Missed Call Recovery:</strong> We'll set up automatic text-back when calls go unanswered</li>
  <li><strong>Lead Response:</strong> Your AI will respond to new leads within 60 seconds</li>
</ol>

<h3>Your Action Items:</h3>
<p>Our team will handle all technical configuration. You just need to:</p>
<ul>
  <li>✅ Keep your booking link accessible (we'll test it)</li>
  <li>✅ Ensure your phone number is verified in your account</li>
  <li>✅ Check your email for setup progress updates</li>
</ul>

<p>Questions? Reply to this email or call <a href="tel:+16025843227">(602) 584-3227</a></p>
<p><em>— The ClientSurge Systems Team</em></p>
`;

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { order_id } = payload;

    // When called from an Order create automation, event.entity_id is passed
    const targetOrderId = order_id || payload.entity_id;

    if (!targetOrderId) {
      return Response.json({ error: "order_id required" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(targetOrderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Only send for paid orders
    if (order.payment_status !== "paid") {
      return Response.json({ skipped: true, reason: "Order not paid yet" });
    }

    // Check if already sent (idempotency)
    const existingEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({
      context_id: targetOrderId,
      event_type: "webhook_instructions_sent",
    }, "-created_date", 1);

    if (existingEvents?.length > 0) {
      return Response.json({ skipped: true, reason: "Instructions already sent" });
    }

    const customerEmail = order.customer_email;
    const customerName = order.customer_name || "there";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "support@clientsurgesystems.com";

    if (resendApiKey && customerEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `ClientSurge Systems <${fromEmail}>`,
          to: [customerEmail],
          subject: "Your AI Systems Are Being Activated — Next Steps",
          html: `<p>Hi ${customerName},</p>${WEBHOOK_INSTRUCTIONS_EMAIL}`,
        }),
      });
    }

    // Log the send
    await base44.asServiceRole.entities.CommunicationEvent.create({
      context_type: "order",
      context_id: targetOrderId,
      order_id: targetOrderId,
      event_type: "webhook_instructions_sent",
      channel: "email",
      direction: "outbound",
      status: "sent",
      provider: "resend",
      subject: "Webhook setup instructions sent",
      message_body: "Automated webhook setup instructions delivered to client",
    }).catch(() => {});

    console.log(`[autoSendWebhookInstructions] Instructions sent for order ${targetOrderId}`);
    return Response.json({ success: true, order_id: targetOrderId });
  } catch (error) {
    console.error("[autoSendWebhookInstructions] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});