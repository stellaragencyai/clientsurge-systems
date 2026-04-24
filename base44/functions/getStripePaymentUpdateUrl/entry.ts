/**
 * getStripePaymentUpdateUrl — returns a Stripe Billing Portal session URL
 * so the authenticated client can update their payment method directly.
 */
import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    // Find the order linked to this user
    const orders = await base44.asServiceRole.entities.Order.filter({ customer_email: user.email });
    const order = orders?.[0];

    if (!order?.stripe_customer_id) {
      return Response.json({ error: "No Stripe customer found for this account." }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: order.stripe_customer_id,
      return_url: "https://clientsurgesystems.com/client-portal",
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error("getStripePaymentUpdateUrl error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});