import Stripe from "npm:stripe@14";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

import {
  buildCheckoutOrderPayload,
  buildStripeCheckoutSessionPayload,
  normalizeCheckoutLegalAcceptance,
  resolveCheckoutProducts,
} from "../_shared/checkoutBilling.js";
import { buildPricingSummaryForProducts } from "../../../src/lib/salesCatalog.js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredCheckoutError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
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
      legal_acceptance,
      success_url,
      cancel_url,
    } = await req.json();

    const customerName = cleanString(customer_name);
    const customerEmail = cleanString(customer_email);
    const businessName = cleanString(business_name);

    if (!customerName || !customerEmail || !businessName) {
      return requiredCheckoutError("Customer name, email, and business name are required.");
    }

    const selection = resolveCheckoutProducts({ items, product_ids });

    if (!selection.requestedProductIds.length) {
      return requiredCheckoutError("Select at least one store service before checkout.");
    }

    if (selection.invalidProductIds.length > 0) {
      return requiredCheckoutError(
        `Unknown product(s): ${selection.invalidProductIds.join(", ")}.`
      );
    }

    if (selection.unavailableProducts.length > 0) {
      return requiredCheckoutError(
        `${selection.unavailableProducts.map((product) => product.name).join(", ")} cannot be purchased directly from the public store.`
      );
    }

    if (!selection.purchaseableProducts.length) {
      return requiredCheckoutError("No store-purchaseable services were selected.");
    }

    const pricingSummary = buildPricingSummaryForProducts(
      selection.purchaseableProducts.map((product) => product.product_id)
    );

    if (!pricingSummary.priced_items.length) {
      return requiredCheckoutError("The selected services are not eligible for checkout.");
    }

    const missingPriceProducts = pricingSummary.priced_items.filter(
      (product) => !cleanString(product.setup_price_id) || !cleanString(product.monthly_price_id)
    );

    if (missingPriceProducts.length > 0) {
      return requiredCheckoutError(
        `Stripe pricing is incomplete for: ${missingPriceProducts.map((product) => product.name).join(", ")}.`
      );
    }

    const legalAcceptance = normalizeCheckoutLegalAcceptance({
      legalAcceptance: legal_acceptance,
      customerName,
      customerEmail,
      requestHeaders: req.headers,
    });

    const order = await base44.asServiceRole.entities.Order.create(
      buildCheckoutOrderPayload({
        customerName,
        customerEmail,
        customerPhone: cleanString(customer_phone),
        businessName,
        pricedItems: pricingSummary.priced_items,
        legalAcceptance,
      })
    );

    const session = await stripe.checkout.sessions.create(
      buildStripeCheckoutSessionPayload({
        order,
        pricedItems: pricingSummary.priced_items,
        customerName,
        customerEmail,
        customerPhone: cleanString(customer_phone),
        businessName,
        successUrl: cleanString(success_url),
        cancelUrl: cleanString(cancel_url),
        origin: req.headers.get("origin") || "https://clientsurgesystems.com",
      })
    );

    await base44.asServiceRole.entities.Order.update(order.id, {
      stripe_session_id: session.id,
    });

    return Response.json({
      url: session.url,
      session_id: session.id,
      order_id: order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
