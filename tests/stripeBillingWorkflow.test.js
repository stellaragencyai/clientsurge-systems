import test from "node:test";
import assert from "node:assert/strict";

import {
  handleCheckoutSessionCompleted,
  handleInvoiceLifecycleEvent,
} from "../base44/functions/_shared/stripeBillingWorkflow.js";

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

function buildOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-04-29T00:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    total_setup: 297,
    total_monthly: 97,
    payment_status: "pending",
    order_status: "pending_payment",
    billing_status: "pending",
    plan_type: "Custom Service Bundle",
    stripe_session_id: "cs_test_123",
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        setup_price_id: "price_1TOwfiB9GU5ysJqEcmQHl3gE",
        monthly_price_id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
        service_key: "instant_lead_response",
        tracking_enabled: true,
        service_access_status: "active",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        instant_lead_response: {},
      },
    },
    pricing_summary: {
      pricing_version: "canonical_sales_catalog_v1",
      package_key: null,
      package_name: null,
      package_service_keys: [],
      add_on_service_keys: [],
      selected_service_keys: ["instant_lead_response"],
      selected_product_ids: ["prod_UNi5RHiKNSTfQl"],
      total_setup_before_discount: 297,
      total_monthly_before_discount: 97,
      total_setup: 297,
      total_monthly: 97,
      setup_discount_total: 0,
      monthly_discount_total: 0,
    },
    ...overrides,
  };
}

function buildStripeSubscription({
  id = "sub_123",
  customer = "cus_123",
  status = "active",
  orderId = "order_1",
} = {}) {
  return {
    id,
    customer,
    status,
    current_period_start: 1776811200,
    current_period_end: 1779403200,
    metadata: {
      order_id: orderId,
      plan_type: "Starter System",
    },
    items: {
      data: [
        {
          id: "si_1",
          price: {
            id: "price_1TOwfiB9GU5ysJqE20FYUfVc",
          },
        },
      ],
    },
  };
}

function createFakeBase44({ orders = [], subscriptions = [], events = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Subscription: new InMemoryCollection(subscriptions),
    CommunicationEvent: new InMemoryCollection(events),
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
  };

  const sentEmails = [];

  return {
    sentEmails,
    base44: {
      asServiceRole: {
        entities,
        integrations: {
          Core: {
            async SendEmail(payload) {
              sentEmails.push(payload);
              return { success: true };
            },
          },
        },
      },
    },
  };
}

test("checkout.session.completed initializes install, syncs subscription, and does not resend on retry", async () => {
  const { base44, sentEmails } = createFakeBase44({
    orders: [buildOrder()],
  });
  const session = {
    id: "cs_test_123",
    payment_status: "paid",
    customer: "cus_123",
    subscription: "sub_123",
    metadata: {
      order_id: "order_1",
    },
  };

  await handleCheckoutSessionCompleted({
    base44,
    session,
    eventId: "evt_checkout_1",
    stripeSubscriptionLoader: async () => buildStripeSubscription(),
    now: "2026-04-29T01:02:03.000Z",
  });

  await handleCheckoutSessionCompleted({
    base44,
    session,
    eventId: "evt_checkout_1",
    stripeSubscriptionLoader: async () => buildStripeSubscription(),
    now: "2026-04-29T01:02:03.000Z",
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get("order_1");
  assert.equal(savedOrder.payment_status, "paid");
  assert.equal(savedOrder.subscription_status, "active");
  assert.equal(savedOrder.stripe_subscription_id, "sub_123");
  assert.ok(savedOrder.install_initialized_at);
  assert.equal(sentEmails.length, 1);

  const confirmationEvents = await base44.asServiceRole.entities.CommunicationEvent.filter({
    provider_message_id: "evt_checkout_1:order_confirmation",
  });
  assert.equal(confirmationEvents.length, 1);
});

test("invoice.payment_failed sync keeps history but marks billing warning state", async () => {
  const { base44 } = createFakeBase44({
    orders: [
      buildOrder({
        payment_status: "paid",
        billing_status: "active",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        install_initialized_at: "2026-04-29T01:02:03.000Z",
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
        ],
      }),
    ],
    subscriptions: [
      {
        id: "sub_rec_1",
        order_id: "order_1",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        plan_type: "Starter System",
        status: "active",
        services_included: ["instant_lead_response"],
      },
    ],
  });

  await handleInvoiceLifecycleEvent({
    base44,
    stripe: {
      subscriptions: {
        async retrieve() {
          return buildStripeSubscription({ status: "past_due" });
        },
      },
    },
    stripeInvoice: {
      id: "in_123",
      customer: "cus_123",
      subscription: "sub_123",
      amount_due: 9700,
      amount_paid: 0,
    },
    eventType: "invoice.payment_failed",
    eventId: "evt_invoice_failed_1",
    now: "2026-04-29T03:02:03.000Z",
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get("order_1");
  assert.equal(savedOrder.payment_status, "failed");
  assert.equal(savedOrder.subscription_status, "past_due");
  assert.equal(savedOrder.billing_status, "past_due");
  assert.equal(savedOrder.items[0].service_access_status, "past_due");
  assert.equal(savedOrder.items[0].install_status, "Live");
});

test("invoice.payment_succeeded restores paid billing state safely", async () => {
  const { base44 } = createFakeBase44({
    orders: [
      buildOrder({
        payment_status: "failed",
        billing_status: "past_due",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "past_due",
        install_initialized_at: "2026-04-29T01:02:03.000Z",
      }),
    ],
    subscriptions: [
      {
        id: "sub_rec_1",
        order_id: "order_1",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        plan_type: "Starter System",
        status: "past_due",
        services_included: ["instant_lead_response"],
      },
    ],
  });

  await handleInvoiceLifecycleEvent({
    base44,
    stripe: {
      subscriptions: {
        async retrieve() {
          return buildStripeSubscription({ status: "active" });
        },
      },
    },
    stripeInvoice: {
      id: "in_456",
      customer: "cus_123",
      subscription: "sub_123",
      amount_due: 9700,
      amount_paid: 9700,
    },
    eventType: "invoice.payment_succeeded",
    eventId: "evt_invoice_paid_1",
    now: "2026-04-29T04:02:03.000Z",
  });

  const savedOrder = await base44.asServiceRole.entities.Order.get("order_1");
  assert.equal(savedOrder.payment_status, "paid");
  assert.equal(savedOrder.subscription_status, "active");
  assert.equal(savedOrder.billing_status, "active");
});
