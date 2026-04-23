import test from "node:test";
import assert from "node:assert/strict";

import {
  AdminOnboardingAttachError,
  attachAdminOnboardingToOrder,
} from "../base44/functions/_shared/adminOnboardingAttach.js";

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

function buildTrackedItem(productId, productName) {
  return {
    product_id: productId,
    product_name: productName,
    status: "pending",
  };
}

function buildPaidOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-04-22T12:00:00.000Z",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    items: [
      buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response"),
      buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back"),
    ],
    total_setup: 494,
    total_monthly: 164,
    payment_status: "paid",
    order_status: "paid_setup_in_progress",
    ...overrides,
  };
}

function createFakeBase44({
  orders = [],
  clients = [],
  projects = [],
  onboardingClients = [],
  events = [],
} = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Client: new InMemoryCollection(clients),
    ClientProject: new InMemoryCollection(projects),
    OnboardingClient: new InMemoryCollection(onboardingClients),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

test("admin attach links a paid order into canonical onboarding and updates supplemental fields", async () => {
  const { base44, entities } = createFakeBase44({
    orders: [buildPaidOrder()],
  });

  const result = await attachAdminOnboardingToOrder({
    base44,
    payload: {
      order_id: "order_1",
      website: "https://signal.example.com",
      instagram: "@signalmedspa",
      industry: "Med Spa",
      services: "Botox, Fillers",
      tone_of_voice: "Luxury",
      booking_platform: "Acuity",
      booking_link: "https://book.signal.example.com",
      lead_sources: "Website, Phone",
      start_date: "2026-04-23",
    },
  });

  assert.equal(result.success, true);
  assert.equal(entities.Client.records.length, 1);
  assert.equal(entities.ClientProject.records.length, 1);
  assert.equal(entities.OnboardingClient.records.length, 1);

  const client = entities.Client.records[0];
  const onboardingClient = entities.OnboardingClient.records[0];
  const order = await entities.Order.get("order_1");

  assert.equal(order.client_id, client.id);
  assert.equal(order.onboarding_client_id, onboardingClient.id);
  assert.equal(client.website, "https://signal.example.com");
  assert.deepEqual(client.services, ["Botox", "Fillers"]);
  assert.equal(onboardingClient.booking_link, "https://book.signal.example.com");
  assert.equal(onboardingClient.order_id, "order_1");
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "workflow_triggered" && event.order_id === "order_1"
    )
  );
});

test("admin attach blocks unpaid orders", async () => {
  const { base44, entities } = createFakeBase44({
    orders: [
      buildPaidOrder({
        payment_status: "pending",
        order_status: "pending_payment",
      }),
    ],
  });

  await assert.rejects(
    attachAdminOnboardingToOrder({
      base44,
      payload: {
        order_id: "order_1",
      },
    }),
    (error) => {
      assert.ok(error instanceof AdminOnboardingAttachError);
      assert.equal(error.code, "admin_onboarding_attach_requires_paid_order");
      return true;
    }
  );

  assert.equal(entities.OnboardingClient.records.length, 0);
});

test("admin attach fails closed when canonical linking is ambiguous", async () => {
  const { base44, entities } = createFakeBase44({
    orders: [buildPaidOrder()],
    clients: [
      {
        id: "client_1",
        email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
      {
        id: "client_2",
        email: "owner@example.com",
        business_name: "Signal Med Spa",
      },
    ],
  });

  await assert.rejects(
    attachAdminOnboardingToOrder({
      base44,
      payload: {
        order_id: "order_1",
      },
    }),
    (error) => {
      assert.ok(error instanceof AdminOnboardingAttachError);
      assert.equal(error.code, "install_linking_client_ambiguous");
      return true;
    }
  );

  const order = await entities.Order.get("order_1");
  assert.match(order.pipeline_error, /Multiple client records match paid order/);
  assert.equal(entities.OnboardingClient.records.length, 0);
});
