import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { processCheckoutSessionCompleted } from "../_shared/stripeOrderWebhook.js";

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

function buildTrackedItem(product_id, product_name) {
  return {
    product_id,
    product_name,
    status: "pending",
  };
}

function createFakeBase44() {
  const entities = {
    Order: new InMemoryCollection([
      {
        id: "order_1",
        created_date: "2026-05-10T10:00:00.000Z",
        customer_email: "owner@example.com",
        customer_name: "Jamie Owner",
        customer_phone: "+16025550123",
        business_name: "Signal Med Spa",
        pricing_summary: {
          package_key: "growth_system",
          package_name: "Growth System",
        },
        selected_package_type: "growth_system",
        package_type: "growth_system",
        items: [
          buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response"),
          buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back"),
          buildTrackedItem("prod_UNi5N0l5MtaV0R", "14-Day Nurture Sequence"),
          buildTrackedItem("prod_UNi5fLL2SyJJdP", "AI Booking Agent"),
        ],
        total_setup: 994,
        total_monthly: 314,
        payment_status: "pending",
        order_status: "pending_payment",
      },
    ]),
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
    CommunicationEvent: new InMemoryCollection(),
  };

  const invited = [];
  const invoked = [];

  return {
    entities,
    invited,
    invoked,
    base44: {
      users: {
        async inviteUser(email, role) {
          invited.push({ email, role });
          return {
            activation_link: `https://clientsurgesystems.com/activate/${email}`,
          };
        },
      },
      asServiceRole: {
        entities,
        functions: {
          async invoke(name, payload) {
            invoked.push({ name, payload });
            return { success: true };
          },
        },
      },
    },
  };
}

Deno.test("checkout.session.completed processing is idempotent across legacy wrapper sources", async () => {
  const { base44, entities, invited, invoked } = createFakeBase44();
  const event = {
    id: "evt_checkout_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        customer: "cus_123",
        customer_email: "owner@example.com",
        metadata: {
          order_id: "order_1",
          package_key: "growth_system",
        },
      },
    },
  };

  const firstResult = await processCheckoutSessionCompleted({
    base44,
    event,
    source: "stripeWebhookOrders",
  });

  assertEquals(firstResult.success, true);

  const updatedOrder = await entities.Order.get("order_1");
  assertEquals(updatedOrder.payment_status, "paid");
  assertEquals(updatedOrder.stripe_event_id, "evt_checkout_1");
  assertEquals(updatedOrder.stripe_session_id, "cs_test_1");
  assertEquals(updatedOrder.stripe_customer_id, "cus_123");
  assert(updatedOrder.client_id);
  assert(updatedOrder.client_project_id);
  assert(updatedOrder.onboarding_client_id);
  assertEquals(updatedOrder.pipeline_status, "Ready for Install");
  assertEquals(
    updatedOrder.items.map((item) => item.install_status).join(","),
    "Ready for Install,Ready for Install,Ready for Install,Ready for Install",
  );

  assertEquals(invited.length, 1);
  assertEquals(invoked.length, 3);
  const confirmationInvoke = invoked.find((entry) => entry.name === "sendOrderConfirmationEmail");
  assert(confirmationInvoke);
  assertEquals(confirmationInvoke.payload.order_id, "order_1");
  assert(
    String(confirmationInvoke.payload.portal_activation_url).includes("/activate/owner@example.com"),
  );
  const smsInvoke = invoked.find((entry) => entry.name === "sendSMS");
  assert(smsInvoke);
  assertEquals(smsInvoke.payload.phone, "+16025550123");
  assert(invoked.some((entry) => entry.name === "sendAdminPurchaseNotification"));

  const providerIds = entities.CommunicationEvent.records.map((entry) => entry.provider_message_id);
  assert(providerIds.includes("evt_checkout_1"));
  assert(providerIds.includes("portal_invite:order_1"));
  assert(providerIds.includes("order_confirmation:order_1"));

  const secondResult = await processCheckoutSessionCompleted({
    base44,
    event,
    source: "stripePaymentWebhook_legacy_wrapper",
  });

  assertEquals(secondResult.success, true);
  assertEquals(secondResult.duplicate, true);
  assertEquals(invited.length, 1);
  assertEquals(invoked.length, 3);
});
