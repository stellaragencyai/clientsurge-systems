import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getTrackedServiceConfig, normalizeInstallConfiguration } from "../_shared/installPipeline.js";
import { buildPricingSummaryForProducts, buildStoredPricingSummary } from "../../../src/lib/salesCatalog.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

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
    } = await req.json();

    const requestedProductIds = Array.isArray(product_ids) && product_ids.length
      ? product_ids
      : Array.isArray(items)
      ? items.map((item) => item?.product_id || item).filter(Boolean)
      : [];

    if (!requestedProductIds.length || !customer_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pricingSummary = buildPricingSummaryForProducts(requestedProductIds);
    if (!pricingSummary.priced_items.length) {
      return Response.json({ error: "No canonical services selected for checkout" }, { status: 400 });
    }

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
      business_name,
      items: orderItems,
      total_setup: pricingSummary.total_setup,
      total_monthly: pricingSummary.total_monthly,
      pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
      install_configuration: normalizeInstallConfiguration({}, orderItems),
      payment_status: "pending",
      order_status: "pending_payment",
      plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle",
    });

    const line_items = pricingSummary.priced_items.flatMap((item) => ([
      {
        price: item.setup_price_id,
        quantity: 1,
      },
      {
        price: item.monthly_price_id,
        quantity: 1,
      },
    ]));

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: customer_email,
      line_items,
      subscription_data: {
        metadata: {
          order_id: order.id,
          plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle",
          package_key: pricingSummary.package_offer?.package_key || "",
          services_json: JSON.stringify(
            pricingSummary.priced_items.map((item) => ({
              product_id: item.product_id,
              product_name: item.name,
              service_key: item.service_key,
            }))
          ),
        },
      },
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/store`,
      metadata: {
        order_id: order.id,
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
      },
    });
    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
