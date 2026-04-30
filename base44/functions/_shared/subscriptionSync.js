import {
  buildCommunicationEvent,
  derivePipelineStatus,
  getTrackedInstallItems,
  mapPipelineStatusToOrderStatus,
  normalizeInstallConfiguration,
  normalizeOrderItems,
  syncInstallMirrorsFromOrder,
} from "./installPipeline.js";
import {
  buildPricingSummaryForProducts,
  getBestPackageOfferForServiceKeys,
  getServiceProductByKey,
  getServiceProductByMonthlyPriceId,
} from "../../../src/lib/salesCatalog.js";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const PAST_DUE_SUBSCRIPTION_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);
const CANCELED_SUBSCRIPTION_STATUSES = new Set(["canceled"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toIsoFromUnix(value) {
  if (!value) {
    return null;
  }

  return new Date(Number(value) * 1000).toISOString();
}

export function normalizeStripeSubscriptionStatus(status) {
  const normalized = cleanString(status).toLowerCase();

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(normalized)) {
    return "active";
  }

  if (PAST_DUE_SUBSCRIPTION_STATUSES.has(normalized)) {
    return "past_due";
  }

  if (CANCELED_SUBSCRIPTION_STATUSES.has(normalized)) {
    return "canceled";
  }

  return "past_due";
}

function buildIncludedProducts(stripeSubscription) {
  const recurringItems = stripeSubscription?.items?.data || [];
  const mapped = recurringItems
    .map((item) => getServiceProductByMonthlyPriceId(item?.price?.id))
    .filter(Boolean);

  if (mapped.length > 0) {
    return mapped;
  }

  const metadataServices = (() => {
    try {
      const raw = stripeSubscription?.metadata?.services_json;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  return metadataServices
    .map((entry) => {
      if (typeof entry === "string") {
        return getServiceProductByKey(entry);
      }

      return getServiceProductByKey(entry?.service_key);
    })
    .filter(Boolean);
}

export function deriveSubscriptionSnapshot(stripeSubscription) {
  const includedProducts = buildIncludedProducts(stripeSubscription);
  const serviceKeys = [...new Set(includedProducts.map((product) => product.service_key))];
  const pricingSummary = buildPricingSummaryForProducts(
    includedProducts.map((product) => product.product_id)
  );
  const derivedPackage = getBestPackageOfferForServiceKeys(serviceKeys);

  return {
    stripe_subscription_id: stripeSubscription.id,
    stripe_customer_id: stripeSubscription.customer || "",
    status: normalizeStripeSubscriptionStatus(stripeSubscription.status),
    current_period_start: toIsoFromUnix(stripeSubscription.current_period_start),
    current_period_end: toIsoFromUnix(stripeSubscription.current_period_end),
    services_included: serviceKeys,
    included_products: includedProducts,
    plan_type:
      cleanString(stripeSubscription.metadata?.plan_type) ||
      derivedPackage?.name ||
      (serviceKeys.length > 0 ? "Custom Service Bundle" : ""),
    pricing_summary: pricingSummary,
  };
}

function serializeMetadata(metadata) {
  return JSON.stringify(metadata || {});
}

function buildSubscriptionEvent({
  order,
  subscriptionRecord,
  subject,
  messageBody,
  status = "processed",
  metadata = {},
}) {
  return buildCommunicationEvent({
    order,
    event_type: "status_update",
    provider: "stripe",
    status,
    subject,
    message_body: messageBody,
    metadata: {
      context_type: "subscription_sync",
      subscription_id: subscriptionRecord?.id || null,
      stripe_subscription_id: subscriptionRecord?.stripe_subscription_id || null,
      subscription_status: subscriptionRecord?.status || null,
      plan_type: subscriptionRecord?.plan_type || null,
      services_included: subscriptionRecord?.services_included || [],
      ...metadata,
    },
  });
}

async function upsertSubscriptionRecord({
  base44,
  order,
  snapshot,
  now,
  requestPatch = {},
}) {
  const existing =
    (snapshot.stripe_subscription_id
      ? (await base44.asServiceRole.entities.Subscription.filter({
          stripe_subscription_id: snapshot.stripe_subscription_id,
        }))[0]
      : null) ||
    (order.subscription_id
      ? await base44.asServiceRole.entities.Subscription.get(order.subscription_id).catch(() => null)
      : null);

  const patch = {
    client_id: order.client_id || existing?.client_id || "",
    order_id: order.id,
    stripe_customer_id: snapshot.stripe_customer_id || order.stripe_customer_id || existing?.stripe_customer_id || "",
    stripe_subscription_id: snapshot.stripe_subscription_id,
    plan_type: snapshot.plan_type,
    status: snapshot.status,
    current_period_start: snapshot.current_period_start,
    current_period_end: snapshot.current_period_end,
    services_included: snapshot.services_included,
    updated_at: now,
    ...requestPatch,
  };

  if (existing) {
    return base44.asServiceRole.entities.Subscription.update(existing.id, patch);
  }

  return base44.asServiceRole.entities.Subscription.create({
    ...patch,
    created_at: now,
  });
}

function getAccessStateForSubscription(status) {
  if (status === "canceled") {
    return {
      service_access_status: "canceled",
      disable_reason: "Subscription canceled. Service access disabled until a new active subscription is created.",
      hard_disable: true,
    };
  }

  if (status === "past_due") {
    return {
      service_access_status: "past_due",
      disable_reason: "Subscription is past due. Billing follow-up required.",
      hard_disable: false,
    };
  }

  return {
    service_access_status: "active",
    disable_reason: "",
    hard_disable: false,
  };
}

function syncOrderItemsForSubscription({ order, snapshot, now }) {
  const normalizedItems = normalizeOrderItems(order.items || [], order.install_initialized_at ? "Ready for Install" : "Paid");
  const includedByKey = Object.fromEntries(
    snapshot.included_products.map((product) => [product.service_key, product])
  );
  const accessState = getAccessStateForSubscription(snapshot.status);
  const itemsByKey = Object.fromEntries(
    normalizedItems
      .filter((item) => item.service_key)
      .map((item) => [item.service_key, item])
  );

  const nextItems = normalizedItems.map((item) => {
    if (!item.service_key) {
      return item;
    }

    const includedProduct = includedByKey[item.service_key];
    if (includedProduct) {
      const restoredStatus =
        item.install_status === "Error" && item.previous_active_install_status
          ? item.previous_active_install_status
          : item.install_status || (order.install_initialized_at ? "Ready for Install" : "Paid");

      return {
        ...item,
        product_id: includedProduct.product_id,
        product_name: includedProduct.name,
        setup_price_id: includedProduct.setup_price_id,
        monthly_price_id: includedProduct.monthly_price_id,
        tracking_enabled: true,
        service_access_status: accessState.service_access_status,
        access_disable_reason: accessState.disable_reason || "",
        access_disabled_at: accessState.hard_disable ? now : undefined,
        previous_active_install_status: accessState.hard_disable
          ? item.previous_active_install_status || item.install_status || "Ready for Install"
          : undefined,
        install_status: accessState.hard_disable ? "Error" : restoredStatus,
        install_error: accessState.hard_disable ? accessState.disable_reason : undefined,
      };
    }

    return {
      ...item,
      tracking_enabled: false,
      service_access_status: "removed_from_plan",
      access_disable_reason: "Removed from active subscription plan.",
      access_disabled_at: now,
      previous_active_install_status: item.previous_active_install_status || item.install_status || "Ready for Install",
      install_status: "Error",
      install_error: "Removed from active subscription plan.",
    };
  });

  for (const product of snapshot.included_products) {
    if (itemsByKey[product.service_key]) {
      continue;
    }

    nextItems.push({
      product_id: product.product_id,
      product_name: product.name,
      setup_price_id: product.setup_price_id,
      monthly_price_id: product.monthly_price_id,
      setup_fee: product.setup_fee,
      monthly_fee: product.monthly_fee,
      compare_at_setup_fee: product.setup_fee,
      compare_at_monthly_fee: product.monthly_fee,
      setup_discount_fee: 0,
      monthly_discount_fee: 0,
      source_package_key: snapshot.pricing_summary.package_offer?.package_key || null,
      source_package_name: snapshot.pricing_summary.package_offer?.name || null,
      status: "pending",
      service_key: product.service_key,
      tracking_enabled: true,
      service_access_status: accessState.service_access_status,
      install_status: accessState.hard_disable ? "Error" : (order.install_initialized_at ? "Ready for Install" : "Paid"),
      install_error: accessState.hard_disable ? accessState.disable_reason : undefined,
      previous_active_install_status: accessState.hard_disable ? "Ready for Install" : undefined,
      access_disabled_at: accessState.hard_disable ? now : undefined,
      access_disable_reason: accessState.disable_reason || "",
    });
  }

  return nextItems;
}

async function updateOrderForSubscription({
  base44,
  order,
  subscriptionRecord,
  snapshot,
  now,
}) {
  const nextItems = syncOrderItemsForSubscription({ order, snapshot, now });
  const nextInstallConfiguration = normalizeInstallConfiguration(order.install_configuration, nextItems);
  const provisionalOrder = {
    ...order,
    items: nextItems,
    install_configuration: nextInstallConfiguration,
  };
  const nextPipelineStatus = derivePipelineStatus(provisionalOrder);
  const trackedItems = getTrackedInstallItems(nextItems);

  const updatedOrder = await base44.asServiceRole.entities.Order.update(order.id, {
    items: nextItems,
    install_configuration: nextInstallConfiguration,
    stripe_customer_id: snapshot.stripe_customer_id || order.stripe_customer_id || undefined,
    stripe_subscription_id: snapshot.stripe_subscription_id,
    subscription_id: subscriptionRecord.id,
    subscription_status: subscriptionRecord.status,
    billing_status: subscriptionRecord.status,
    current_period_start: subscriptionRecord.current_period_start,
    current_period_end: subscriptionRecord.current_period_end,
    plan_type: subscriptionRecord.plan_type,
    pipeline_status: nextPipelineStatus,
    order_status: mapPipelineStatusToOrderStatus({
      pipelineStatus: nextPipelineStatus,
      trackedItems,
      paymentStatus: order.payment_status || "paid",
    }),
    pipeline_error: subscriptionRecord.status === "canceled"
      ? "Subscription canceled. Service access disabled."
      : undefined,
    last_install_event_at: now,
  });

  await syncInstallMirrorsFromOrder({
    base44,
    order: {
      ...updatedOrder,
      items: nextItems,
      install_configuration: nextInstallConfiguration,
    },
    now,
  });

  return {
    ...updatedOrder,
    items: nextItems,
    install_configuration: nextInstallConfiguration,
  };
}

async function resolveOrderForSubscription({ base44, stripeSubscription, fallbackOrderId }) {
  if (fallbackOrderId) {
    return base44.asServiceRole.entities.Order.get(fallbackOrderId).catch(() => null);
  }

  const metadataOrderId = cleanString(stripeSubscription?.metadata?.order_id);
  if (metadataOrderId) {
    return base44.asServiceRole.entities.Order.get(metadataOrderId).catch(() => null);
  }

  if (stripeSubscription?.id) {
    const existingBySubscription = await base44.asServiceRole.entities.Order.filter({
      stripe_subscription_id: stripeSubscription.id,
    });
    if (existingBySubscription?.length) {
      return existingBySubscription[0];
    }
  }

  if (stripeSubscription?.customer) {
    const existingByCustomer = await base44.asServiceRole.entities.Order.filter({
      stripe_customer_id: stripeSubscription.customer,
    });
    if (existingByCustomer?.length) {
      return existingByCustomer.sort((left, right) =>
        new Date(right.created_date || 0).getTime() - new Date(left.created_date || 0).getTime()
      )[0];
    }
  }

  return null;
}

export async function syncSubscriptionFromStripe({
  base44,
  stripeSubscription,
  eventType,
  fallbackOrderId = "",
  now = new Date().toISOString(),
}) {
  const order = await resolveOrderForSubscription({
    base44,
    stripeSubscription,
    fallbackOrderId,
  });

  if (!order) {
    return {
      success: false,
      reason: "order_not_found",
    };
  }

  const snapshot = deriveSubscriptionSnapshot(stripeSubscription);
  const subscriptionRecord = await upsertSubscriptionRecord({
    base44,
    order,
    snapshot,
    now,
  });
  const updatedOrder = await updateOrderForSubscription({
    base44,
    order,
    subscriptionRecord,
    snapshot,
    now,
  });

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildSubscriptionEvent({
      order: updatedOrder,
      subscriptionRecord,
      subject: `Subscription ${subscriptionRecord.status}`,
      messageBody: `Stripe ${eventType} synced ${subscriptionRecord.plan_type || "subscription"} as ${subscriptionRecord.status}.`,
      metadata: {
        stripe_event_type: eventType,
      },
    })
  );

  return {
    success: true,
    order: updatedOrder,
    subscription: subscriptionRecord,
  };
}

export function buildSubscriptionSummary(subscription) {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    client_id: subscription.client_id || null,
    stripe_customer_id: subscription.stripe_customer_id || null,
    stripe_subscription_id: subscription.stripe_subscription_id || null,
    plan_type: subscription.plan_type || "",
    status: subscription.status || "",
    current_period_start: subscription.current_period_start || null,
    current_period_end: subscription.current_period_end || null,
    services_included: subscription.services_included || [],
    change_request_type: subscription.change_request_type || "",
    requested_plan_type: subscription.requested_plan_type || "",
    change_request_status: subscription.change_request_status || "",
    cancel_requested_at: subscription.cancel_requested_at || null,
  };
}

export async function requestSubscriptionChange({
  base44,
  subscription,
  order,
  requestType,
  requestedPlanType = "",
  requestedByEmail = "",
  now = new Date().toISOString(),
}) {
  const normalizedRequestedPlanType = requestType === "cancel"
    ? ""
    : cleanString(requestedPlanType || subscription.requested_plan_type || "");

  const nextSubscription = await base44.asServiceRole.entities.Subscription.update(subscription.id, {
    change_request_type: requestType,
    requested_plan_type: normalizedRequestedPlanType,
    change_request_status: "pending_review",
    cancel_requested_at: requestType === "cancel" ? now : subscription.cancel_requested_at || undefined,
    updated_at: now,
  });

  if (order.client_project_id) {
    await base44.asServiceRole.entities.ClientProject.update(order.client_project_id, {
      plan_change_request:
        requestType === "cancel"
          ? "None"
          : normalizedRequestedPlanType || "None",
    });
  }

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildSubscriptionEvent({
      order,
      subscriptionRecord: nextSubscription,
      subject: requestType === "cancel" ? "Subscription cancellation requested" : "Subscription change requested",
      messageBody:
        requestType === "cancel"
          ? `${requestedByEmail || order.customer_email || "Client"} requested cancellation.`
          : `${requestedByEmail || order.customer_email || "Client"} requested change to ${normalizedRequestedPlanType}.`,
      metadata: {
        requested_by_email: requestedByEmail || null,
        request_type: requestType,
        requested_plan_type: normalizedRequestedPlanType || null,
      },
    })
  );

  return nextSubscription;
}
