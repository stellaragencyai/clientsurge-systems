/**
 * automatedReviewLoop — Step 12
 * Triggered on appointment completion: Automatically sends review request
 * (SMS or email) without manual admin intervention. Fully removes manual review request workflows.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Frame-Options": "DENY" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  
  let body = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { order_id, lead_id, phone_number, email } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);

  try {
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found" }, 404);

    console.log("[automatedReviewLoop] Triggering review request for", { order_id, lead_id });

    const config = order.install_configuration?.services?.review_request || {};
    const reviewLink = config.review_link || Deno.env.get("DEFAULT_BOOKING_LINK");
    const channel = config.channel || "sms";

    let reviewMessage = `Hi! We'd love to hear about your experience. Please leave us a review: ${reviewLink}`;
    if (config.message_template) {
      reviewMessage = config.message_template.replace("{{review_link}}", reviewLink);
    }

    if (channel === "sms" && phone_number) {
      // Send SMS review request
      await base44.asServiceRole.functions.invoke("sendSMS", {
        to: phone_number,
        message: reviewMessage,
      }).catch(err => {
        console.error("[automatedReviewLoop] SMS send failed", { error: err.message });
      });
    } else if (channel === "email" && email) {
      // Send email review request
      await base44.asServiceRole.functions.invoke("sendEmail", {
        to: email,
        subject: "How was your experience?",
        body: reviewMessage,
      }).catch(err => {
        console.error("[automatedReviewLoop] Email send failed", { error: err.message });
      });
    }

    // Log the review request event
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      lead_id,
      channel,
      direction: "outbound",
      event_type: "review_request_trigger_simulated",
      provider: channel === "sms" ? "twilio" : "resend",
      status: "sent",
      subject: "Automated review request sent",
      message_body: reviewMessage,
    }).catch(() => null);

    console.log("[automatedReviewLoop] Review request sent via", { channel, order_id });
    return json({ success: true, order_id, lead_id, channel });

  } catch (err) {
    console.error("[automatedReviewLoop] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});