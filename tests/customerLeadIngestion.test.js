import test from "node:test";
import assert from "node:assert/strict";

import { executeOrderServiceRuntime } from "../base44/functions/_shared/installRuntime.js";
import { ingestCustomerLead, CustomerLeadIngestionError } from "../base44/functions/_shared/customerLeadIngestion.js";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async list() {
    return [...this.records];
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

function buildTrackedItem(productId, productName, installStatus = "Live") {
  return {
    product_id: productId,
    product_name: productName,
    tracking_enabled: true,
    install_status: installStatus,
    status: installStatus === "Live" ? "live" : "setting_up",
  };
}

function buildRuntimeReadyOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-04-20T12:00:00.000Z",
    payment_status: "paid",
    pipeline_status: "Live",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    client_id: "client_1",
    client_project_id: "project_1",
    onboarding_client_id: "onboarding_1",
    lead_ingestion_api_key: "api_live_1",
    lead_ingestion_webhook_secret: "secret_live_1",
    items: [
      buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response", "Live"),
      buildTrackedItem("prod_UNi5N0l5MtaV0R", "14-Day Nurture Sequence", "Live"),
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
        nurture_sequence_14d: {
          sms_enabled: true,
          email_enabled: false,
          steps: [
            { day: 1, channel: "sms", message_template: "Day 1 SMS for {{business_name}}." },
            { day: 3, channel: "sms", message_template: "Day 3 SMS for {{business_name}}." },
            { day: 7, channel: "sms", message_template: "Day 7 SMS for {{business_name}}." },
          ],
        },
      },
    },
    ...overrides,
  };
}

function createFakeBase44({ orders = [], projects = [], leads = [], drips = [], events = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders.length ? orders : [buildRuntimeReadyOrder()]),
    ClientProject: new InMemoryCollection(
      projects.length
        ? projects
        : [
            {
              id: "project_1",
              client_id: "client_1",
              client_email: "owner@example.com",
              client_name: "Jamie Owner",
              business_name: "Signal Med Spa",
            },
          ]
    ),
    Leads: new InMemoryCollection(leads),
    DripCampaign: new InMemoryCollection(drips),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

function buildSmsRuntimeDependency() {
  return async (args) =>
    executeOrderServiceRuntime({
      ...args,
      sendSms: async () => ({
        provider_message_id: "SM_ingest_1",
        provider_status: "sent",
      }),
    });
}

test("valid customer lead ingestion creates canonical Leads, maps the client, and logs runtime events", async () => {
  const { base44, entities } = createFakeBase44();

  const result = await ingestCustomerLead({
    base44,
    payload: {
      api_key: "api_live_1",
      full_name: "Alex Lead",
      business_name: "Signal Med Spa",
      email: "alex@example.com",
      phone: "602-555-0001",
      business_type: "Med Spa",
      problem: "Need faster follow-up",
      source: "external_crm",
      intake_type: "client_web_form",
      idempotency_key: "evt_1",
    },
    now: "2026-04-29T12:00:00.000Z",
    dependencies: {
      executeInstantResponse: buildSmsRuntimeDependency(),
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.created, true);
  assert.equal(result.order_id, "order_1");
  assert.equal(result.client_project_id, "project_1");
  assert.equal(result.identity_method, "api_key");
  assert.equal(entities.Leads.records.length, 1);
  assert.equal(entities.DripCampaign.records.length, 1);

  const lead = entities.Leads.records[0];
  assert.equal(lead.order_id, "order_1");
  assert.equal(lead.client_project_id, "project_1");
  assert.equal(lead.status, "Contacted");

  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "lead_created" && event.lead_id === lead.id && event.order_id === "order_1"
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.event_type === "provider_send_succeeded" &&
        event.service_key === "instant_lead_response" &&
        event.lead_id === lead.id
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.event_type === "workflow_triggered" &&
        event.service_key === "nurture_sequence_14d" &&
        event.lead_id === lead.id
    )
  );
});

test("ingestion rejects payloads with missing identity", async () => {
  const { base44 } = createFakeBase44();

  await assert.rejects(
    () =>
      ingestCustomerLead({
        base44,
        payload: {
          full_name: "Alex Lead",
          business_name: "Signal Med Spa",
          email: "alex@example.com",
        },
      }),
    (error) => {
      assert.equal(error instanceof CustomerLeadIngestionError, true);
      assert.equal(error.code, "customer_lead_identity_required");
      return true;
    }
  );
});

test("client_project_id plus webhook secret maps the lead to the correct paid customer order", async () => {
  const { base44, entities } = createFakeBase44();

  const result = await ingestCustomerLead({
    base44,
    payload: {
      client_project_id: "project_1",
      webhook_secret: "secret_live_1",
      full_name: "Blair Project Lead",
      business_name: "Signal Med Spa",
      email: "blair@example.com",
      phone: "602-555-0002",
      source: "api_webhook",
      intake_type: "crm_sync",
    },
    now: "2026-04-29T12:05:00.000Z",
    dependencies: {
      executeInstantResponse: async () => ({ success: true, provider_message_id: "SM_project_1" }),
      enrollNurture: async () => ({ success: true, campaign_id: "campaign_1", skipped: false }),
    },
  });

  assert.equal(result.identity_method, "client_project_id_plus_secret");
  assert.equal(result.order_id, "order_1");
  assert.equal(entities.Leads.records[0].client_project_id, "project_1");
});

test("idempotency key prevents duplicate lead creation and duplicate initial response", async () => {
  const { base44, entities } = createFakeBase44();

  const payload = {
    api_key: "api_live_1",
    full_name: "Casey Replay",
    business_name: "Signal Med Spa",
    email: "casey@example.com",
    phone: "602-555-0003",
    source: "external_crm",
    intake_type: "api_webhook",
    idempotency_key: "evt_replay_1",
  };

  const first = await ingestCustomerLead({
    base44,
    payload,
    now: "2026-04-29T12:10:00.000Z",
    dependencies: {
      executeInstantResponse: buildSmsRuntimeDependency(),
    },
  });
  const second = await ingestCustomerLead({
    base44,
    payload,
    now: "2026-04-29T12:11:00.000Z",
    dependencies: {
      executeInstantResponse: buildSmsRuntimeDependency(),
    },
  });

  assert.equal(first.created, true);
  assert.equal(second.idempotent_replay, true);
  assert.equal(entities.Leads.records.length, 1);
  assert.equal(
    entities.CommunicationEvent.records.filter((event) => event.event_type === "provider_send_attempted").length,
    1
  );
});

test("recent duplicate email or phone reuses the canonical lead and skips immediate automation", async () => {
  const existingLead = {
    id: "lead_existing",
    created_date: "2026-04-29T11:55:00.000Z",
    full_name: "Dana Existing",
    business_name: "Signal Med Spa",
    email: "dana@example.com",
    phone: "+16025550004",
    order_id: "order_1",
    client_project_id: "project_1",
    client_id: "client_1",
    normalized_email: "dana@example.com",
    normalized_phone: "16025550004",
    status: "New",
    last_activity_at: "2026-04-29T11:55:00.000Z",
  };
  const { base44, entities } = createFakeBase44({
    leads: [existingLead],
  });

  let instantResponseCalls = 0;
  const result = await ingestCustomerLead({
    base44,
    payload: {
      api_key: "api_live_1",
      full_name: "Dana Existing",
      business_name: "Signal Med Spa",
      email: "dana@example.com",
      phone: "602-555-0004",
      source: "client_form",
      intake_type: "client_web_form",
    },
    now: "2026-04-29T12:00:00.000Z",
    dependencies: {
      executeInstantResponse: async () => {
        instantResponseCalls += 1;
        return { success: true };
      },
    },
  });

  assert.equal(result.created, false);
  assert.equal(result.deduped, true);
  assert.equal(result.duplicate_suppressed, true);
  assert.equal(instantResponseCalls, 0);
  assert.equal(entities.Leads.records.length, 1);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.subject === "Customer lead automations skipped" &&
        event.lead_id === "lead_existing"
    )
  );
});
