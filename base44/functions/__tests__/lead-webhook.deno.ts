import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  computeWebhookSignature,
  handleLeadCaptureWebhook,
} from "../webhookLeadCapture/entry.ts";

class InMemoryCollection {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
    this.sequence = initialRecords.length + 1;
  }

  async get(id) {
    const record = this.records.find((entry) => entry.id === id);
    if (!record) {
      throw new Error(`Record ${id} not found`);
    }
    return { ...record };
  }

  async filter(query = {}) {
    return this.records
      .filter((record) =>
        Object.entries(query).every(([key, value]) => record[key] === value)
      )
      .map((record) => ({ ...record }));
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

function createFakeBase44() {
  const entities = {
    WebsiteLead: new InMemoryCollection(),
    Leads: new InMemoryCollection(),
    CommunicationEvent: new InMemoryCollection(),
    WebhookRegistration: new InMemoryCollection([
      {
        id: "whreg_1",
        source_name: "Typeform",
        service_key: "instant_lead_response",
        client_project_id: "project_1",
        secret_key: "whsec_test_secret",
        signature_algorithm: "hmac_sha256",
        status: "active",
        failure_count: 0,
      },
    ]),
    ClientProject: new InMemoryCollection([
      {
        id: "project_1",
        business_name: "Signal Med Spa",
        client_email: "owner@example.com",
        contact_email: "owner@example.com",
      },
    ]),
  };

  return {
    entities,
    base44: {
      asServiceRole: {
        entities,
        functions: {
          async invoke() {
            return { success: true };
          },
        },
      },
    },
  };
}

Deno.test("unsigned lead webhook is rejected and logged", async () => {
  const { base44, entities } = createFakeBase44();
  const req = new Request("https://example.com/api/functions/webhookLeadCapture", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      full_name: "Taylor Prospect",
      email: "taylor@example.com",
    }),
  });

  const response = await handleLeadCaptureWebhook(req, base44);
  const json = await response.json();

  assertEquals(response.status, 401);
  assertEquals(json.code, "lead_webhook_signature_missing");
  assertEquals(entities.WebsiteLead.records.length, 0);
  assertEquals(entities.Leads.records.length, 0);
  assertEquals(entities.CommunicationEvent.records.length, 1);
  assertEquals(entities.CommunicationEvent.records[0].status, "failed");
});

Deno.test("signed lead webhook uses the registered project and ignores payload routing hints", async () => {
  const { base44, entities } = createFakeBase44();
  const payload = JSON.stringify({
    full_name: "Taylor Prospect",
    email: "taylor@example.com",
    phone: "+16025550099",
    business_name: "Prospect Business",
    problem: "Need faster callback automation",
    routing_key: "wrong-project",
    project_id: "wrong-project",
    requested_channels: ["sms", "email"],
    consent_given: true,
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await computeWebhookSignature("whsec_test_secret", timestamp, payload);

  const req = new Request("https://example.com/api/functions/webhookLeadCapture", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-id": "whreg_1",
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": `sha256=${signature}`,
      "user-agent": "DenoTest/1.0",
    },
    body: payload,
  });

  const response = await handleLeadCaptureWebhook(req, base44);
  const json = await response.json();

  assertEquals(response.status, 200);
  assertEquals(json.success, true);
  assertEquals(json.client_project_id, "project_1");
  assertEquals(entities.WebsiteLead.records.length, 1);
  assertEquals(entities.Leads.records.length, 1);
  assertEquals(entities.WebsiteLead.records[0].client_project_id, "project_1");
  assertEquals(entities.WebsiteLead.records[0].routing_key, "whreg_1");
  assertEquals(entities.Leads.records[0].assigned_to, "owner@example.com");
  assert(
    entities.CommunicationEvent.records.some(
      (entry) => entry.event_type === "lead_created" && entry.context_id === "whreg_1",
    ),
  );

  const registration = await entities.WebhookRegistration.get("whreg_1");
  assert(registration.last_triggered_at);
  assertEquals(registration.last_error, "");
});
