import {
  CHECKOUT_LEGAL_DOCUMENTS,
  CHECKOUT_LEGAL_VERSION,
} from "../../../src/lib/legalDocuments.js";
import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  getServiceProductById,
} from "../../../src/lib/salesCatalog.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function readHeader(headers, key) {
  if (!headers || typeof headers.get !== "function") {
    return "";
  }

  return cleanString(headers.get(key));
}

export function getRequestedCheckoutProductIds({ items, product_ids }) {
  if (Array.isArray(product_ids) && product_ids.length > 0) {
    return unique(product_ids.map((productId) => cleanString(productId)));
  }

  if (!Array.isArray(items)) {
    return [];
  }

  return unique(
    items.map((item) => {
      if (typeof item === "string") {
        return cleanString(item);
      }

      return cleanString(item?.product_id);
    })
  );
}

export function resolveCheckoutProducts({ items, product_ids }) {
  const requestedProductIds = getRequestedCheckoutProductIds({ items, product_ids });
  const invalidProductIds = requestedProductIds.filter((productId) => !getServiceProductById(productId));
  const resolvedProducts = requestedProductIds
    .map((productId) => getServiceProductById(productId))
    .filter(Boolean);
  const unavailableProducts = resolvedProducts.filter(
    (product) => !product.checkout_enabled || product.store_purchase_enabled === false
  );
  const purchaseableProducts = resolvedProducts.filter(
    (product) => product.checkout_enabled && product.store_purchase_enabled !== false
  );

  return {
    requestedProductIds,
    invalidProductIds,
    unavailableProducts,
    purchaseableProducts,
  };
}

export function normalizeCheckoutLegalAcceptance({
  legalAcceptance,
  customerName,
  customerEmail,
  requestHeaders,
  now = new Date().toISOString(),
}) {
  if (!legalAcceptance?.accepted) {
    throw new Error("Legal acceptance is required before checkout.");
  }

  const version = cleanString(legalAcceptance.version) || CHECKOUT_LEGAL_VERSION;
  const ipAddress = readHeader(requestHeaders, "x-forwarded-for")
    .split(",")[0]
    .trim();

  return {
    accepted_at: now,
    version,
    accepted_by_name: cleanString(customerName),
    accepted_by_email: cleanString(customerEmail),
    ip_address: ipAddress,
    user_agent: readHeader(requestHeaders, "user-agent"),
    documents: CHECKOUT_LEGAL_DOCUMENTS.map((document) => ({
      key: document.key,
      label: document.label,
      path: document.path,
    })),
  };
}

export function buildCheckoutOrderItems(pricedItems = []) {
  return pricedItems.map((item) => ({
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
    service_key: item.service_key,
    tracking_enabled: Boolean(item.service_key),
    service_access_status: "active",
  }));
}

export function normalizeInstallConfigurationForOrder(orderItems = []) {
  const serviceConfig = {};
  for (const item of orderItems) {
    if (item.service_key) {
      serviceConfig[item.service_key] = {};
    }
  }

  return {
    shared: {},
    services: serviceConfig,
  };
}

function buildStripeMetadata({
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  businessName,
  pricingSummary,
}) {
  return {
    order_id: orderId,
    customer_name: cleanString(customerName),
    customer_email: cleanString(customerEmail),
    customer_phone: cleanString(customerPhone),
    business_name: cleanString(businessName),
    package_key: pricingSummary.package_key || "",
    package_name: pricingSummary.package_name || "",
    selected_service_keys: (pricingSummary.selected_service_keys || []).join(","),
    selected_product_ids: (pricingSummary.selected_product_ids || []).join(","),
    bundle_label: pricingSummary.package_name || "Custom Service Bundle",
  };
}

export function buildCheckoutOrderPayload({
  customerName,
  customerEmail,
  customerPhone,
  businessName,
  pricedItems,
  legalAcceptance,
}) {
  const orderItems = buildCheckoutOrderItems(pricedItems);
  const pricingSummary = buildStoredPricingSummary(pricedItems);

  return {
    customer_email: cleanString(customerEmail),
    customer_name: cleanString(customerName),
    customer_phone: cleanString(customerPhone),
    business_name: cleanString(businessName),
    items: orderItems,
    total_setup: pricingSummary.total_setup,
    total_monthly: pricingSummary.total_monthly,
    pricing_summary: pricingSummary,
    legal_acceptance: legalAcceptance,
    install_configuration: normalizeInstallConfigurationForOrder(orderItems),
    payment_status: "pending",
    billing_status: "pending",
    order_status: "pending_payment",
    plan_type: pricingSummary.package_name || "Custom Service Bundle",
  };
}

export function buildStripeCheckoutSessionPayload({
  order,
  pricedItems,
  customerName,
  customerEmail,
  customerPhone,
  businessName,
  successUrl,
  cancelUrl,
  origin,
}) {
  const pricingSummary = order.pricing_summary || buildStoredPricingSummary(pricedItems);
  const metadata = buildStripeMetadata({
    orderId: order.id,
    customerName,
    customerEmail,
    customerPhone,
    businessName,
    pricingSummary,
  });

  const lineItems = pricedItems.flatMap((item) => {
    const entries = [];

    if (cleanString(item.monthly_price_id)) {
      entries.push({
        price: item.monthly_price_id,
        quantity: 1,
      });
    }

    if (cleanString(item.setup_price_id)) {
      entries.push({
        price: item.setup_price_id,
        quantity: 1,
      });
    }

    return entries;
  });

  return {
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: cleanString(customerEmail),
    client_reference_id: order.id,
    line_items: lineItems,
    success_url: successUrl || `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${origin}/store`,
    metadata: {
      ...metadata,
      base44_app_id: cleanString(globalThis?.Deno?.env?.get?.("BASE44_APP_ID")),
    },
    subscription_data: {
      metadata,
    },
  };
}
