/**
 * createCheckoutSession — Creates a Stripe Checkout Session for a package purchase.
 *
 * Flow:
 * 1. Validates package_key against canonical package definitions
 * 2. Looks up Stripe price IDs (setup + monthly) for the package
 * 3. Creates an Order record (pending_payment)
 * 4. Creates a Stripe Checkout Session with both line items
 * 5. Returns the checkout URL
 *
 * No auth required — this is a public checkout endpoint.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.34";

// ── Canonical package definitions (mirrors src/lib/salesCatalog.js) ──
const PACKAGE_DEFINITIONS = {
  starter_system: {
    name: "Starter System",
    stripe_product_id: "prod_UReWMpnZsCnfcL",
    setup_price_id: "price_1TSlDWBVGjsISdG0SyoWzAm3",
    monthly_price_id: "price_1TSlDWBVGjsISdG0Ej1O16ov",
    setup_total: 797,
    monthly_total: 497,
  },
  growth_system: {
    name: "Growth System",
    stripe_product_id: "prod_UReWhZsWks1HuA",
    setup_price_id: "price_1TSlDXBVGjsISdG0eTWcARLM",
    monthly_price_id: "price_1TSlDXBVGjsISdG0X9unS4Qf",
    setup_total: 1297,
    monthly_total: 997,
  },
  pro_system: {
    name: "Pro System",
    stripe_product_id: "prod_UReW1LmsVbn4BZ",
    setup_price_id: "price_1TSlDYBVGjsISdG0l2rHzet1",
    monthly_price_id: "price_1TSlDXBVGjsISdG0Abdx85z3",
    setup_total: 2497,
    monthly_total: 1997,
  },
};

const PACKAGE_ALIASES = {
  starter: "starter_system",
  "starter system": "starter_system",
  starter_system: "starter_system",
  growth: "growth_system",
  "growth system": "growth_system",
  growth_system: "growth_system",
  elite: "pro_system",
  "elite system": "pro_system",
  elite_system: "pro_system",
  pro: "pro_system",
  "pro system": "pro_system",
  pro_system: "pro_system",
};

function normalizePackageKey(key) {
  const normalized = String(key || "").trim().toLowerCase();
  return PACKAGE_ALIASES[normalized] || (PACKAGE_DEFINITIONS[normalized] ? normalized : null);
}

function isTruthy(value) {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function isCheckoutSmokeRequest({ customer_email, smoke_test, source }) {
  const email = String(customer_email || "").trim().toLowerCase();
  const sourceValue = String(source || "").trim().toLowerCase();
  return (
    isTruthy(smoke_test) ||
    sourceValue.includes("smoke") ||
    email.includes("+checkout-smoke@") ||
    email.endsWith("@clientsurge.test")
  );
}

function smokeOrderFields(requestId) {
  return {
    environment: "smoke",
    dashboard_excluded: true,
    dashboard_exclusion_reason: `Automated checkout smoke test (${requestId})`,
    dashboard_truth_status: "blocked",
    dashboard_truth_notes: "Automated checkout smoke test. Exclude from production metrics and public proof.",
    notes: `Automated checkout smoke test. Safe to archive. request_id: ${requestId}`,
  };
}

Deno.serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[createCheckoutSession] ${requestId} — start`);

  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body", request_id: requestId },
        { status: 400 }
      );
    }

    const {
      package_key,
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      industry,
      success_url,
      cancel_url,
      smoke_test,
      source,
    } = body || {};

    const isSmokeCheckout = isCheckoutSmokeRequest({ customer_email, smoke_test, source });

    // ── Validate required fields ──
    if (!package_key) {
      return Response.json(
        { error: "Missing package_key parameter", request_id: requestId },
        { status: 400 }
      );
    }
    if (!customer_email) {
      return Response.json(
        { error: "Missing customer_email", request_id: requestId },
        { status: 400 }
      );
    }
    if (!customer_name) {
      return Response.json(
        { error: "Missing customer_name", request_id: requestId },
        { status: 400 }
      );
    }
    if (!business_name) {
      return Response.json(
        { error: "Missing business_name", request_id: requestId },
        { status: 400 }
      );
    }

    // ── Normalize and validate package ──
    const normalizedKey = normalizePackageKey(package_key);
    if (!normalizedKey) {
      return Response.json(
        {
          error: `Unknown package: "${package_key}". Valid packages: starter_system, growth_system, pro_system`,
          request_id: requestId,
        },
        { status: 400 }
      );
    }

    const pkgDef = PACKAGE_DEFINITIONS[normalizedKey];
    if (!pkgDef) {
      return Response.json(
        { error: `Package configuration not found for: ${normalizedKey}`, request_id: requestId },
        { status: 500 }
      );
    }

    // ── Validate Stripe price IDs exist ──
    if (!pkgDef.setup_price_id || !pkgDef.monthly_price_id) {
      return Response.json(
        {
          error: `Package "${normalizedKey}" is missing Stripe price configuration. Please contact support.`,
          request_id: requestId,
        },
        { status: 500 }
      );
    }

    // ── Validate URLs ──
    const origin = req.headers.get("origin") || "https://clientsurgesystems.com";
    const finalSuccessUrl = success_url || `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${origin}/product-signup?package=${normalizedKey}`;

    // ── Initialize Stripe ──
    const secretKey =
      Deno.env.get("STRIPE_SECRET_KEY") ||
      Deno.env.get("STRIPE_LIVE_SECRET_KEY");

    if (!secretKey) {
      console.error("[createCheckoutSession] STRIPE_SECRET_KEY not configured");
      return Response.json(
        { error: "Payment system is not configured. Please contact support.", request_id: requestId },
        { status: 500 }
      );
    }

    const { default: Stripe } = await import("npm:stripe@14.21.0");
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
      appInfo: { name: "ClientSurge Systems" },
    });

    // ── Create Order record (pending) ──
    const base44 = createClientFromRequest(req);

    let order;
    try {
      const orderPayload = {
        customer_email: customer_email.trim().toLowerCase(),
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() || "",
        business_name: business_name.trim(),
        payment_status: "pending",
        order_status: "pending_payment",
        payment_source: "stripe",
        selected_package_type: normalizedKey,
        package_type: normalizedKey,
        plan_type: pkgDef.name,
        total_setup: pkgDef.setup_total,
        total_monthly: pkgDef.monthly_total,
        pricing_summary: {
          package_key: normalizedKey,
          package_name: pkgDef.name,
          total_setup: pkgDef.setup_total,
          total_monthly: pkgDef.monthly_total,
        },
        environment: "production",
        dashboard_truth_status: "trusted",
      };

      if (isSmokeCheckout) {
        Object.assign(orderPayload, smokeOrderFields(requestId));
      }

      order = await base44.asServiceRole.entities.Order.create(orderPayload);
      console.log(`[createCheckoutSession] ${requestId} — Order created: ${order.id}`);
    } catch (err) {
      console.error("[createCheckoutSession] Order creation failed:", err.message);
      return Response.json(
        { error: "Failed to create order record. Please try again.", request_id: requestId },
        { status: 500 }
      );
    }

    // ── Create Stripe Checkout Session ──
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: customer_email.trim().toLowerCase(),
        line_items: [
          { price: pkgDef.setup_price_id, quantity: 1 },
          { price: pkgDef.monthly_price_id, quantity: 1 },
        ],
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata: {
          base44_app_id: Deno.env.get("BASE44_APP_ID") || "",
          order_id: order.id,
          package_key: normalizedKey,
          package_name: pkgDef.name,
          customer_name: customer_name.trim(),
          business_name: business_name.trim(),
          industry: industry?.trim() || "",
          source: source ? String(source).slice(0, 120) : "product_signup",
          smoke_test: isSmokeCheckout ? "true" : "false",
          request_id: requestId,
        },
        subscription_data: {
          metadata: {
            base44_app_id: Deno.env.get("BASE44_APP_ID") || "",
            order_id: order.id,
            package_key: normalizedKey,
            customer_email: customer_email.trim().toLowerCase(),
            business_name: business_name.trim(),
            source: source ? String(source).slice(0, 120) : "product_signup",
            smoke_test: isSmokeCheckout ? "true" : "false",
            request_id: requestId,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
      });

      console.log(`[createCheckoutSession] ${requestId} — Stripe session created: ${session.id}`);
    } catch (err) {
      console.error("[createCheckoutSession] Stripe session creation failed:", err.message);

      // Update order to reflect failure
      try {
        await base44.asServiceRole.entities.Order.update(order.id, {
          pipeline_error: `Stripe checkout session creation failed: ${err.message}`,
        });
      } catch {}

      return Response.json(
        {
          error: `Checkout session creation failed: ${err.message}`,
          request_id: requestId,
        },
        { status: 502 }
      );
    }

    // ── Update order with Stripe session ID ──
    try {
      await base44.asServiceRole.entities.Order.update(order.id, {
        stripe_session_id: session.id,
        stripe_customer_id: session.customer || undefined,
        stripe_subscription_id: session.subscription || undefined,
      });
    } catch (err) {
      console.warn("[createCheckoutSession] Failed to update order with session ID:", err.message);
    }

    console.log(`[createCheckoutSession] ${requestId} — success, redirecting to Stripe`);

    return Response.json({
      url: session.url,
      session_id: session.id,
      order_id: order.id,
      request_id: requestId,
      smoke_test: isSmokeCheckout,
    });
  } catch (error) {
    console.error(`[createCheckoutSession] ${requestId} — unhandled error:`, error);
    return Response.json(
      { error: error.message || "An unexpected error occurred.", request_id: requestId },
      { status: 500 }
    );
  }
});
