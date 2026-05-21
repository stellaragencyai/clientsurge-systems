/**
 * getStripePaymentUpdateUrl — returns a Stripe Billing Portal session URL
 * so the authenticated client can update their payment method directly.
 */
import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    const order = resolution.status === "resolved" ? resolution.order : null;

    if (!order?.stripe_customer_id) {
      return Response.json({ error: "No Stripe customer found for this account." }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: order.stripe_customer_id,
      return_url: "https://clientsurgesystems.com/client-portal",
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error("[getStripePaymentUpdateUrl] getStripePaymentUpdateUrl error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
