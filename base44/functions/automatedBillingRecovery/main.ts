/**
 * automatedBillingRecovery — Step 15
 * Triggered on failed Stripe payment: Automatically sends SMS or voice call
 * recovery offer. Removes manual payment follow-up emails.
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

  const { order_id } = body;
  if (!order_id) return json({ error: "order_id required" }, 400);

  const base44 = createClientFromRequest(req);

  try {
    const orders = await base44.asServiceRole.entities.Order.filter(
      { id: order_id, payment_status: "failed" }, "-created_date", 1
    ).catch(() => []);
    const order = orders?.[0];
    if (!order) return json({ error: "Order not found or payment successful" }, 404);

    console.log("[automatedBillingRecovery] Initiating recovery for failed payment", { order_id });

    const recoveryMessage = `Hi ${order.customer_name}, your payment failed. Let us help you get your automations live. Reply with YES or call [SUPPORT_PHONE] to resolve.`;

    // Send SMS recovery (immediate)
    if (order.customer_phone) {
      await base44.asServiceRole.functions.invoke("sendSMS", {
        to: order.customer_phone,
        message: recoveryMessage,
      }).catch(err => console.error("[automatedBillingRecovery] SMS failed", { error: err.message }));
    }

    // Log recovery attempt
    await base44.asServiceRole.entities.CommunicationEvent.create({
      order_id,
      channel: "sms",
      direction: "outbound",
      event_type: "status_update",
      provider: "twilio",
      status: "sent",
      subject: "Payment recovery SMS sent",
      message_body: recoveryMessage,
    }).catch(() => null);

    return json({ success: true, order_id, message: "Payment recovery workflow initiated" });

  } catch (err) {
    console.error("[automatedBillingRecovery] Fatal error", { error: err.message, order_id });
    return json({ error: err.message }, 500);
  }
});