import test from "node:test";
import assert from "node:assert/strict";

import {
  ClientOnboardingAccessError,
  submitClientOnboardingAccess,
} from "../base44/functions/_shared/clientOnboardingAccess.js";

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

function createFakeBase44({
  orders = [],
  clients = [],
  projects = [],
  onboardingClients = [],
  communicationEvents = [],
} = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Client: new InMemoryCollection(clients),
    ClientProject: new InMemoryCollection(projects),
    OnboardingClient: new InMemoryCollection(onboardingClients),
    CommunicationEvent: new InMemoryCollection(communicationEvents),
  };

  const inviteCalls = [];

  return {
    entities,
    inviteCalls,
    base44: {
      asServiceRole: { entities },
      users: {
        async inviteUser(email, role) {
          inviteCalls.push({ email, role });
          return { success: true };
        },
      },
    },
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

test("canonical onboarding attaches to the paid order path without creating duplicate project records", async () => {
  const { base44, entities, inviteCalls } = createFakeBase44({
    orders: [buildPaidOrder()],
  });

  const result = await submitClientOnboardingAccess({
    base44,
    payload: {
      flow: "onboarding",
      full_name: "Jamie Owner",
      business_name: "Signal Med Spa",
      email: "owner@example.com",
      phone: "+16025550123",
      website: "https://signal.example.com",
      social_media: "@signalmedspa",
      services: ["Botox / Injectables", "Fillers"],
      lead_sources: ["Website Forms", "Phone Calls"],
      booking_link: "https://book.signal.example.com",
      calendar_system: "Acuity",
      brand_voice: "Luxury",
    },
  });

  assert.equal(result.success, true);
  assert.equal(entities.Client.records.length, 1);
  assert.equal(entities.ClientProject.records.length, 1);
  assert.equal(entities.OnboardingClient.records.length, 1);
  assert.equal(inviteCalls.length, 1);

  const client = entities.Client.records[0];
  const project = entities.ClientProject.records[0];
  const onboardingClient = entities.OnboardingClient.records[0];
  const order = await entities.Order.get("order_1");

  assert.equal(order.client_id, client.id);
  assert.equal(order.client_project_id, project.id);
  assert.equal(order.onboarding_client_id, onboardingClient.id);
  assert.equal(project.step_onboarding, "complete");
  assert.equal(onboardingClient.booking_link, "https://book.signal.example.com");
  assert.equal(onboardingClient.services, "Botox / Injectables, Fillers");
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "workflow_triggered" && event.order_id === "order_1"
    )
  );
});

test("signup is blocked when no canonical paid order exists", async () => {
  const { base44, entities, inviteCalls } = createFakeBase44();

  await assert.rejects(
    submitClientOnboardingAccess({
      base44,
      payload: {
        flow: "signup",
        full_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        email: "owner@example.com",
        phone: "+16025550123",
      },
    }),
    (error) => {
      assert.ok(error instanceof ClientOnboardingAccessError);
      assert.equal(error.code, "canonical_paid_order_not_found");
      return true;
    }
  );

  assert.equal(entities.Client.records.length, 0);
  assert.equal(entities.ClientProject.records.length, 0);
  assert.equal(inviteCalls.length, 0);
});

test("signup does not duplicate canonically linked records on repeat submission", async () => {
  const { base44, entities, inviteCalls } = createFakeBase44({
    orders: [
      buildPaidOrder({
        client_id: "client_1",
        client_project_id: "project_1",
        onboarding_client_id: "onboard_1",
        install_initialized_at: "2026-04-22T12:05:00.000Z",
      }),
    ],
    clients: [
      {
        id: "client_1",
        email: "owner@example.com",
        full_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        phone: "+16025550123",
        status: "Onboarding",
      },
    ],
    projects: [
      {
        id: "project_1",
        client_id: "client_1",
        client_email: "owner@example.com",
        client_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        step_onboarding: "pending",
      },
    ],
    onboardingClients: [
      {
        id: "onboard_1",
        client_id: "client_1",
        client_project_id: "project_1",
        order_id: "order_1",
        email: "owner@example.com",
        owner_name: "Jamie Owner",
        business_name: "Signal Med Spa",
        phone: "+16025550123",
      },
    ],
  });

  await submitClientOnboardingAccess({
    base44,
    payload: {
      flow: "signup",
      full_name: "Jamie Owner",
      business_name: "Signal Med Spa",
      email: "owner@example.com",
      phone: "+16025550123",
      website: "https://signal.example.com",
    },
  });

  assert.equal(entities.Client.records.length, 1);
  assert.equal(entities.ClientProject.records.length, 1);
  assert.equal(entities.OnboardingClient.records.length, 1);
  assert.equal(inviteCalls.length, 1);
  assert.equal((await entities.ClientProject.get("project_1")).step_onboarding, "pending");
  assert.equal((await entities.Client.get("client_1")).website, "https://signal.example.com");
});
