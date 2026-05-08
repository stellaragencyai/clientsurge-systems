/**
 * stripeInvoiceHandlers.ts — #517 CRITICAL
 * Handles invoice.paid (renew) and invoice.payment_failed (dunning).
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { verifyStripeSignature } from "../shared/stripeWebhookSignatureVerifier.ts";

Deno.serve(async (req) => {
  const { valid, payload, error } = await verifyStripeSignature(req.clone());
  if (!valid) return Response.json({ error: `Unauthorized: ${error}` }, { status: 401 });

  try {
    const base44 = createClientFromRequest(req);
    const event = JSON.parse(payload!);
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (event.type === "invoice.paid") {
      // Renewal confirmed — mark billing_status active
      const customerId = event.data?.object?.customer;
      const amount = (event.data?.object?.amount_paid || 0) / 100;
      const orders = await base44.asServiceRole.entities.Order
        .filter({ stripe_customer_id: customerId }).catch(() => []);
      for (const order of (orders || [])) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          billing_status: "active",
          last_payment_at: new Date().toISOString(),
          last_payment_amount: amount,
        });
      }
      // Log
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "stripeInvoiceHandlers", log_type: "info",
        summary: `Invoice paid: $${amount} for customer ${customerId}`,
        service: "stripe", requires_nolan: false, resolved: true,
      }).catch(() => {});
    }

    if (event.type === "invoice.payment_failed") {
      const customerId = event.data?.object?.customer;
      const attemptCount = event.data?.object?.attempt_count || 1;
      const orders = await base44.asServiceRole.entities.Order
        .filter({ stripe_customer_id: customerId }).catch(() => []);

      for (const order of (orders || [])) {
        await base44.asServiceRole.entities.Order.update(order.id, {
          billing_status: "past_due",
          payment_failed_at: new Date().toISOString(),
          payment_fail_count: attemptCount,
        });

        // Email client
        if (order.client_email && resendKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "system@clientsurgesystems.com",
              reply_to: "nolan@clientsurgesystems.com",
              to: order.client_email,
              subject: "⚠️ Payment issue — action needed",
              html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 20px">
                <h2 style="color:#0A0F1E">Payment issue with your subscription</h2>
                <p style="color:#374151">Hey ${order.client_name || "there"},</p>
                <p style="color:#374151">We had trouble processing your payment (attempt ${attemptCount}). Please update your payment method to keep your AI systems running.</p>
                <p style="color:#374151"><a href="https://clientsurgesystems.com/billing" style="color:#0088CC">Update payment method →</a></p>
                <p style="color:#6B7280;font-size:13px">Questions? Reply here — Nolan will help immediately.</p>
              </div>`,
            }),
          }).catch(() => {});
        }

        // Telegram Nolan
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: "-1003533494424",
              text: `@trinity

💳 <b>Payment Failed</b>
Client: ${order.client_name}
Attempt: ${attemptCount}
Tier: ${order.package_key}`,
              parse_mode: "HTML" }),
          }).catch(() => {});
        }
      }
    }

    return Response.json({ received: true, type: event.type });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
