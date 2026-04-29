import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildOnboardingUrl(order, session) {
  const params = new URLSearchParams();
  const customerName =
    cleanString(order?.customer_name) ||
    cleanString(session?.customer_details?.name);
  const customerEmail =
    cleanString(order?.customer_email) ||
    cleanString(session?.customer_details?.email);
  const businessName =
    cleanString(order?.business_name) ||
    cleanString(session?.metadata?.business_name);
  const customerPhone = cleanString(order?.customer_phone);

  if (customerName) params.set("full_name", customerName);
  if (customerEmail) params.set("email", customerEmail);
  if (businessName) params.set("business_name", businessName);
  if (customerPhone) params.set("phone", customerPhone);

  const query = params.toString();
  return query ? `/onboarding?${query}` : "/onboarding";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { session_id } = await req.json();
    const sessionId = cleanString(session_id);

    if (!sessionId) {
      return Response.json({ error: "session_id is required" }, { status: 400 });
    }

    const [session, orders] = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId).catch(() => null),
      base44.asServiceRole.entities.Order.filter({ stripe_session_id: sessionId }, "-created_date", 1),
    ]);

    if (!session) {
      return Response.json({ error: "Checkout session not found" }, { status: 404 });
    }

    const order = orders?.[0] || null;

    return Response.json({
      session_id: sessionId,
      session_status: session.status || "",
      stripe_payment_status: session.payment_status || "",
      payment_status: order?.payment_status || "pending",
      order_status: order?.order_status || "pending_payment",
      pipeline_status: order?.pipeline_status || "",
      subscription_status: order?.subscription_status || "",
      business_name:
        cleanString(order?.business_name) ||
        cleanString(session.metadata?.business_name),
      plan_type:
        cleanString(order?.plan_type) ||
        cleanString(session.metadata?.plan_type),
      legal_acceptance_captured: Boolean(order?.legal_acceptance?.accepted_at),
      onboarding_url: buildOnboardingUrl(order, session),
      portal_url: "/client-portal",
    });
  } catch (error) {
    console.error("getOrderSuccessContext error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
