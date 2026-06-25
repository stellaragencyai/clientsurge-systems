import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import Stripe from "npm:stripe@14.21.0";

// ─── Inlined Product Catalog (no local imports) ─────────────────────────────

const CANONICAL_SERVICE_PRODUCTS = [
  {
    product_id: "prod_UNi5RHiKNSTfQl",
    service_key: "instant_lead_response",
    name: "Instant Lead Response",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
  },
  {
    product_id: "prod_UNi5QL0bQl98If",
    service_key: "missed_call_text_back",
    name: "Missed Call Text-Back",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEJuEDhpKS",
    monthly_price_id: "price_1TOwfiB9GU5ysJqE8knUfswZ",
  },
  {
    product_id: "prod_UNi5N0l5MtaV0R",
    service_key: "nurture_sequence_14d",
    name: "14-Day Nurture Sequence",
    setup_fee: 397,
    monthly_fee: 127,
    setup_price_id: "price_1TOwfiB9GU5ysJqEtwQAmCuN",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEsoZmFl6D",
  },
  {
    product_id: "prod_UNi5fLL2SyJJdP",
    service_key: "ai_booking_agent",
    name: "AI Booking Agent",
    setup_fee: 497,
    monthly_fee: 147,
    setup_price_id: "price_1TOwfiB9GU5ysJqEij8Qq9rd",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEKhYvS71r",
  },
  {
    product_id: "prod_UNi5PWv05ECzXI",
    service_key: "lead_reactivation",
    name: "Old Lead Reactivation",
    setup_fee: 297,
    monthly_fee: 97,
    setup_price_id: "price_1TOwfiB9GU5ysJqExMxwfoFr",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEfsJEvPcI",
  },
  {
    product_id: "prod_UNi5dvOUm6Fi9i",
    service_key: "review_request",
    name: "Review Request Automation",
    setup_fee: 197,
    monthly_fee: 67,
    setup_price_id: "price_1TOwfiB9GU5ysJqEO8byuwlT",
    monthly_price_id: "price_1TOwfiB9GU5ysJqEryd66HuE",
  },
];

const PACKAGE_DEFINITIONS = [
  {
    package_key: "starter_system",
    name: "Starter System",
    stripe_product_id: "prod_UReWMpnZsCnfcL",
    setup_price_id: "price_1TSlDWBVGjsISdG0SyoWzAm3",
    monthly_price_id: "price_1TSlDWBVGjsISdG0Ej1O16ov",
    included_service_keys: ["instant_lead_response", "missed_call_text_back"],
    setup_total: 797,
    monthly_total: 497,
  },
  {
    package_key: "growth_system",
    name: "Growth System",
    stripe_product_id: "prod_UReWhZsWks1HuA",
    setup_price_id: "price_1TSlDXBVGjsISdG0eTWcARLM",
    monthly_price_id: "price_1TSlDXBVGjsISdG0X9unS4Qf",
    included_service_keys: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
    setup_total: 1297,
    monthly_total: 997,
  },
  {
    package_key: "pro_system",
    legacy_package_keys: ["elite_system"],
    name: "Pro System",
    stripe_product_id: "prod_UReW1LmsVbn4BZ",
    setup_price_id: "price_1TSlDYBVGjsISdG0l2rHzet1",
    monthly_price_id: "price_1TSlDXBVGjsISdG0Abdx85z3",
    included_service_keys: ["instant_lead_response", "missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent", "lead_reactivation", "review_request"],
    setup_total: 2497,
    monthly_total: 1997,
  },
];

const PACKAGE_KEY_ALIASES = {
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

const SERVICE_BY_PRODUCT_ID = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((p) => [p.product_id, p])
);
const SERVICE_BY_KEY = Object.fromEntries(
  CANONICAL_SERVICE_PRODUCTS.map((p) => [p.service_key, p])
);

function resolvePackageKey(rawKey) {
  if (!rawKey) return null;
  const normalized = String(rawKey).trim().toLowerCase();
  return PACKAGE_KEY_ALIASES[normalized] || null;
}

function findPackageByProductIds(productIds) {
  const selectedServiceKeys = new Set(
    productIds
      .map((id) => SERVICE_BY_PRODUCT_ID[id]?.service_key)
      .filter(Boolean)
  );

  for (const pkg of PACKAGE_DEFINITIONS) {
    const packageServiceKeys = new Set(pkg.included_service_keys);
    if (
      selectedServiceKeys.size === packageServiceKeys.size &&
      [...packageServiceKeys].every((k) => selectedServiceKeys.has(k))
    ) {
      return pkg;
    }
  }
  return null;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  let createdOrderId = null;

  try {
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      return secureJson(
        { error: "Stripe is not configured. Contact support.", code: "stripe_not_configured", request_id: requestId },
        { status: 500 }
      );
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      items,
      product_ids,
      package_key,
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      lead_id,
      crm_lead_id,
      website_lead_id,
      success_url,
      cancel_url,
      deploy_immediately,
    } = body;

    // Resolve product IDs from items array or product_ids array
    let requestedProductIds = [];
    if (Array.isArray(product_ids) && product_ids.length) {
      requestedProductIds = product_ids;
    } else if (Array.isArray(items)) {
      requestedProductIds = items
        .map((item) => item?.product_id || item)
        .filter(Boolean);
    }

    if (!customer_email) {
      return secureJson({ error: "Customer email is required", request_id: requestId }, { status: 400 });
    }

    if (!requestedProductIds.length && !package_key) {
      return secureJson({ error: "Select at least one product or package", request_id: requestId }, { status: 400 });
    }

    // Determine package offer: explicit package_key, or infer from product selection
    let pkgOffer = null;
    if (package_key) {
      const resolvedKey = resolvePackageKey(package_key);
      pkgOffer = PACKAGE_DEFINITIONS.find((p) => p.package_key === resolvedKey) || null;
      if (!pkgOffer) {
        return secureJson({ error: `Unknown package: ${package_key}`, request_id: requestId }, { status: 400 });
      }
    } else {
      pkgOffer = findPackageByProductIds(requestedProductIds);
    }

    // Build line items and order items
    let lineItems = [];
    let orderItems = [];
    let totalSetup = 0;
    let totalMonthly = 0;
    let packageKey = "custom_service_bundle";
    let packageLabel = "Custom Service Bundle";

    if (pkgOffer) {
      // Package checkout — single setup + single monthly line item
      packageKey = pkgOffer.package_key;
      packageLabel = pkgOffer.name;
      totalSetup = pkgOffer.setup_total;
      totalMonthly = pkgOffer.monthly_total;

      lineItems = [
        { price: pkgOffer.setup_price_id, quantity: 1 },
        { price: pkgOffer.monthly_price_id, quantity: 1 },
      ];

      orderItems = pkgOffer.included_service_keys.map((serviceKey) => {
        const svc = SERVICE_BY_KEY[serviceKey];
        return {
          product_id: svc?.product_id || "",
          product_name: svc?.name || serviceKey,
          service_key: serviceKey,
          setup_fee: svc?.setup_fee || 0,
          monthly_fee: svc?.monthly_fee || 0,
          status: "pending",
          service_access_status: "active",
        };
      });
    } else {
      // Individual service checkout
      const seen = new Set();
      for (const productId of requestedProductIds) {
        if (seen.has(productId)) continue;
        seen.add(productId);
        const svc = SERVICE_BY_PRODUCT_ID[productId];
        if (!svc) continue;

        totalSetup += svc.setup_fee;
        totalMonthly += svc.monthly_fee;

        lineItems.push({ price: svc.setup_price_id, quantity: 1 });
        lineItems.push({ price: svc.monthly_price_id, quantity: 1 });

        orderItems.push({
          product_id: svc.product_id,
          product_name: svc.name,
          service_key: svc.service_key,
          setup_fee: svc.setup_fee,
          monthly_fee: svc.monthly_fee,
          status: "pending",
          service_access_status: "active",
        });
      }
    }

    if (!lineItems.length) {
      return secureJson({ error: "No valid products selected for checkout", request_id: requestId }, { status: 400 });
    }

    console.log("[createCheckoutSession] checkout accepted", {
      requestId,
      packageKey,
      packageLabel,
      productCount: orderItems.length,
      totalSetup,
      totalMonthly,
    });

    // FIX #8: Enforce E.164 phone normalization before persisting
    const { normalizePhoneToE164 } = await import("../lib/phoneNormalization.js");
    const normalizedPhone = customer_phone ? normalizePhoneToE164(customer_phone) : "";
    
    if (customer_phone && !normalizedPhone) {
      return secureJson({ error: "Invalid phone number format", request_id: requestId }, { status: 400 });
    }

    // Create Order record with idempotency + normalized phone
    const order = await base44.asServiceRole.entities.Order.create({
      customer_email,
      customer_name: customer_name || "",
      customer_phone: normalizedPhone,
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      business_name: business_name || "",
      items: orderItems,
      total_setup: totalSetup,
      total_monthly: totalMonthly,
      payment_status: "pending",
      order_status: "pending_payment",
      selected_package_type: pkgOffer?.package_key || null,
      package_type: pkgOffer?.package_key || null,
      plan_type: packageLabel,
      idempotency_key: requestId,
    });
    createdOrderId = order.id;

    const origin = req.headers.get("origin") || "https://app.clientsurgesystems.com";
    const finalSuccessUrl = success_url || `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${origin}/store`;

    // FIX #6: Ensure Stripe metadata includes app_id + request_id for traceability + idempotency
    const sessionMetadata = {
      order_id: order.id,
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      base44_app_id: Deno.env.get("BASE44_APP_ID"),
      customer_name: customer_name || "",
      customer_phone: normalizedPhone,
      business_name: business_name || "",
      package_key: pkgOffer?.package_key || "",
      package_type: pkgOffer?.package_key || "",
      plan_type: packageLabel,
      request_id: requestId,
      idempotency_key: requestId,
      deploy_immediately: deploy_immediately ? "true" : "false",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customer_email,
      line_items: lineItems,
      subscription_data: {
        metadata: {
          order_id: order.id,
          package_key: pkgOffer?.package_key || "",
          plan_type: packageLabel,
          request_id: requestId,
        },
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: sessionMetadata,
    });

    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
    });

    console.log("[createCheckoutSession] session created", {
      requestId,
      orderId: order.id,
      sessionId: session.id,
      livemode: session.livemode,
    });

    return secureJson({ url: session.url, session_id: session.id, request_id: requestId });
  } catch (error) {
    if (createdOrderId) {
      try {
        const failedMessage = error instanceof Error ? error.message : String(error);
        await createClientFromRequest(req).asServiceRole.entities.Order.update(createdOrderId, {
          payment_status: "failed",
          order_status: "failed",
          pipeline_error: failedMessage,
          notes: `Checkout session creation failed: ${failedMessage}`,
        });
      } catch {
        // Preserve the original error response even if order cleanup fails.
      }
    }
    console.error("[createCheckoutSession] error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
    return secureJson(
      { error: "Checkout failed. Please try again or contact support.", code: "checkout_error", request_id: requestId },
      { status: 500 }
    );
  }
});