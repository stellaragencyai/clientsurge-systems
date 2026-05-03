import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProviderProofWorkspaceData,
  PROVIDER_DEPLOYMENT_STATUS,
  runOrderProviderProof,
  ProviderProofError,
} from "../base44/functions/_shared/providerProof.js";
import { RuntimeExecutionError } from "../base44/functions/_shared/installRuntime.js";
import { deriveIntegrationHealth } from "../base44/functions/_shared/integrationHealth.js";

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

function buildTrackedItem(productId, productName, serviceKey, installStatus = "Live") {
  return {
    product_id: productId,
    product_name: productName,
    service_key: serviceKey,
    tracking_enabled: true,
    install_status: installStatus,
    status: installStatus === "Live" ? "live" : "setting_up",
  };
}

function buildRuntimeReadyOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-04-29T10:00:00.000Z",
    payment_status: "paid",
    pipeline_status: "Live",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    client_id: "client_1",
    client_project_id: "project_1",
    onboarding_client_id: "onboarding_1",
    lead_ingestion_api_key: "cli_lead_live_1",
    lead_ingestion_webhook_secret: "whsec_live_1",
    items: [
      buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response", "instant_lead_response", "Live"),
      buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back", "missed_call_text_back", "Live"),
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
        missed_call_text_back: {
          sms_template: "Sorry we missed your call, {{caller_name}}.",
        },
      },
    },
    ...overrides,
  };
}

function createFakeBase44({ orders = [], events = [], adminSettings = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders.length ? orders : [buildRuntimeReadyOrder()]),
    ClientProject: new InMemoryCollection([
      {
        id: "project_1",
        client_id: "client_1",
        client_email: "owner@example.com",
        client_name: "Jamie Owner",
        business_name: "Signal Med Spa",
      },
    ]),
    CommunicationEvent: new InMemoryCollection(events),
    AdminSettings: new InMemoryCollection(
      adminSettings.length
        ? adminSettings
        : [
            {
              id: "settings_1",
              twilio_enabled: true,
              twilio_from_number: "+16025550999",
              resend_enabled: true,
              resend_from_email: "hello@clientsurge.test",
            },
          ]
    ),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      integrations: {
        Core: {
          SendEmail: async () => ({
            id: "email_proof_1",
            status: "sent",
          }),
        },
      },
    },
  };
}

function buildProviderReadiness() {
  return {
    twilio: {
      configured: true,
      derived_status: "configured",
      order_business_phone_present: true,
      order_business_phone: "+16025550999",
    },
    resend: {
      configured: true,
      derived_status: "configured",
    },
    webhook: {
      configured: true,
      derived_status: "configured",
    },
  };
}

test("buildProviderProofWorkspaceData distinguishes configured, test-wired, and live provider proofed", () => {
  const order = buildRuntimeReadyOrder();
  const now = "2026-04-29T12:30:00.000Z";
  const providerReadiness = buildProviderReadiness();
  const events = [
    {
      id: "evt_provider_test",
      order_id: "order_1",
      created_date: "2026-04-29T11:00:00.000Z",
      provider: "twilio",
      status: "processed",
      event_type: "status_update",
      subject: "Provider test: Twilio SMS",
      message_body: "Twilio credentials validated successfully.",
      metadata_json: JSON.stringify({
        context_type: "provider_test",
        integration_id: "twilio",
      }),
    },
    {
      id: "evt_webhook_live",
      order_id: "order_1",
      created_date: "2026-04-29T12:00:00.000Z",
      provider: "internal",
      channel: "webhook",
      status: "processed",
      event_type: "status_update",
      subject: "Lead ingestion webhook proof succeeded",
      metadata_json: JSON.stringify({
        context_type: "provider_proof",
        proof_kind: "lead_ingestion_webhook",
        proof_mode: "LIVE_PROVIDER_PROOF",
      }),
    },
    {
      id: "evt_twilio_live",
      order_id: "order_1",
      created_date: "2026-04-29T12:05:00.000Z",
      provider: "twilio",
      channel: "sms",
      direction: "outbound",
      status: "sent",
      event_type: "provider_send_succeeded",
      subject: "Instant Lead Response provider send succeeded",
      provider_message_id: "SM_live_1",
      metadata_json: JSON.stringify({
        runtime_type: "live_provider_proof_instant_lead_response",
        proof_mode: "LIVE_PROVIDER_PROOF",
      }),
    },
    {
      id: "evt_twilio_callback",
      order_id: "order_1",
      created_date: "2026-04-29T12:07:00.000Z",
      provider: "twilio",
      channel: "sms",
      status: "delivered",
      event_type: "status_update",
      subject: "Twilio delivery callback: delivered",
      provider_message_id: "SM_live_1",
      metadata_json: JSON.stringify({
        context_type: "provider_callback",
        callback_provider: "twilio",
        callback_type: "message_status",
      }),
    },
    {
      id: "evt_resend_test",
      order_id: "order_1",
      created_date: "2026-04-29T12:10:00.000Z",
      provider: "resend",
      channel: "email",
      status: "processed",
      event_type: "status_update",
      subject: "Provider test: Resend Email",
      metadata_json: JSON.stringify({
        context_type: "provider_test",
        integration_id: "email",
      }),
    },
  ];

  const proof = buildProviderProofWorkspaceData({
    order,
    orderEvents: events,
    providerReadiness,
    requestUrl: "https://apexflow.base44.app/functions/v1/getInstallConfiguration",
    now,
  });

  assert.equal(proof.webhook.derived_status, PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED);
  assert.equal(proof.twilio.derived_status, PROVIDER_DEPLOYMENT_STATUS.LIVE_PROVIDER_PROOFED);
  assert.equal(proof.resend.derived_status, PROVIDER_DEPLOYMENT_STATUS.TEST_WIRED);
  assert.equal(proof.twilio.last_delivery_callback.provider_message_id, "SM_live_1");
  assert.equal(proof.webhook.url.includes("webhookLeadCapture"), true);
  assert.equal(
    proof.missing_live_proof_items.includes("Resend/Gmail outbound email has not been live-proven for this order."),
    true
  );
});

test("runOrderProviderProof creates a live webhook proof event and keeps the path order-scoped", async () => {
  const { base44, entities } = createFakeBase44();

  const result = await runOrderProviderProof({
    base44,
    orderId: "order_1",
    proofType: "lead_ingestion_webhook",
    requestUrl: "https://apexflow.base44.app/functions/v1/runOrderProviderProof",
    now: "2026-04-29T12:40:00.000Z",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://apexflow.base44.app/functions/v1/webhookLeadCapture");
      assert.equal(options.headers["x-clientsurge-api-key"], "cli_lead_live_1");
      return new Response(
        JSON.stringify({
          success: true,
          lead_id: "lead_1",
          created: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    },
  });

  assert.equal(result.proof_type, "lead_ingestion_webhook");
  assert.equal(result.mode, "LIVE_PROVIDER_PROOF");
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.subject === "Lead ingestion webhook proof succeeded" && event.order_id === "order_1"
    )
  );
});

test("runOrderProviderProof blocks live SMS proof when canonical runtime config is missing", async () => {
  const { base44 } = createFakeBase44({
    orders: [
      buildRuntimeReadyOrder({
        install_configuration: {
          shared: {
            twilio_business_phone: "",
            business_hours: "",
            after_hours_behavior: "",
            consent_behavior: "",
            opt_out_message: "",
          },
          services: {
            instant_lead_response: {
              sms_template: "",
            },
          },
        },
      }),
    ],
  });

  await assert.rejects(
    () =>
      runOrderProviderProof({
        base44,
        orderId: "order_1",
        proofType: "live_sms_instant_lead_response",
        requestUrl: "https://apexflow.base44.app/functions/v1/runOrderProviderProof",
        now: "2026-04-29T12:45:00.000Z",
        sendSms: async () => {
          throw new Error("should not send");
        },
      }),
    (error) => {
      assert.equal(error instanceof RuntimeExecutionError || error instanceof ProviderProofError, true);
      return true;
    }
  );
});

test("runOrderProviderProof creates order-scoped live email proof events", async () => {
  const { base44, entities } = createFakeBase44();

  const result = await runOrderProviderProof({
    base44,
    orderId: "order_1",
    proofType: "live_email",
    requestUrl: "https://apexflow.base44.app/functions/v1/runOrderProviderProof",
    now: "2026-04-29T13:00:00.000Z",
    sendEmail: async () => ({
      provider_message_id: "email_proof_live_1",
      provider_status: "sent",
    }),
  });

  assert.equal(result.proof_type, "live_email");
  assert.equal(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.event_type === "provider_send_succeeded" &&
        event.provider_message_id === "email_proof_live_1" &&
        event.order_id === "order_1"
    ),
    true
  );
});

test("deriveIntegrationHealth does not call providers healthy without recent live proof", () => {
  const snapshot = deriveIntegrationHealth({
    settings: {
      twilio_enabled: true,
      twilio_from_number: "+16025550999",
      resend_enabled: true,
      resend_from_email: "hello@clientsurge.test",
      webhook_enabled: true,
      webhook_url: "https://hooks.example.test",
      gmail_enabled: false,
      gmail_from_email: "",
    },
    events: [
      {
        id: "provider_test_1",
        created_date: "2026-04-29T11:00:00.000Z",
        provider: "twilio",
        status: "processed",
        event_type: "status_update",
        metadata_json: JSON.stringify({
          context_type: "provider_test",
          integration_id: "twilio",
        }),
      },
    ],
  });

  const twilio = snapshot.integrations.find((integration) => integration.id === "twilio");
  assert.equal(twilio.derived_status, "test_wired");
  assert.equal(twilio.status_label, "Test Wired");
});
