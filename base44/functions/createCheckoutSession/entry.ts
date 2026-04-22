import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { items, customer_name, customer_email, customer_phone, business_name, success_url, cancel_url } = await req.json();

    if (!items || !items.length || !customer_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build line items: setup fees (one-time) + monthly subscriptions
    const line_items = [];
    for (const item of items) {
      // One-time setup fee
      line_items.push({ price: item.setup_price_id, quantity: 1 });
      // Monthly recurring
      line_items.push({ price: item.monthly_price_id, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customer_email,
      line_items,
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        customer_name,
        customer_phone: customer_phone || "",
        business_name,
        items_json: JSON.stringify(items.map(i => ({ product_id: i.product_id, product_name: i.name }))),
      },
    });

    // Pre-create the order record in pending state
    const totalSetup = items.reduce((s, i) => s + i.setup_fee, 0);
    const totalMonthly = items.reduce((s, i) => s + i.monthly_fee, 0);

    await base44.asServiceRole.entities.Order.create({
      customer_email,
      customer_name,
      customer_phone: customer_phone || "",
      business_name,
      items: items.map(i => ({
        product_id: i.product_id,
        product_name: i.name,
        setup_price_id: i.setup_price_id,
        monthly_price_id: i.monthly_price_id,
        setup_fee: i.setup_fee,
        monthly_fee: i.monthly_fee,
        status: "pending",
      })),
      total_setup: totalSetup,
      total_monthly: totalMonthly,
      stripe_session_id: session.id,
      payment_status: "pending",
      order_status: "pending_payment",
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});