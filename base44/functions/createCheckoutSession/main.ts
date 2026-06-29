import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getStripeClient, safeStripeError } from "./stripeInit.local.js";
import { assertCheckoutCapacityAvailable } from "./checkoutCapacity.shared.js";
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

function buildTestStripeLineItems(pricingSummary) {
  const packageOffer = pricingSummary?.package_offer || null;
  const addOnServiceKeys = pricingSummary?.add_on_service_keys || [];

  if (!packageOffer?.package_key) {
    throw new Error("Test checkout currently requires a Starter, Growth, or Pro package bundle.");
  }

  if (addOnServiceKeys.length > 0) {
    throw new Error("Test checkout currently supports package bundles only; add-on checkout is not enabled.");
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
          name: `${packageOffer.name} Setup and Installation [TEST]`,
          metadata: {
            ...metadata,
            charge_type: "setup_fee",
            billing_phase: "initial",
          },
        },
        unit_amount: toStripeAmount(pricingSummary.total_setup),
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
  try {
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
    } = await req.json();

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

    if (!customer_email) {
      return secureJson(
        { error: "Customer email is required", code: "customer_email_required", request_id: requestId },
        { status: 400 }
      );
    }

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
    console.log("[createCheckoutSession] checkout request accepted", {
      requestId,
      requestedProductCount: requestedProductIds.length,
      requestedPackageKey: requestedPackage?.package_key || "",
      packageType,
      livemode,
      stripeMode,
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

    const order = await base44.asServiceRole.entities.Order.create({
      customer_email,
      customer_name,
      customer_phone: customer_phone || "",
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      business_name,
      items: orderItems,
      total_setup: pricingSummary.total_setup,
      total_monthly: pricingSummary.total_monthly,
      pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
      install_configuration: normalizeInstallConfiguration({}, orderItems),
      payment_status: "pending",
      order_status: "pending_payment",
      selected_package_type: pricingSummary.package_offer?.package_key || null,
      package_type: pricingSummary.package_offer?.package_key || null,
      plan_type: packageLabel,
    });
    createdOrderId = order.id;

    const line_items = stripeMode === "test"
      ? buildTestStripeLineItems(pricingSummary)
      : buildStripeLineItemsForPricingSummary(pricingSummary);

    const sessionMetadata = {
      order_id: order.id,
      lead_id: lead_id || crm_lead_id || "",
      crm_lead_id: crm_lead_id || lead_id || "",
      website_lead_id: website_lead_id || "",
      base44_app_id: Deno.env.get("BASE44_APP_ID"),
      customer_name,
      customer_phone: customer_phone || "",
      business_name,
      items_json: JSON.stringify(
        pricingSummary.priced_items.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          service_key: item.service_key,
        }))
      ),
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
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customer_email,
      line_items,
      subscription_data: {
        metadata: {
          order_id: order.id,
          lead_id: lead_id || crm_lead_id || "",
          crm_lead_id: crm_lead_id || lead_id || "",
          website_lead_id: website_lead_id || "",
          plan_type: packageLabel,
          package_key: pricingSummary.package_offer?.package_key || "",
          package_type: pricingSummary.package_offer?.package_key || "",
          selected_package_type: pricingSummary.package_offer?.package_key || "",
          stripe_mode: stripeMode,
          stripe_livemode: livemode ? "true" : "false",
          services_json: JSON.stringify(
            pricingSummary.priced_items.map((item) => ({
              product_id: item.product_id,
              product_name: item.name,
              service_key: item.service_key,
            }))
          ),
          request_id: requestId,
        },
      },
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      metadata: sessionMetadata,
    });
    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
    });

    console.log("[createCheckoutSession] session created", {
      requestId,
      orderId: order.id,
      sessionId: session.id,
      status: session.status,
      livemode: session.livemode,
      packageType,
      stripeMode,
    });

    return secureJson({ url: session.url, session_id: session.id, request_id: requestId, stripe_mode: stripeMode, livemode });
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