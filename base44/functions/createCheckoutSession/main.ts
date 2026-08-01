import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getStripeClient, safeStripeError } from "../_shared/stripeInit.js";
import { assertCheckoutCapacityAvailable } from "./checkoutCapacity.shared.js";
import { buildCheckoutRedirectUrls } from "./checkoutUrls.shared.js";
import { getTrackedServiceConfig, normalizeInstallConfiguration } from "./installPipeline.shared.js";
import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  buildStripeLineItemsForPricingSummary,
  getPackageOffer,
  getPackageServices,
} from "./salesCatalog.shared.js";

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}): Response {
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

function toStripeAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function isTruthy(value) {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value, maxLength = 240) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isCheckoutSmokeRequest({ customer_email, smoke_test, source }) {
  const email = normalizeEmail(customer_email);
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

function buildTestStripeLineItems(pricingSummary) {
  const packageOffer = pricingSummary?.package_offer || null;
  const addOnServiceKeys = pricingSummary?.add_on_service_keys || [];

  if (!packageOffer?.package_key) {
    throw new Error("Test checkout currently requires a Starter, Growth, or Pro package bundle.");
  }

  if (addOnServiceKeys.length > 0) {
    throw new Error("Test checkout currently supports package bundles only; add-on checkout is not enabled.");
  }

  const implementationFee = Number(packageOffer?.implementation_fee || 0);
  if (!implementationFee || implementationFee <= 0) {
    throw new Error("Professional AI Implementation fee is not configured for this package.");
  }

  const metadata = {
    catalog_version: "canonical_sales_catalog_v1",
    package_key: packageOffer.package_key,
    package_display_name: packageOffer.name,
    stripe_mode: "test",
  };

  return [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${packageOffer.name} — Professional AI Implementation (One-Time) [TEST]`,
          metadata: {
            ...metadata,
            charge_type: "implementation_fee",
            billing_phase: "initial",
          },
        },
        unit_amount: toStripeAmount(implementationFee),
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${packageOffer.name} Monthly Support [TEST]`,
          metadata: {
            ...metadata,
            charge_type: "monthly_subscription",
            billing_phase: "recurring",
          },
        },
        recurring: {
          interval: "month",
        },
        unit_amount: toStripeAmount(pricingSummary.total_monthly),
      },
      quantity: 1,
    },
  ];
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  let createdOrderId = null;

  if (req.method !== "POST") {
    return secureJson(
      { error: "Method not allowed", code: "method_not_allowed", request_id: requestId },
      { status: 405, headers: { Allow: "POST" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return secureJson(
      { error: "Invalid JSON body", code: "invalid_json", request_id: requestId },
      { status: 400 }
    );
  }

  try {
    const {
      items,
      product_ids,
      package_key,
      customer_name,
      customer_email,
      customer_phone,
      business_name,
      industry,
      lead_id,
      crm_lead_id,
      website_lead_id,
      success_url,
      cancel_url,
      deploy_immediately,
      smoke_test,
      source,
    } = body || {};

    const normalizedEmail = normalizeEmail(customer_email);
    const normalizedCustomerName = normalizeText(customer_name);
    const normalizedPhone = normalizeText(customer_phone, 80);
    const normalizedBusinessName = normalizeText(business_name);
    const normalizedIndustry = normalizeText(industry, 120);
    const normalizedSource = normalizeText(source || "product_signup", 120) || "product_signup";
    const isSmokeCheckout = isCheckoutSmokeRequest({
      customer_email: normalizedEmail,
      smoke_test,
      source: normalizedSource,
    });

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return secureJson(
        { error: "A valid customer email is required", code: "customer_email_required", request_id: requestId },
        { status: 400 }
      );
    }

    if (!normalizedCustomerName) {
      return secureJson(
        { error: "Customer name is required", code: "customer_name_required", request_id: requestId },
        { status: 400 }
      );
    }

    if (!normalizedBusinessName) {
      return secureJson(
        { error: "Business name is required", code: "business_name_required", request_id: requestId },
        { status: 400 }
      );
    }

    let stripeContext;
    try {
      stripeContext = getStripeClient();
    } catch (error) {
      const safeError = safeStripeError(error);
      console.error("[createCheckoutSession] Stripe is not configured", {
        requestId,
        code: safeError.code,
      });
      return secureJson(
        { error: safeError.userMessage, code: safeError.code, request_id: requestId },
        { status: safeError.status }
      );
    }

    const { stripe, livemode, mode: stripeMode } = stripeContext;
    const base44 = createClientFromRequest(req);

    // Product Signup sends package_key only. Resolve it here so /product-signup
    // and older cart/product_ids payloads both hit the same canonical checkout path.
    const requestedPackage = package_key ? getPackageOffer(package_key) : null;
    if (package_key && !requestedPackage) {
      return secureJson(
        {
          error: `Unknown package selected: ${package_key}`,
          code: "unknown_package",
          request_id: requestId,
        },
        { status: 400 }
      );
    }

    const requestedProductIds = requestedPackage
      ? getPackageServices(requestedPackage.package_key)
          .map((service) => service?.product_id)
          .filter(Boolean)
      : Array.isArray(product_ids) && product_ids.length
      ? product_ids
      : Array.isArray(items)
      ? items.map((item) => item?.product_id || item).filter(Boolean)
      : [];

    if (!requestedProductIds.length) {
      return secureJson(
        { error: "Select at least one product or package", code: "checkout_selection_required", request_id: requestId },
        { status: 400 }
      );
    }

    const capacity = await assertCheckoutCapacityAvailable({ base44 });
    if (!capacity.ok) {
      console.warn("[createCheckoutSession] capacity limit reached", {
        requestId,
        active_orders: capacity.active_orders,
        capacity_limit: capacity.capacity_limit,
      });
      return secureJson(
        {
          error: capacity.reason,
          code: "checkout_capacity_full",
          active_orders: capacity.active_orders,
          capacity_limit: capacity.capacity_limit,
          request_id: requestId,
        },
        { status: 409 }
      );
    }

    const pricingSummary = buildPricingSummaryForProducts(requestedProductIds);
    if (!pricingSummary.priced_items.length) {
      return secureJson({ error: "No canonical services selected for checkout", request_id: requestId }, { status: 400 });
    }

    const packageType = pricingSummary.package_offer?.package_key || "custom_service_bundle";
    const packageLabel = pricingSummary.package_offer?.name || "Custom Service Bundle";
    const redirectUrls = buildCheckoutRedirectUrls({
      originHeader: req.headers.get("origin") || "",
      requestUrl: req.url,
      packageKey: packageType,
      successUrl: success_url,
      cancelUrl: cancel_url,
    });

    console.log("[createCheckoutSession] checkout request accepted", {
      requestId,
      requestedProductCount: requestedProductIds.length,
      requestedPackageKey: requestedPackage?.package_key || "",
      packageType,
      livemode,
      stripeMode,
      isSmokeCheckout,
      checkoutOrigin: redirectUrls.origin,
    });

    const orderItems = pricingSummary.priced_items.map((item) => ({
      product_id: item.product_id,
      product_name: item.name,
      setup_price_id: item.setup_price_id,
      monthly_price_id: item.monthly_price_id,
      setup_fee: item.setup_fee,
      monthly_fee: item.monthly_fee,
      compare_at_setup_fee: item.compare_at_setup_fee,
      compare_at_monthly_fee: item.compare_at_monthly_fee,
      setup_discount_fee: item.setup_discount_fee,
      monthly_discount_fee: item.monthly_discount_fee,
      source_package_key: item.source_package_key,
      source_package_name: item.source_package_name,
      status: "pending",
      service_key: getTrackedServiceConfig(item.product_id)?.service_key,
      tracking_enabled: Boolean(getTrackedServiceConfig(item.product_id)),
      service_access_status: "active",
    }));

    const orderPayload = {
      customer_email: normalizedEmail,
      customer_name: normalizedCustomerName,
      customer_phone: normalizedPhone,
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      business_name: normalizedBusinessName,
      industry: normalizedIndustry,
      items: orderItems,
      total_setup: pricingSummary.total_setup,
      total_monthly: pricingSummary.total_monthly,
      pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
      install_configuration: normalizeInstallConfiguration({}, orderItems),
      payment_status: "pending",
      payment_source: "stripe",
      order_status: "pending_payment",
      selected_package_type: pricingSummary.package_offer?.package_key || null,
      package_type: pricingSummary.package_offer?.package_key || null,
      plan_type: packageLabel,
    };

    if (isSmokeCheckout) {
      Object.assign(orderPayload, smokeOrderFields(requestId));
    }

    const order = await base44.asServiceRole.entities.Order.create(orderPayload);
    createdOrderId = order.id;

    const line_items = stripeMode === "test"
      ? buildTestStripeLineItems(pricingSummary)
      : buildStripeLineItemsForPricingSummary(pricingSummary);

    const selectedServices = pricingSummary.priced_items.map((item) => ({
      product_id: item.product_id,
      product_name: item.name,
      service_key: item.service_key,
    }));

    const sessionMetadata = {
      order_id: order.id,
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      base44_app_id: Deno.env.get("BASE44_APP_ID"),
      customer_name: normalizedCustomerName,
      customer_phone: normalizedPhone,
      business_name: normalizedBusinessName,
      industry: normalizedIndustry,
      items_json: JSON.stringify(selectedServices),
      package_key: pricingSummary.package_offer?.package_key || "",
      package_type: pricingSummary.package_offer?.package_key || "",
      selected_package_type: pricingSummary.package_offer?.package_key || "",
      plan_type: packageLabel,
      package_stripe_product_id: stripeMode === "test" ? "price_data_test_mode" : pricingSummary.package_offer?.stripe_product_id || "",
      requested_package_key: requestedPackage?.package_key || "",
      stripe_mode: stripeMode,
      stripe_livemode: livemode ? "true" : "false",
      request_id: requestId,
      deploy_immediately: deploy_immediately ? "true" : "false",
      source: normalizedSource,
      smoke_test: isSmokeCheckout ? "true" : "false",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: normalizedEmail,
      line_items,
      subscription_data: {
        // Charge only the one-time setup line item today. The recurring line item
        // begins billing 30 days after checkout.
        trial_period_days: 30,
        trial_settings: {
          end_behavior: { missing_payment_method: "cancel" },
        },
        metadata: {
          order_id: order.id,
          lead_id: lead_id || crm_lead_id || "",
          crm_lead_id: crm_lead_id || lead_id || "",
          website_lead_id: website_lead_id || "",
          plan_type: packageLabel,
          package_key: pricingSummary.package_offer?.package_key || "",
          package_type: pricingSummary.package_offer?.package_key || "",
          selected_package_type: pricingSummary.package_offer?.package_key || "",
          customer_email: normalizedEmail,
          business_name: normalizedBusinessName,
          industry: normalizedIndustry,
          stripe_mode: stripeMode,
          stripe_livemode: livemode ? "true" : "false",
          services_json: JSON.stringify(selectedServices),
          request_id: requestId,
          source: normalizedSource,
          smoke_test: isSmokeCheckout ? "true" : "false",
        },
      },
      success_url: redirectUrls.success_url,
      cancel_url: redirectUrls.cancel_url,
      metadata: sessionMetadata,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
    });

    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
      stripe_customer_id: session.customer || undefined,
      stripe_subscription_id: session.subscription || undefined,
      checkout_origin: redirectUrls.origin,
      checkout_cancel_url: redirectUrls.cancel_url,
    });

    console.log("[createCheckoutSession] session created", {
      requestId,
      orderId: order.id,
      sessionId: session.id,
      status: session.status,
      livemode: session.livemode,
      packageType,
      stripeMode,
      isSmokeCheckout,
    });

    return secureJson({
      url: session.url,
      session_id: session.id,
      request_id: requestId,
      stripe_mode: stripeMode,
      livemode,
      smoke_test: isSmokeCheckout,
    });
  } catch (error) {
    if (createdOrderId) {
      try {
        const failedMessage = error instanceof Error ? error.message : String(error);
        await createClientFromRequest(req).asServiceRole.entities.Order.update(createdOrderId, {
          payment_status: "failed",
          pipeline_error: failedMessage,
          notes: `Checkout session creation failed (request_id: ${requestId}): ${failedMessage}`,
        });
      } catch {
        // Preserve the original Stripe error response even if order cleanup fails.
      }
    }
    const safeError = safeStripeError(error, "Checkout failed. Please try again or contact support.");
    console.error("[createCheckoutSession] Checkout error", {
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
