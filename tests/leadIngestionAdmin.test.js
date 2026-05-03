import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ingestCustomerLead, CustomerLeadIngestionError } from "../base44/functions/_shared/customerLeadIngestion.js";
import {
  getLeadIngestionSetupData,
  issueOrderLeadIngestionCredentials,
  revokeOrderLeadIngestionCredentials,
  rotateOrderLeadIngestionCredentials,
  runLeadIngestionAdminTest,
  LeadIngestionAdminError,
} from "../base44/functions/_shared/leadIngestionAdmin.js";

const repoRoot = path.resolve(import.meta.dirname, "..");

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

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
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
    lead_ingestion_api_key: "",
    lead_ingestion_webhook_secret: "",
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

function createFakeBase44({ orders = [], projects = [], leads = [], drips = [], events = [], websiteLeads = [] } = {}) {
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
    WebsiteLead: new InMemoryCollection(websiteLeads),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

test("getLeadIngestionSetupData returns masked values and webhook instructions", async () => {
  const { base44 } = createFakeBase44({
    orders: [
      buildRuntimeReadyOrder({
        lead_ingestion_api_key: "cli_lead_1234567890abcdef",
        lead_ingestion_webhook_secret: "whsec_1234567890abcdef",
        lead_ingestion_credentials_issued_at: "2026-04-29T10:00:00.000Z",
      }),
    ],
  });

  const setup = await getLeadIngestionSetupData({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/getLeadIngestionSetup",
  });

  assert.equal(setup.credential_status, "active");
  assert.equal(setup.webhook_url, "https://apexflow.base44.app/functions/v1/webhookLeadCapture");
  assert.notEqual(setup.credentials.masked_api_key, "cli_lead_1234567890abcdef");
  assert.equal(setup.credentials.masked_api_key.endsWith("cdef"), true);
  assert.equal(setup.credentials.masked_api_key.includes("cli_lead_1234567890abcdef"), false);
  assert.equal(setup.example_curl.includes("<lead_ingestion_api_key>"), true);
  assert.equal(Array.isArray(setup.setup_instructions), true);
  assert.equal(setup.warning.includes("WebsiteLead"), true);
  assert.equal("reveal_once_credentials" in setup, false);
});

test("issuing credentials is limited to paid linked orders", async () => {
  const unpaid = createFakeBase44({
    orders: [buildRuntimeReadyOrder({ id: "order_unpaid", payment_status: "pending" })],
  });
  await assert.rejects(
    () =>
      issueOrderLeadIngestionCredentials({
        base44: unpaid.base44,
        orderId: "order_unpaid",
        requestUrl: "https://apexflow.base44.app/functions/v1/issueLeadIngestionCredentials",
      }),
    (error) => {
      assert.equal(error instanceof LeadIngestionAdminError, true);
      assert.equal(error.code, "lead_ingestion_order_not_paid");
      return true;
    }
  );

  const unlinked = createFakeBase44({
    orders: [buildRuntimeReadyOrder({ id: "order_unlinked", client_project_id: "" })],
  });
  await assert.rejects(
    () =>
      issueOrderLeadIngestionCredentials({
        base44: unlinked.base44,
        orderId: "order_unlinked",
        requestUrl: "https://apexflow.base44.app/functions/v1/issueLeadIngestionCredentials",
      }),
    (error) => {
      assert.equal(error instanceof LeadIngestionAdminError, true);
      assert.equal(error.code, "lead_ingestion_client_project_required");
      return true;
    }
  );
});

test("rotating credentials invalidates the previous API key and webhook secret", async () => {
  const { base44, entities } = createFakeBase44();

  const issued = await issueOrderLeadIngestionCredentials({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/issueLeadIngestionCredentials",
    now: "2026-04-29T12:00:00.000Z",
  });
  const originalApiKey = issued.credentials.api_key;
  const originalSecret = issued.credentials.webhook_secret;

  const rotated = await rotateOrderLeadIngestionCredentials({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/rotateLeadIngestionCredentials",
    now: "2026-04-29T12:05:00.000Z",
  });

  assert.notEqual(rotated.credentials.api_key, originalApiKey);
  assert.notEqual(rotated.credentials.webhook_secret, originalSecret);
  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.subject === "Lead ingestion credentials rotated"),
    true
  );

  await assert.rejects(
    () =>
      ingestCustomerLead({
        base44,
        payload: {
          api_key: originalApiKey,
          full_name: "Old Key Lead",
          business_name: "Signal Med Spa",
          email: "old-key@example.com",
        },
      }),
    (error) => {
      assert.equal(error instanceof CustomerLeadIngestionError, true);
      assert.equal(error.code, "customer_lead_order_not_found");
      return true;
    }
  );

  await assert.rejects(
    () =>
      ingestCustomerLead({
        base44,
        payload: {
          order_id: "order_1",
          webhook_secret: originalSecret,
          full_name: "Old Secret Lead",
          business_name: "Signal Med Spa",
          email: "old-secret@example.com",
        },
      }),
    (error) => {
      assert.equal(error instanceof CustomerLeadIngestionError, true);
      assert.equal(error.code, "customer_lead_webhook_secret_invalid");
      return true;
    }
  );
});

test("revoked credentials can no longer ingest leads", async () => {
  const { base44, entities } = createFakeBase44();

  const issued = await issueOrderLeadIngestionCredentials({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/issueLeadIngestionCredentials",
    now: "2026-04-29T12:00:00.000Z",
  });

  await revokeOrderLeadIngestionCredentials({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/revokeLeadIngestionCredentials",
    now: "2026-04-29T12:10:00.000Z",
  });

  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.subject === "Lead ingestion credentials revoked"),
    true
  );

  await assert.rejects(
    () =>
      ingestCustomerLead({
        base44,
        payload: {
          api_key: issued.credentials.api_key,
          full_name: "Revoked Lead",
          business_name: "Signal Med Spa",
          email: "revoked@example.com",
        },
      }),
    (error) => {
      assert.equal(error instanceof CustomerLeadIngestionError, true);
      assert.equal(error.code, "customer_lead_order_not_found");
      return true;
    }
  );
});

test("runLeadIngestionAdminTest logs canonical lead events without writing WebsiteLead", async () => {
  const { base44, entities } = createFakeBase44();

  await issueOrderLeadIngestionCredentials({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/issueLeadIngestionCredentials",
    now: "2026-04-29T12:00:00.000Z",
  });

  const result = await runLeadIngestionAdminTest({
    base44,
    orderId: "order_1",
    requestUrl: "https://apexflow.base44.app/functions/v1/runLeadIngestionSetupTest",
    now: "2026-04-29T12:20:00.000Z",
  });

  assert.equal(result.test_result.success, true);
  assert.equal(entities.Leads.records.length, 1);
  assert.equal(entities.WebsiteLead.records.length, 0);
  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.subject === "Lead ingestion admin test executed"),
    true
  );
  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.event_type === "lead_created"),
    true
  );
  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.event_type === "workflow_triggered"),
    true
  );
});

test("lead ingestion admin entrypoints require admin auth and stay off WebsiteLead", () => {
  const entrypoints = [
    "base44/functions/getLeadIngestionSetup/entry.ts",
    "base44/functions/issueLeadIngestionCredentials/entry.ts",
    "base44/functions/rotateLeadIngestionCredentials/entry.ts",
    "base44/functions/revokeLeadIngestionCredentials/entry.ts",
    "base44/functions/runLeadIngestionSetupTest/entry.ts",
  ];

  for (const relativePath of entrypoints) {
    const source = readRepoFile(relativePath);
    assert.match(source, /requireAdminUser/);
    assert.doesNotMatch(source, /WebsiteLead/);
  }

  const sharedSource = readRepoFile("base44/functions/_shared/leadIngestionAdmin.js");
  assert.match(sharedSource, /ingestCustomerLead/);
  assert.doesNotMatch(sharedSource, /entities\.WebsiteLead\b/);
});
