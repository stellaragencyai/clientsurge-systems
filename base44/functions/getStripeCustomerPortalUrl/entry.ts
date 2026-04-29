import Stripe from "npm:stripe@14.21.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const returnUrl = cleanString(body.return_url) || "https://clientsurgesystems.com/client-portal";

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    if (resolution.status !== "resolved" || !resolution.order?.stripe_customer_id) {
      return Response.json(
        { error: "No Stripe customer found for this account. Please contact support." },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: resolution.order.stripe_customer_id,
      return_url: returnUrl,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
