import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  SYNC RISK: This CANONICAL_PRODUCTS registry must match lib/salesCatalog.js
// Run a diff before any price change. Mismatch = wrong prices at checkout.
// IMPORTANT: TEMPORARY MIRROR OF lib/salesCatalog.js
// Until Base44 supports reliable shared imports in Deno functions, update
// Stripe price IDs in BOTH lib/salesCatalog.js AND this registry.
// Any mismatch between the two files will cause checkout to serve wrong prices.
// ─────────────────────────────────────────────────────────────────────────────
//
// FRONTEND → BACKEND RESPONSIBILITY BOUNDARY:
//   Frontend (Store UI): Expands packages into individual product_ids
//   Backend (this function): Validates and deduplicates service_keys
//
// Example flow:
//   1. Frontend calculates package offer (e.g., Growth System)
//   2. Frontend sends expanded product_ids (4 individual services) to this function
//   3. This function validates prices and creates Order with service_keys
//   4. initializeInstallOS then validates and deduplicates service_keys further
//
// The backend does NOT expand packages—it expects the frontend to send
// the expanded product_ids. This function validates what it receives but
// assumes the frontend has already handled package logic.
// ─────────────────────────────────────────────────────────────────────────────
const CANONICAL_PRODUCTS = [
  { product_id: "prod_UNi5RHiKNSTfQl", service_key: "instant_lead_response",  name: "Instant Lead Response",       setup_fee: 297, monthly_fee: 97,  setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE", monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc" },
  { product_id: "prod_UNi5QL0bQl98If", service_key: "missed_call_text_back",   name: "Missed Call Text-Back",        setup_fee: 197, monthly_fee: 67,  setup_price_id: "price_1TOwfiB9GU5ysJqEJuEDhpKS", monthly_price_id: "price_1TOwfiB9GU5ysJqE8knUfswZ" },
  { product_id: "prod_UNi5N0l5MtaV0R", service_key: "nurture_sequence_14d",    name: "14-Day Nurture Sequence",      setup_fee: 397, monthly_fee: 127, setup_price_id: "price_1TOwfiB9GU5ysJqEtwQAmCuN", monthly_price_id: "price_1TOwfiB9GU5ysJqEsoZmFl6D" },
  { product_id: "prod_UNi5fLL2SyJJdP", service_key: "ai_booking_agent",        name: "AI Booking Agent",             setup_fee: 497, monthly_fee: 147, setup_price_id: "price_1TOwfiB9GU5ysJqEij8Qq9rd", monthly_price_id: "price_1TOwfiB9GU5ysJqEKhYvS71r" },
  { product_id: "prod_UNi5PWv05ECzXI", service_key: "lead_reactivation",       name: "Old Lead Reactivation",        setup_fee: 297, monthly_fee: 97,  setup_price_id: "price_1TOwfiB9GU5ysJqExMxwfoFr", monthly_price_id: "price_1TOwfiB9GU5ysJqEfsJEvPcI" },
  { product_id: "prod_UNi5dvOUm6Fi9i", service_key: "review_request",          name: "Review Request Automation",    setup_fee: 197, monthly_fee: 67,  setup_price_id: "price_1TOwfiB9GU5ysJqEO8byuwlT", monthly_price_id: "price_1TOwfiB9GU5ysJqEryd66HuE" },
];

const PRODUCT_BY_ID = Object.fromEntries(CANONICAL_PRODUCTS.map((p) => [p.product_id, p]));

// ── Startup validation: detect registry integrity issues immediately ──────────
(function validateRegistry() {
  const seenIds = new Set();
  const seenKeys = new Set();
  for (const p of CANONICAL_PRODUCTS) {
    if (!p.product_id) {
      console.error("[Registry] INVALID: product entry missing product_id", p);
    } else if (seenIds.has(p.product_id)) {
      console.error(`[Registry] DUPLICATE product_id detected: ${p.product_id}`);
    } else {
      seenIds.add(p.product_id);
    }
    if (!p.service_key) {
      console.error(`[Registry] INVALID: ${p.product_id} missing service_key`);
    } else if (seenKeys.has(p.service_key)) {
      console.error(`[Registry] DUPLICATE service_key detected: ${p.service_key}`);
    } else {
      seenKeys.add(p.service_key);
    }
  }
  if (seenIds.size !== CANONICAL_PRODUCTS.length) {
    console.error("[Registry] Registry has duplicate or missing product_ids — checkout may behave incorrectly");
  } else {
    console.log(`[Registry] OK — ${CANONICAL_PRODUCTS.length} products validated`);
  }
})();

// Normalize install configuration for a new order
function normalizeInstallConfiguration(orderItems = []) {
  const config = { services: {} };
  for (const item of orderItems) {
    if (item.service_key) config.services[item.service_key] = {};
  }
  return config;
}

// Helper: Compare sets for exact equality
function setsEqual(setA, setB) {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

// Detect package type from service_keys (EXACT MATCHING)
function detectPackageType(serviceKeys = []) {
  const keySet = new Set(serviceKeys);

  // Pro System: EXACTLY these 6 services
  const proSet = new Set([
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
    "lead_reactivation",
    "review_request",
  ]);
  if (setsEqual(keySet, proSet)) {
    return "elite_system";
  }

  // Growth System: EXACTLY these 4 services
  const growthSet = new Set([
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
  ]);
  if (setsEqual(keySet, growthSet)) {
    return "growth_system";
  }

  // Starter System: EXACTLY these 2 services
  const starterSet = new Set(["instant_lead_response", "ai_booking_agent"]);
  if (setsEqual(keySet, starterSet)) {
    return "starter_system";
  }

  // Any other combination (including partial + add-ons)
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      items,
      product_ids,
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      success_url,
      cancel_url,
      package_key,
      package_type,
    } = await req.json();

    const requestedProductIds = Array.isArray(product_ids) && product_ids.length
      ? product_ids
      : Array.isArray(items)
      ? items.map((item) => item?.product_id || item).filter(Boolean)
      : [];

    if (!requestedProductIds.length || !customer_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve canonical products — skip unknowns
    const resolvedProducts = requestedProductIds
      .map((id) => PRODUCT_BY_ID[id])
      .filter(Boolean);

    if (!resolvedProducts.length) {
      return Response.json({ error: "No valid products found for checkout" }, { status: 400 });
    }

    // ── TASK 2: Validate pricing data before creating line items ──
    const validationErrors = [];
    for (const p of resolvedProducts) {
      if (!p.name) {
        validationErrors.push(`Product ${p.product_id} missing name`);
      }
      if (p.setup_fee === undefined || p.setup_fee === null) {
        validationErrors.push(`Product ${p.name} missing setup_fee`);
      } else {
        const setupFeeCents = Math.round(Number(p.setup_fee) * 100);
        if (isNaN(setupFeeCents) || setupFeeCents <= 0) {
          validationErrors.push(`Product ${p.name} has invalid setup_fee: ${p.setup_fee}`);
        }
        if (setupFeeCents < 50) {
          validationErrors.push(`Product ${p.name} setup_fee too low (minimum $0.50, got $${(setupFeeCents / 100).toFixed(2)})`);
        }
      }
    }
    if (validationErrors.length) {
      console.error(`[Checkout] Validation failed: ${validationErrors.join("; ")}`);
      return Response.json({
        error: "Invalid product pricing configuration. Please contact support.",
      }, { status: 400 });
    }

    console.log(`[Checkout] Selected products: ${resolvedProducts.map((p) => p.product_id).join(", ")}`);

    const total_setup = resolvedProducts.reduce((sum, p) => sum + p.setup_fee, 0);
    const total_monthly = resolvedProducts.reduce((sum, p) => sum + p.monthly_fee, 0);

    const orderItems = resolvedProducts.map((p) => ({
      product_id: p.product_id,
      product_name: p.name,
      setup_price_id: p.setup_price_id,
      monthly_price_id: p.monthly_price_id,
      setup_fee: p.setup_fee,
      monthly_fee: p.monthly_fee,
      service_key: p.service_key,
      status: "pending",
      service_access_status: "active",
    }));

    // Capture user's selected package (if provided by frontend)
    const selectedPackage = package_key || package_type;
    if (selectedPackage) {
      console.log(`[Checkout] User selected package: ${selectedPackage}`);
    } else {
      console.log(`[Checkout] User did not select a predefined package`);
    }

    // Detect which package (if any) was purchased from service_keys (exact matching)
    const serviceKeys = orderItems.map((item) => item.service_key);
    const detectedPackageType = detectPackageType(serviceKeys);

    if (detectedPackageType) {
      console.log(`[Checkout] Exact package match: ${detectedPackageType}`);
    } else {
      console.log(`[Checkout] No exact package match; custom bundle (services: ${serviceKeys.join(", ")})`);
    }

    const order = await base44.asServiceRole.entities.Order.create({
      customer_email,
      customer_name,
      customer_phone: customer_phone || "",
      business_name,
      items: orderItems,
      total_setup,
      total_monthly,
      install_configuration: normalizeInstallConfiguration(orderItems),
      payment_status: "pending",
      order_status: "pending_payment",
      plan_type: "Custom Service Bundle",
      selected_package_type: selectedPackage || null,
      package_type: detectedPackageType,
    });

    // ── TASK 1: Build line_items using inline price_data instead of Stripe Price IDs ──
    const line_items = resolvedProducts.map((p) => {
      const unit_amount = Math.round(Number(p.setup_fee) * 100);
      console.log(`[Checkout] Line item: ${p.name} (${p.product_id}) → $${(unit_amount / 100).toFixed(2)}`);
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: p.name,
            description: p.description || undefined,
          },
          unit_amount,
        },
        quantity: 1,
      };
    });

    // ── TASK 3: Create Stripe Checkout Session with inline pricing ──
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email,
      line_items,
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      metadata: {
        order_id: order.id,
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        customer_name,
        customer_phone: customer_phone || "",
        business_name,
        items_json: JSON.stringify(resolvedProducts.map((p) => ({
          product_id: p.product_id,
          product_name: p.name,
          service_key: p.service_key,
        }))),
      },
    });

    console.log(`[Checkout] Stripe session created: ${session.id} for order ${order.id}`);

    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
    });

    console.log(`[Checkout] Order ${order.id} updated with Stripe session ${session.id}`);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});