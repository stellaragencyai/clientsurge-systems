import test from "node:test";
import assert from "node:assert/strict";

import {
  createQaCustomerFixture,
  QaCustomerFixtureError,
} from "../base44/functions/_shared/qaCustomerFixture.js";

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

  async list(sort = "-created_date", limit = 100) {
    const records = [...this.records];
    if (sort === "-created_date") {
      records.sort((left, right) =>
        new Date(right.created_date || 0).getTime() - new Date(left.created_date || 0).getTime()
      );
    }
    return records.slice(0, limit);
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

function createFakeBase44({
  orders = [],
  clients = [],
  clientProjects = [],
  onboardingClients = [],
  subscriptions = [],
  events = [],
} = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Client: new InMemoryCollection(clients),
    ClientProject: new InMemoryCollection(clientProjects),
    OnboardingClient: new InMemoryCollection(onboardingClients),
    Subscription: new InMemoryCollection(subscriptions),
    CommunicationEvent: new InMemoryCollection(events),
  };

  const invited = [];

  return {
    invited,
    users: {
      async inviteUser(email, role) {
        invited.push({ email, role });
        return { email, role };
      },
    },
    asServiceRole: {
      entities,
    },
  };
}

test("createQaCustomerFixture builds a canonical paid QA customer with active subscription state", async () => {
  const base44 = createFakeBase44();

  const result = await createQaCustomerFixture({
    base44,
    payload: {
      full_name: "Jamie Test",
      business_name: "Signal Med Spa QA",
      email: "qa-signal@example.com",
      phone: "+16025550123",
      website: "https://signal.example.com",
      package_key: "growth_system",
    },
    now: "2026-04-23T17:00:00.000Z",
    portalUrl: "https://apexflow.base44.app/client-portal",
  });

  assert.equal(result.success, true);
  assert.equal(result.plan_type, "Growth System");
  assert.equal(result.invite_sent, true);
  assert.equal(result.selected_service_keys.length, 4);

  const savedOrder = await base44.asServiceRole.entities.Order.get(result.order_id);
  assert.equal(savedOrder.payment_status, "paid");
  assert.equal(savedOrder.subscription_status, "active");
  assert.equal(savedOrder.plan_type, "Growth System");
  assert.equal(savedOrder.items.length, 4);
  assert.ok(savedOrder.client_id);
  assert.ok(savedOrder.client_project_id);
  assert.ok(savedOrder.onboarding_client_id);

  const subscription = await base44.asServiceRole.entities.Subscription.get(result.subscription_id);
  assert.equal(subscription.status, "active");
  assert.deepEqual(
    subscription.services_included.sort(),
    [
      "ai_booking_agent",
      "instant_lead_response",
      "missed_call_text_back",
      "nurture_sequence_14d",
    ]
  );

  const client = await base44.asServiceRole.entities.Client.get(savedOrder.client_id);
  assert.equal(client.email, "qa-signal@example.com");
  assert.equal(client.website, "https://signal.example.com");

  const project = await base44.asServiceRole.entities.ClientProject.get(savedOrder.client_project_id);
  assert.equal(project.client_email, "qa-signal@example.com");
  assert.equal(project.plan, "Growth System");

  const onboarding = await base44.asServiceRole.entities.OnboardingClient.get(savedOrder.onboarding_client_id);
  assert.equal(onboarding.email, "qa-signal@example.com");
  assert.equal(onboarding.website, "https://signal.example.com");

  const events = await base44.asServiceRole.entities.CommunicationEvent.filter({ order_id: result.order_id });
  assert.ok(events.some((event) => event.event_type === "order_paid"));
  assert.ok(events.some((event) => event.event_type === "install_initialized"));
  assert.ok(events.some((event) => event.subject === "QA customer fixture created"));
  assert.deepEqual(base44.invited, [{ email: "qa-signal@example.com", role: "user" }]);
});

test("createQaCustomerFixture blocks duplicate portal emails before creating an ambiguous QA user", async () => {
  const base44 = createFakeBase44({
    clients: [
      {
        id: "client_existing",
        email: "qa-duplicate@example.com",
        full_name: "Existing User",
        business_name: "Existing Business",
        phone: "+16025550000",
      },
    ],
  });

  await assert.rejects(
    () =>
      createQaCustomerFixture({
        base44,
        payload: {
          full_name: "Jamie Test",
          business_name: "Signal Med Spa QA",
          email: "qa-duplicate@example.com",
          phone: "+16025550123",
          package_key: "starter_system",
        },
        portalUrl: "https://apexflow.base44.app/client-portal",
      }),
    (error) => {
      assert.ok(error instanceof QaCustomerFixtureError);
      assert.equal(error.code, "qa_customer_email_conflict");
      return true;
    }
  );
});
