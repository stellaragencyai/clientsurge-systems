import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const customerId = session.customer;

    // Find the order and mark it paid
    const orders = await base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId });
    if (orders && orders.length > 0) {
      const order = orders[0];
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: "paid",
        order_status: "paid_setup_in_progress",
        stripe_customer_id: customerId,
      });
      console.log(`Order ${order.id} marked as paid`);
    }
  }

  return Response.json({ received: true });
});