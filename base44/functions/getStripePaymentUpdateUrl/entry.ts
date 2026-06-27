import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Inlined shared helpers ──
function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

// ── Portal ownership resolution ──
async function resolveClientPortalAccess({ base44, userEmail }) {
  if (!userEmail) {
    return { status: "not_found", order: null, clientProject: null };
  }

  try {
    const projects = await base44.asServiceRole.entities.ClientProject.filter(
      { client_email: userEmail },
      "-created_date",
      5
    ).catch(() => []);

    if (projects && projects.length > 0) {
      const project = projects[0];
      let order = null;
      if (project.client_id) {
        const orders = await base44.asServiceRole.entities.Order.filter(
          { client_id: project.client_id },
          "-created_date",
          1
        ).catch(() => []);
        order = orders?.[0] || null;
      }
      return { status: "resolved", order, clientProject: project };
    }

    const orders = await base44.asServiceRole.entities.Order.filter(
      { customer_email: userEmail },
      "-created_date",
      1
    ).catch(() => []);

    if (orders && orders.length > 0) {
      return { status: "resolved", order: orders[0], clientProject: null };
    }

    return { status: "not_found", order: null, clientProject: null };
  } catch (error) {
    console.warn("[portalOwnership] Error resolving access:", error.message);
    return { status: "not_found", order: null, clientProject: null };
  }
}

// ── Stripe initialization ──
let StripeModule = null;

async function loadStripe() {
  if (StripeModule) return StripeModule;
  const mod = await import("npm:stripe@14.21.0");
  StripeModule = mod.default || mod;
  return StripeModule;
}

async function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("STRIPE_LIVE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("Stripe secret key not configured");
  }
  const Stripe = await loadStripe();
  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    appInfo: { name: "ClientSurge Systems" },
  });
  return { stripe };
}

function safeStripeError(error, fallbackMessage = "An unexpected payment error occurred.") {
  const internalMessage = error?.message || String(error || "Unknown error");
  const code = error?.code || error?.type || "stripe_error";
  const userMessages = {
    authentication_required: "This payment requires additional authentication. Please contact support.",
    card_declined: "Your card was declined. Please try a different payment method.",
    expired_card: "Your card has expired. Please update your payment method.",
    incorrect_cvc: "The security code is incorrect. Please verify and try again.",
    insufficient_funds: "Your card has insufficient funds. Please try a different card.",
    processing_error: "An error occurred while processing your payment. Please try again.",
    rate_limit: "Too many requests. Please wait a moment and try again.",
  };
  const userMessage = userMessages[code] || fallbackMessage;
  const status = error?.statusCode || 500;
  return { code, userMessage, internalMessage, status };
}

/**
 * getStripePaymentUpdateUrl — returns a Stripe Billing Portal session URL
 * so the authenticated client can update their payment method directly.
 */
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    if (req.method !== "POST") {
      return secureJson({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.email) {
      return secureJson({ error: "Authentication required" }, { status: 401 });
    }

    const resolution = await resolveClientPortalAccess({
      base44,
      userEmail: user.email,
    });

    const order = resolution.status === "resolved" ? resolution.order : null;

    if (!order?.stripe_customer_id) {
      return secureJson({ error: "No Stripe customer found for this account." }, { status: 404 });
    }

    let stripe;
    try {
      ({ stripe } = await getStripeClient());
    } catch (error) {
      const safeError = safeStripeError(error);
      console.error("[getStripePaymentUpdateUrl] Stripe is not configured", {
        requestId,
        code: safeError.code,
      });
      return secureJson(
        { error: safeError.userMessage, code: safeError.code, request_id: requestId },
        { status: safeError.status }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: order.stripe_customer_id,
      return_url: "https://clientsurgesystems.com/client-portal",
    });

    return secureJson({ url: portalSession.url, request_id: requestId });
  } catch (error) {
    const safeError = safeStripeError(error, "Unable to open the payment update portal. Please contact support.");
    console.error("[getStripePaymentUpdateUrl] error", {
      requestId,
      code: safeError.code,
      message: safeError.internalMessage,
    });
    return secureJson(
      { error: safeError.userMessage, code: safeError.code, request_id: requestId },
      { status: safeError.status }
    );
  }
});