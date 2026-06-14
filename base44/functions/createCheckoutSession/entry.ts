import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getStripeClient, safeStripeError } from "./stripeInit.local.js";
import { assertCheckoutCapacityAvailable } from "./checkoutCapacity.shared.js";
import { getTrackedServiceConfig, normalizeInstallConfiguration } from "./installPipeline.shared.js";
import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  buildStripeLineItemsForPricingSummary,
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

    const requestedProductIds = Array.isArray(product_ids) && product_ids.length
      ? product_ids
      : Array.isArray(items)
      ? items.map((item) => item?.product_id || item).filter(Boolean)
      : [];

    if (!requestedProductIds.length || !customer_email) {
      return secureJson({ error: "Missing required fields" }, { status: 400 });
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

    const line_items = buildStripeLineItemsForPricingSummary(pricingSummary);

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
      package_stripe_product_id: pricingSummary.package_offer?.stripe_product_id || "",
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
