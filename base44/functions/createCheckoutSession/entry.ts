import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { getTrackedServiceConfig, normalizeInstallConfiguration } from "../_shared/installPipeline.js";
import { buildPricingSummaryForProducts, buildStoredPricingSummary } from "../../../src/lib/salesCatalog.js";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function maskSecret(secret = "") {
  if (!secret) return "missing";
  if (secret.length <= 8) return `${secret.slice(0, 2)}***`;
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

async function resolveStripeAccountSummary() {
  if (!stripe) {
    return {
      secret_present: false,
      secret_prefix: "missing",
      secret_fingerprint: "missing",
      livemode: null,
      account_id: null,
      business_name: null,
    };
  }

  try {
    const account = await stripe.accounts.retrieve();
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: Boolean(account?.livemode),
      account_id: account?.id || null,
      business_name: account?.business_profile?.name || account?.settings?.dashboard?.display_name || null,
    };
  } catch (error) {
    return {
      secret_present: true,
      secret_prefix: stripeSecretKey.startsWith("sk_test_") ? "sk_test_" : stripeSecretKey.startsWith("sk_live_") ? "sk_live_" : "unknown",
      secret_fingerprint: maskSecret(stripeSecretKey),
      livemode: null,
      account_id: null,
      business_name: null,
      account_lookup_error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
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

    if (!stripe) {
      console.error("[createCheckoutSession] Stripe is not configured", {
        requestId,
        secret_present: false,
      });
      return Response.json({ error: "Stripe is not configured", request_id: requestId }, { status: 500 });
    }

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
      return Response.json({ error: "No canonical services selected for checkout", request_id: requestId }, { status: 400 });
    }

    const stripeAccount = await resolveStripeAccountSummary();
    console.log("[createCheckoutSession] request received", {
      requestId,
      requestedProductIds,
      customer_email,
      business_name,
      success_url,
      cancel_url,
      stripeAccount,
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

    const sessionMetadata = {
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
      request_id: requestId,
    };

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
      sessionUrl: session.url,
      mode: session.mode,
      status: session.status,
      customer: session.customer,
      subscription: session.subscription,
      livemode: session.livemode,
      lineItemPriceIds: line_items.map((item) => item.price),
    });

    return Response.json({ url: session.url, session_id: session.id, request_id: requestId });
  } catch (error) {
    console.error("[createCheckoutSession] Checkout error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json({ error: error instanceof Error ? error.message : "Checkout failed", request_id: requestId }, { status: 500 });
  }
});
