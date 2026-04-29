import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSubscriptionSummary,
  requestSubscriptionChange,
  syncSubscriptionFromStripe,
} from "../base44/functions/_shared/subscriptionSync.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async filter(query = {}) {
    return this.records.filter((record) =>
      Object.entries(query).every(([key, value]) => record[key] === value)
    );
  }

  async get(id) {
    const record = this.records.find((entry) => entry.id === id);
    if (!record) {
      throw new Error(`Record ${id} not found`);
    }
    return { ...record };
  }

  async create(data) {
    const record = {
      id: data.id || `rec_${this.sequence++}`,
      created_date: data.created_date || new Date().toISOString(),
      ...data,
    };
    this.records.push(record);
    return { ...record };
  }

  async update(id, patch) {
    const index = this.records.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error(`Record ${id} not found`);
    }

    this.records[index] = {
      ...this.records[index],
      ...patch,
      id,
    };

    return { ...this.records[index] };
  }
}

function createFakeBase44({ orders = [], subscriptions = [], events = [], projects = [], onboardingClients = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Subscription: new InMemoryCollection(subscriptions),
    CommunicationEvent: new InMemoryCollection(events),
    ClientProject: new InMemoryCollection(projects),
    OnboardingClient: new InMemoryCollection(onboardingClients),
  };

  return {
    asServiceRole: {
      entities,
    },
  };
}

function buildOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-04-22T12:00:00.000Z",
    payment_status: "paid",
    pipeline_status: "Live",
    order_status: "fully_live",
    stripe_session_id: "cs_test_123",
    stripe_customer_id: "cus_123",
    client_id: "client_1",
    client_project_id: "project_1",
    onboarding_client_id: "onboarding_1",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE",
        monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
        service_key: "instant_lead_response",
        tracking_enabled: true,
        service_access_status: "active",
        install_status: "Live",
        status: "live",
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "+16025550999",
        business_hours: "Mon-Fri 8am-5pm",
        after_hours_behavior: "send_after_hours_sms",
        consent_behavior: "include_opt_out_language",
        opt_out_message: "Reply STOP to opt out.",
      },
      services: {
        instant_lead_response: {
          sms_template: "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
        },
      },
    },
    ...overrides,
  };
}

function buildStripeSubscription({
  id = "sub_123",
  customer = "cus_123",
  status = "active",
  orderId = "order_1",
  planType = "Starter System",
  monthlyPriceIds = ["price_1TOwfiB9GU5ysJqE20FYUfVc"],
} = {}) {
  return {
    id,
    customer,
    status,
    current_period_start: 1776811200,
    current_period_end: 1779403200,
    metadata: {
      order_id: orderId,
      plan_type: planType,
    },
    items: {
      data: monthlyPriceIds.map((priceId, index) => ({
        id: `si_${index + 1}`,
        price: {
          id: priceId,
        },
      })),
    },
  };
}

test("subscription creation sync creates canonical subscription record and adds upgraded services to the order", async () => {
  const order = buildOrder();
  const base44 = createFakeBase44({
    orders: [order],
    projects: [{ id: "project_1", plan: "Starter System", plan_change_request: "None" }],
    onboardingClients: [{ id: "onboarding_1", business_name: "Signal Med Spa", status: "active" }],
  });

  const result = await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription({
      monthlyPriceIds: [
        "price_1TOwfiB9GU5ysJqE20FYUfVc",
        "price_1TOwfiB9GU5ysJqEKhYvS71r",
      ],
      planType: "Growth System",
    }),
    eventType: "customer.subscription.created",
    fallbackOrderId: order.id,
  });

  assert.equal(result.success, true);
  assert.equal(result.subscription.status, "active");
  assert.equal(result.subscription.plan_type, "Growth System");
  assert.deepEqual(result.subscription.services_included.sort(), ["ai_booking_agent", "instant_lead_response"]);

  const savedOrder = await base44.asServiceRole.entities.Order.get(order.id);
  assert.equal(savedOrder.subscription_status, "active");
  assert.equal(savedOrder.plan_type, "Growth System");
  assert.ok(savedOrder.items.some((item) => item.service_key === "ai_booking_agent"));
});

test("past-due subscription sync preserves install records but marks billing warning state", async () => {
  const order = buildOrder({
    subscription_id: "sub_rec_1",
    stripe_subscription_id: "sub_123",
    subscription_status: "active",
  });
  const subscription = {
    id: "sub_rec_1",
    order_id: order.id,
    stripe_subscription_id: "sub_123",
    stripe_customer_id: "cus_123",
    status: "active",
    plan_type: "Starter System",
    services_included: ["instant_lead_response"],
  };
  const base44 = createFakeBase44({
    orders: [order],
    subscriptions: [subscription],
    projects: [{ id: "project_1", plan: "Starter System", plan_change_request: "None" }],
    onboardingClients: [{ id: "onboarding_1", business_name: "Signal Med Spa", status: "active" }],
  });

  await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription({
      status: "past_due",
    }),
    eventType: "invoice.payment_failed",
    fallbackOrderId: order.id,
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get(order.id);
  assert.equal(savedOrder.subscription_status, "past_due");
  assert.equal(savedOrder.items[0].service_access_status, "past_due");
  assert.equal(savedOrder.items[0].install_status, "Live");
});

test("subscription downgrade removes services from the active tracked install set without deleting history", async () => {
  const order = buildOrder({
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
        service_key: "instant_lead_response",
        tracking_enabled: true,
        service_access_status: "active",
        install_status: "Live",
        status: "live",
      },
      {
        product_id: "prod_UNi5fLL2SyJJdP",
        product_name: "AI Booking Agent",
        monthly_price_id: "price_1TOwfiB9GU5ysJqEKhYvS71r",
        service_key: "ai_booking_agent",
        tracking_enabled: true,
        service_access_status: "active",
        install_status: "Live",
        status: "live",
      },
    ],
  });
  const base44 = createFakeBase44({
    orders: [order],
    subscriptions: [
      {
        id: "sub_rec_1",
        order_id: order.id,
        stripe_subscription_id: "sub_123",
        stripe_customer_id: "cus_123",
        status: "active",
        plan_type: "Growth System",
        services_included: ["instant_lead_response", "ai_booking_agent"],
      },
    ],
    projects: [{ id: "project_1", plan: "Growth System", plan_change_request: "None" }],
    onboardingClients: [{ id: "onboarding_1", business_name: "Signal Med Spa", status: "active" }],
  });

  await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription({
      monthlyPriceIds: ["price_1TOwfiB9GU5ysJqE20FYUfVc"],
      planType: "Starter System",
    }),
    eventType: "customer.subscription.updated",
    fallbackOrderId: order.id,
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get(order.id);
  const removedItem = savedOrder.items.find((item) => item.service_key === "ai_booking_agent");
  assert.equal(removedItem.tracking_enabled, false);
  assert.equal(removedItem.service_access_status, "removed_from_plan");
  assert.equal(removedItem.previous_active_install_status, "Live");
});

test("canceled subscription sync disables services safely without deleting data", async () => {
  const order = buildOrder({
    subscription_id: "sub_rec_1",
    stripe_subscription_id: "sub_123",
    subscription_status: "active",
  });
  const base44 = createFakeBase44({
    orders: [order],
    subscriptions: [
      {
        id: "sub_rec_1",
        order_id: order.id,
        stripe_subscription_id: "sub_123",
        stripe_customer_id: "cus_123",
        status: "active",
        plan_type: "Starter System",
        services_included: ["instant_lead_response"],
      },
    ],
    projects: [{ id: "project_1", plan: "Starter System", plan_change_request: "None" }],
    onboardingClients: [{ id: "onboarding_1", business_name: "Signal Med Spa", status: "active" }],
  });

  await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription({
      status: "canceled",
    }),
    eventType: "customer.subscription.deleted",
    fallbackOrderId: order.id,
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get(order.id);
  assert.equal(savedOrder.subscription_status, "canceled");
  assert.equal(savedOrder.pipeline_error, "Subscription canceled. Service access disabled.");
  assert.equal(savedOrder.items[0].install_status, "Error");
  assert.equal(savedOrder.items[0].service_access_status, "canceled");
  assert.equal(savedOrder.items[0].previous_active_install_status, "Live");
});

test("subscription change requests remain manual but are logged canonically", async () => {
  const order = buildOrder({
    subscription_id: "sub_rec_1",
  });
  const subscription = {
    id: "sub_rec_1",
    client_id: "client_1",
    order_id: order.id,
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    plan_type: "Starter System",
    status: "active",
    current_period_start: "2026-04-22T12:00:00.000Z",
    current_period_end: "2026-05-22T12:00:00.000Z",
    services_included: ["instant_lead_response"],
  };
  const base44 = createFakeBase44({
    orders: [order],
    subscriptions: [subscription],
    projects: [{ id: "project_1", plan: "Starter System", plan_change_request: "None" }],
  });

  const updated = await requestSubscriptionChange({
    base44,
    subscription,
    order,
    requestType: "upgrade",
    requestedPlanType: "Growth System",
    requestedByEmail: "owner@example.com",
  });

  assert.equal(updated.change_request_type, "upgrade");
  assert.equal(updated.requested_plan_type, "Growth System");
  assert.equal(updated.change_request_status, "pending_review");

  const summary = buildSubscriptionSummary(updated);
  assert.equal(summary.plan_type, "Starter System");
  assert.equal(summary.requested_plan_type, "Growth System");

  const project = await base44.asServiceRole.entities.ClientProject.get("project_1");
  assert.equal(project.plan_change_request, "Growth System");

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: order.id });
  assert.ok(events.some((event) => event.subject === "Subscription change requested"));
});

test("subscription sync suppresses duplicate billing timeline events on Stripe retry", async () => {
  const order = buildOrder({
    subscription_id: "sub_rec_1",
    stripe_subscription_id: "sub_123",
    subscription_status: "active",
  });
  const base44 = createFakeBase44({
    orders: [order],
    subscriptions: [
      {
        id: "sub_rec_1",
        order_id: order.id,
        stripe_subscription_id: "sub_123",
        stripe_customer_id: "cus_123",
        status: "active",
        plan_type: "Starter System",
        services_included: ["instant_lead_response"],
      },
    ],
    projects: [{ id: "project_1", plan: "Starter System", plan_change_request: "None" }],
    onboardingClients: [{ id: "onboarding_1", business_name: "Signal Med Spa", status: "active" }],
  });

  await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription(),
    eventType: "customer.subscription.updated",
    fallbackOrderId: order.id,
    sourceEventId: "evt_sub_retry_1",
  });

  await syncSubscriptionFromStripe({
    base44,
    stripeSubscription: buildStripeSubscription(),
    eventType: "customer.subscription.updated",
    fallbackOrderId: order.id,
    sourceEventId: "evt_sub_retry_1",
  });

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({
    provider_message_id: "evt_sub_retry_1",
  });
  assert.equal(events.length, 1);
});

test("subscription summary exposes billing status for portal and admin views", () => {
  const summary = buildSubscriptionSummary({
    id: "sub_rec_1",
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    plan_type: "Starter System",
    status: "active",
    current_period_end: "2026-05-22T12:00:00.000Z",
    services_included: ["instant_lead_response"],
  });

  assert.equal(summary.billing_status, "active");
  assert.equal(summary.plan_type, "Starter System");
});
