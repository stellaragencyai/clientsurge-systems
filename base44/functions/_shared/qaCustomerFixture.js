import {
  buildCommunicationEvent,
  getTrackedServiceConfig,
  initializePaidOrderInstallPipeline,
  normalizeInstallConfiguration,
} from "./installPipeline.js";
import { syncSubscriptionFromStripe } from "./subscriptionSync.js";
import {
  buildPricingSummaryForProducts,
  buildStoredPricingSummary,
  getPackageOffer,
  getServiceProductById,
} from "../../../src/lib/salesCatalog.js";

const DEFAULT_PACKAGE_KEY = "growth_system";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  return cleanString(value);
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function shouldIgnoreInviteError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("registered") ||
    message.includes("invited")
  );
}

function buildQaStripeId(prefix, timestampKey, suffix = "") {
  const safeSuffix = cleanString(suffix).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `${prefix}_${timestampKey}${safeSuffix ? `_${safeSuffix}` : ""}`;
}

function buildOrderItems(pricedItems = []) {
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
    service_key: getTrackedServiceConfig(item.product_id)?.service_key,
    tracking_enabled: Boolean(getTrackedServiceConfig(item.product_id)),
    service_access_status: "active",
  }));
}

function buildQaSubscriptionPayload({
  orderId,
  stripeSubscriptionId,
  stripeCustomerId,
  planType,
  pricedItems,
  now,
}) {
  const startSeconds = Math.floor(new Date(now).getTime() / 1000);
  const endSeconds = startSeconds + (60 * 60 * 24 * 30);

  return {
    id: stripeSubscriptionId,
    customer: stripeCustomerId,
    status: "active",
    current_period_start: startSeconds,
    current_period_end: endSeconds,
    metadata: {
      order_id: orderId,
      plan_type: planType,
      services_json: JSON.stringify(
        pricedItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          service_key: item.service_key,
        }))
      ),
    },
    items: {
      data: pricedItems.map((item, index) => ({
        id: `qa_si_${index + 1}`,
        price: {
          id: item.monthly_price_id,
        },
      })),
    },
  };
}

function buildLoginSteps({ inviteSent, email, portalUrl }) {
  const steps = [
    inviteSent
      ? `Check ${email} for the Base44 activation invite and create a password.`
      : `Use a manual Base44 auth invite for ${email} first, then create a password.`,
    `Open ${portalUrl} and sign in with ${email}.`,
    "Use “Forgot your password?” from the portal login if you need to reset credentials.",
  ];

  return steps;
}

export class QaCustomerFixtureError extends Error {
  constructor(message, { status = 400, code = "qa_customer_fixture_invalid", details = {} } = {}) {
    super(message);
    this.name = "QaCustomerFixtureError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeQaCustomerFixturePayload(payload = {}) {
  const packageOffer = getPackageOffer(payload.package_key || DEFAULT_PACKAGE_KEY);
  const selectedProductIds = unique([
    ...(packageOffer?.included_services || []).map((service) => service.product_id),
    ...((Array.isArray(payload.product_ids) ? payload.product_ids : [])
      .map((productId) => cleanString(productId))
      .filter((productId) => Boolean(getServiceProductById(productId)?.checkout_enabled))),
  ]);

  return {
    full_name: cleanString(payload.full_name),
    business_name: cleanString(payload.business_name),
    email: normalizeEmail(payload.email),
    phone: normalizePhone(payload.phone),
    website: cleanString(payload.website),
    package_key: packageOffer?.package_key || DEFAULT_PACKAGE_KEY,
    product_ids: selectedProductIds,
  };
}

export function validateQaCustomerFixturePayload(payload) {
  const errors = [];

  if (!payload.full_name) errors.push("Full name is required.");
  if (!payload.business_name) errors.push("Business name is required.");
  if (!payload.email) errors.push("Email is required.");
  if (!payload.phone) errors.push("Phone number is required.");
  if (!payload.product_ids.length) errors.push("Select at least one canonical service.");

  return errors;
}

async function ensureUniqueQaPortalIdentity(base44, email) {
  const [paidOrders, clients, projects] = await Promise.all([
    base44.asServiceRole.entities.Order.filter({ customer_email: email }, "-created_date", 25),
    base44.asServiceRole.entities.Client.filter({ email }, "-created_date", 25),
    base44.asServiceRole.entities.ClientProject.filter({ client_email: email }, "-created_date", 25),
  ]);

  const exactPaidOrders = (paidOrders || []).filter(
    (order) => normalizeEmail(order.customer_email) === email && order.payment_status === "paid"
  );
  const exactClients = (clients || []).filter((client) => normalizeEmail(client.email) === email);
  const exactProjects = (projects || []).filter((project) => normalizeEmail(project.client_email) === email);

  if (exactPaidOrders.length || exactClients.length || exactProjects.length) {
    throw new QaCustomerFixtureError(
      "This email is already linked to an existing client or paid order. Use a fresh QA email so portal ownership stays unambiguous.",
      {
        status: 409,
        code: "qa_customer_email_conflict",
        details: {
          paid_order_ids: exactPaidOrders.map((order) => order.id),
          client_ids: exactClients.map((client) => client.id),
          client_project_ids: exactProjects.map((project) => project.id),
        },
      }
    );
  }
}

async function inviteQaUser(base44, email) {
  if (!base44.users?.inviteUser) {
    return {
      invite_sent: false,
      invite_status: "unsupported",
    };
  }

  try {
    await base44.users.inviteUser(email, "user");
    return {
      invite_sent: true,
      invite_status: "sent",
    };
  } catch (error) {
    if (shouldIgnoreInviteError(error)) {
      return {
        invite_sent: false,
        invite_status: "already_exists",
      };
    }

    throw new QaCustomerFixtureError(
      error instanceof Error ? error.message : "Failed to send QA customer invite",
      {
        status: 502,
        code: "qa_customer_invite_failed",
      }
    );
  }
}

export async function createQaCustomerFixture({
  base44,
  payload,
  now = new Date().toISOString(),
  portalUrl,
}) {
  const normalizedPayload = normalizeQaCustomerFixturePayload(payload);
  const validationErrors = validateQaCustomerFixturePayload(normalizedPayload);

  if (validationErrors.length) {
    throw new QaCustomerFixtureError(validationErrors.join(" "), {
      status: 400,
      code: "qa_customer_fixture_invalid",
    });
  }

  await ensureUniqueQaPortalIdentity(base44, normalizedPayload.email);

  const pricingSummary = buildPricingSummaryForProducts(normalizedPayload.product_ids);
  if (!pricingSummary.priced_items.length) {
    throw new QaCustomerFixtureError("No canonical services were selected for the QA customer.", {
      status: 400,
      code: "qa_customer_fixture_empty",
    });
  }

  const timestampKey = now.replace(/[-:TZ.]/g, "").slice(0, 14);
  const stripeCustomerId = buildQaStripeId("qa_cus", timestampKey, normalizedPayload.business_name);
  const stripeSubscriptionId = buildQaStripeId("qa_sub", timestampKey, normalizedPayload.business_name);
  const orderItems = buildOrderItems(pricingSummary.priced_items);

  const createdOrder = await base44.asServiceRole.entities.Order.create({
    customer_email: normalizedPayload.email,
    customer_name: normalizedPayload.full_name,
    customer_phone: normalizedPayload.phone,
    business_name: normalizedPayload.business_name,
    items: orderItems,
    total_setup: pricingSummary.total_setup,
    total_monthly: pricingSummary.total_monthly,
    pricing_summary: buildStoredPricingSummary(pricingSummary.priced_items),
    install_configuration: normalizeInstallConfiguration({}, orderItems),
    payment_status: "pending",
    order_status: "pending_payment",
    stripe_customer_id: stripeCustomerId,
    stripe_session_id: buildQaStripeId("qa_session", timestampKey, normalizedPayload.business_name),
    plan_type: pricingSummary.package_offer?.name || "Custom Service Bundle",
    notes: `[QA Fixture] Created for ${normalizedPayload.email} on ${now}.`,
  });

  const initialized = await initializePaidOrderInstallPipeline({
    base44,
    order: createdOrder,
    stripeCustomerId,
    eventSource: "admin.qa_customer_fixture",
    now,
  });

  if (normalizedPayload.website) {
    await Promise.all([
      initialized.client?.id
        ? base44.asServiceRole.entities.Client.update(initialized.client.id, {
            website: normalizedPayload.website,
          })
        : Promise.resolve(null),
      initialized.onboardingClient?.id
        ? base44.asServiceRole.entities.OnboardingClient.update(initialized.onboardingClient.id, {
            website: normalizedPayload.website,
          })
        : Promise.resolve(null),
    ]);
  }

  const subscriptionSync = await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildQaSubscriptionPayload({
      orderId: initialized.order.id,
      stripeSubscriptionId,
      stripeCustomerId,
      planType: pricingSummary.package_offer?.name || "Custom Service Bundle",
      pricedItems: pricingSummary.priced_items,
      now,
    }),
    eventType: "customer.subscription.created",
    fallbackOrderId: initialized.order.id,
    now,
  });

  const inviteResult = await inviteQaUser(base44, normalizedPayload.email);
  const syncedOrder = subscriptionSync.order || initialized.order;
  const planType = pricingSummary.package_offer?.name || "Custom Service Bundle";

  if (syncedOrder.client_project_id) {
    await base44.asServiceRole.entities.ClientProject.update(syncedOrder.client_project_id, {
      plan: planType,
      plan_change_request: "None",
    });
  }

  await base44.asServiceRole.entities.CommunicationEvent.create(
    buildCommunicationEvent({
      order: syncedOrder,
      event_type: "workflow_triggered",
      provider: "internal",
      status: "processed",
      subject: "QA customer fixture created",
      message_body: `Admin created a canonical QA customer for ${normalizedPayload.email}.`,
      metadata: {
        flow: "qa_customer_fixture",
        order_id: syncedOrder.id,
        customer_email: normalizedPayload.email,
        plan_type: planType,
        selected_service_keys: pricingSummary.selected_service_keys,
        invite_sent: inviteResult.invite_sent,
        invite_status: inviteResult.invite_status,
      },
    })
  );

  return {
    success: true,
    order_id: syncedOrder.id,
    client_id: initialized.client?.id || syncedOrder.client_id || null,
    client_project_id: initialized.clientProject?.id || syncedOrder.client_project_id || null,
    onboarding_client_id: initialized.onboardingClient?.id || syncedOrder.onboarding_client_id || null,
    subscription_id: subscriptionSync.subscription?.id || syncedOrder.subscription_id || null,
    stripe_subscription_id: syncedOrder.stripe_subscription_id || stripeSubscriptionId,
    stripe_customer_id: syncedOrder.stripe_customer_id || stripeCustomerId,
    plan_type: planType,
    package_key: pricingSummary.package_offer?.package_key || null,
    selected_service_keys: pricingSummary.selected_service_keys,
    invite_sent: inviteResult.invite_sent,
    invite_status: inviteResult.invite_status,
    portal_url: portalUrl,
    login_steps: buildLoginSteps({
      inviteSent: inviteResult.invite_sent,
      email: normalizedPayload.email,
      portalUrl,
    }),
  };
}
