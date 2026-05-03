import test from "node:test";
import assert from "node:assert/strict";

import {
  InstallTransitionError,
  initializePaidOrderInstallPipeline,
  updateOrderInstallConfiguration,
  updateTrackedServiceInstallStatus,
} from "../base44/functions/_shared/installPipeline.js";
import {
  executeLeadReactivationTest,
  executeOrderServiceRuntime,
} from "../base44/functions/_shared/installRuntime.js";
import { ingestCustomerLead } from "../base44/functions/_shared/customerLeadIngestion.js";
import { runOrderProviderProof } from "../base44/functions/_shared/providerProof.js";
import { handleTrustedTwilioStatusWebhook } from "../base44/functions/_shared/webhookHandlers.js";

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

function buildTrackedItem(productId, productName) {
  return {
    product_id: productId,
    product_name: productName,
    status: "pending",
  };
}

function buildOrder({ id, businessName, items, installConfiguration = {}, leadCredentials = true }) {
  return {
    id,
    created_date: "2026-04-29T10:00:00.000Z",
    customer_email: `${id}@example.com`,
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: businessName,
    items,
    total_setup: 494,
    total_monthly: 164,
    payment_status: "pending",
    order_status: "pending_payment",
    lead_ingestion_api_key: leadCredentials ? `api_${id}` : "",
    lead_ingestion_webhook_secret: leadCredentials ? `whsec_${id}` : "",
    install_configuration: installConfiguration,
  };
}

function createFakeBase44({ orders, leads = [], legacyLeadReactivation = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
    Leads: new InMemoryCollection(leads),
    LeadReactivation: new InMemoryCollection(legacyLeadReactivation),
    WebsiteLead: new InMemoryCollection(),
    CommunicationEvent: new InMemoryCollection(),
    AdminSettings: new InMemoryCollection([
      {
        id: "settings_1",
        twilio_enabled: true,
        twilio_from_number: "+16025550999",
        resend_enabled: true,
        resend_from_email: "ops@example.com",
      },
    ]),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      integrations: {
        Core: {
          SendEmail: async () => ({
            id: "email_1",
            status: "sent",
          }),
        },
      },
    },
  };
}

async function initializeTestingOrder({ base44, entities, orderId, patch, serviceKey }) {
  const startingOrder = await entities.Order.get(orderId);

  await initializePaidOrderInstallPipeline({
    base44,
    order: startingOrder,
    stripeCustomerId: `cus_${orderId}`,
    now: "2026-04-29T10:05:00.000Z",
  });

  let currentOrder = await entities.Order.get(orderId);
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch,
    now: "2026-04-29T10:08:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey,
    nextStatus: "Configuring",
    now: "2026-04-29T10:10:00.000Z",
  });
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey,
    nextStatus: "Testing",
    now: "2026-04-29T10:12:00.000Z",
  });

  return currentOrder;
}

function buildSmsConfig(serviceKey, smsTemplate) {
  return {
    shared: {
      twilio_business_phone: "+16025550999",
      business_hours: "Mon-Fri 8am-5pm",
      after_hours_behavior: "send_after_hours_sms",
      consent_behavior: "include_opt_out_language",
      opt_out_message: "Reply STOP to opt out.",
    },
    services: {
      [serviceKey]: {
        sms_template: smsTemplate,
      },
    },
  };
}

function getEventsByService(entities, serviceKey) {
  return entities.CommunicationEvent.records.filter((event) => event.service_key === serviceKey);
}

test("instant lead response validation requires explicit live proof and keeps paid-customer ingestion canonical", async () => {
  const orderId = "order_instant";
  const { base44, entities } = createFakeBase44({
    orders: [
      buildOrder({
        id: orderId,
        businessName: "Signal Med Spa",
        items: [buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response")],
      }),
    ],
  });

  let currentOrder = await initializeTestingOrder({
    base44,
    entities,
    orderId,
    serviceKey: "instant_lead_response",
    patch: buildSmsConfig(
      "instant_lead_response",
      "Hi {{lead_name}}, thanks for reaching out to {{business_name}}."
    ),
  });

  await executeOrderServiceRuntime({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    runtimeType: "test_lead",
    recipientPhone: "+16025550011",
    runtimeData: {
      lead_name: "Avery Prospect",
      lead_phone: "+16025550011",
    },
    sendSms: async () => ({
      provider_message_id: "SM_runtime_instant",
      provider_status: "queued",
    }),
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "instant_lead_response",
      nextStatus: "Live",
      now: "2026-04-29T10:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("provider_verification.verified"));
      return true;
    }
  );

  await runOrderProviderProof({
    base44,
    orderId,
    proofType: "live_sms_instant_lead_response",
    requestUrl: "https://apexflow.base44.app/functions/v1/runOrderProviderProof",
    now: "2026-04-29T10:15:00.000Z",
    sendSms: async () => ({
      provider_message_id: "SM_live_proof_instant",
      provider_status: "sent",
    }),
  });

  currentOrder = await entities.Order.get(orderId);
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    nextStatus: "Live",
    now: "2026-04-29T10:16:00.000Z",
  });

  const ingestionResult = await ingestCustomerLead({
    base44,
    payload: {
      api_key: `api_${orderId}`,
      full_name: "Taylor Lead",
      business_name: "Signal Med Spa",
      email: "taylor@example.com",
      phone: "602-555-0001",
      source: "external_crm",
      intake_type: "client_web_form",
      idempotency_key: "evt_instant_1",
    },
    now: "2026-04-29T10:20:00.000Z",
    dependencies: {
      executeInstantResponse: async (args) =>
        executeOrderServiceRuntime({
          ...args,
          sendSms: async () => ({
            provider_message_id: "SM_ingested_lead",
            provider_status: "sent",
          }),
        }),
    },
  });

  assert.equal(ingestionResult.success, true);
  assert.equal(entities.Leads.records.length, 1);
  assert.equal(entities.WebsiteLead.records.length, 0);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "lead_created" && event.order_id === orderId
    )
  );
  assert.ok(
    getEventsByService(entities, "instant_lead_response").some(
      (event) => event.event_type === "provider_send_attempted"
    )
  );
  assert.ok(
    getEventsByService(entities, "instant_lead_response").some(
      (event) => event.event_type === "provider_send_succeeded"
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.subject === "Twilio live SMS proof succeeded" && event.order_id === orderId
    )
  );
});

test("missed call text-back validation requires canonical webhook proof and suppresses duplicate callback replays", async () => {
  const orderId = "order_missed";
  const { base44, entities } = createFakeBase44({
    orders: [
      buildOrder({
        id: orderId,
        businessName: "Signal Med Spa",
        items: [buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back")],
      }),
    ],
  });

  let currentOrder = await initializeTestingOrder({
    base44,
    entities,
    orderId,
    serviceKey: "missed_call_text_back",
    patch: buildSmsConfig(
      "missed_call_text_back",
      "Sorry we missed your call, {{caller_name}}. Text us here and we will help shortly."
    ),
  });

  await executeOrderServiceRuntime({
    base44,
    order: currentOrder,
    serviceKey: "missed_call_text_back",
    runtimeType: "simulate_missed_call",
    recipientPhone: "+16025550022",
    runtimeData: {
      caller_name: "Jordan Caller",
      caller_phone: "+16025550022",
      call_status: "no-answer",
    },
    sendSms: async () => ({
      provider_message_id: "SM_missed_test",
      provider_status: "queued",
    }),
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "missed_call_text_back",
      nextStatus: "Live",
      now: "2026-04-29T10:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("provider_verification.verified"));
      return true;
    }
  );

  const previousDeno = globalThis.Deno;
  const previousFetch = globalThis.fetch;
  globalThis.Deno = {
    env: {
      get(name) {
        if (name === "TWILIO_ACCOUNT_SID") {
          return "AC_test";
        }
        if (name === "TWILIO_AUTH_TOKEN") {
          return "twilio_runtime_token";
        }
        return undefined;
      },
    },
  };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        sid: "SM_missed_live",
        status: "queued",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  const webhookPayload = new FormData();
  webhookPayload.set("CallSid", "CA1234567890abcdef1234567890abcd");
  webhookPayload.set("CallStatus", "no-answer");
  webhookPayload.set("To", "+16025550999");
  webhookPayload.set("From", "+16025550022");
  webhookPayload.set("CallerName", "Jordan Caller");

  let firstResult;
  let secondResult;
  try {
    firstResult = await handleTrustedTwilioStatusWebhook({
      base44,
      formData: webhookPayload,
    });

    const attemptedCount = getEventsByService(entities, "missed_call_text_back").filter(
      (event) => event.event_type === "provider_send_attempted"
    ).length;

    secondResult = await handleTrustedTwilioStatusWebhook({
      base44,
      formData: webhookPayload,
    });

    assert.equal(
      getEventsByService(entities, "missed_call_text_back").filter(
        (event) => event.event_type === "provider_send_attempted"
      ).length,
      attemptedCount
    );
  } finally {
    globalThis.Deno = previousDeno;
    globalThis.fetch = previousFetch;
  }

  assert.equal(firstResult.success, true);
  assert.equal(secondResult.duplicate_suppressed, true);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.subject === "Twilio missed-call webhook received" &&
        event.order_id === orderId
    )
  );
  assert.ok(
    getEventsByService(entities, "missed_call_text_back").some(
      (event) => event.event_type === "provider_send_succeeded"
    )
  );

  currentOrder = await entities.Order.get(orderId);
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "missed_call_text_back",
    nextStatus: "Live",
    now: "2026-04-29T10:18:00.000Z",
  });

  assert.equal(
    currentOrder.items.find((item) => item.service_key === "missed_call_text_back").install_status,
    "Live"
  );
});

test("old lead reactivation validation stays on canonical Leads and ignores legacy LeadReactivation", async () => {
  const orderId = "order_reactivation";
  const { base44, entities } = createFakeBase44({
    orders: [
      buildOrder({
        id: orderId,
        businessName: "Signal Med Spa",
        items: [buildTrackedItem("prod_UNi5PWv05ECzXI", "Old Lead Reactivation")],
        leadCredentials: false,
      }),
    ],
    leads: [
      {
        id: "lead_1",
        full_name: "Alex Dormant",
        email: "alex@example.com",
        phone: "+16025550111",
        business_name: "Signal Med Spa",
        status: "Qualified",
        created_date: "2026-02-01T12:00:00.000Z",
        last_contacted_at: "2026-02-10T12:00:00.000Z",
      },
      {
        id: "lead_2",
        full_name: "Blair Dormant",
        email: "blair@example.com",
        phone: "+16025550112",
        business_name: "Signal Med Spa",
        status: "Contacted",
        created_date: "2026-01-15T12:00:00.000Z",
        last_contacted_at: "2026-02-05T12:00:00.000Z",
      },
    ],
    legacyLeadReactivation: [
      {
        id: "legacy_1",
        lead_id: "legacy_lead_1",
        status: "queued",
      },
    ],
  });

  let currentOrder = await initializeTestingOrder({
    base44,
    entities,
    orderId,
    serviceKey: "lead_reactivation",
    patch: {
      shared: {},
      services: {
        lead_reactivation: {
          target_segment: "all_dormant",
          message_template:
            "Hi {{first_name}}, this is {{business_name}} checking in. Reply if you want to reconnect.",
          max_batch_size: 25,
        },
      },
    },
  });

  await assert.rejects(
    updateTrackedServiceInstallStatus({
      base44,
      order: currentOrder,
      serviceKey: "lead_reactivation",
      nextStatus: "Live",
      now: "2026-04-29T10:14:00.000Z",
    }),
    (error) => {
      assert.ok(error instanceof InstallTransitionError);
      assert.ok(error.details?.validation?.missing_fields?.includes("service_test.successful_runtime"));
      return true;
    }
  );

  const result = await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 3,
    now: "2026-04-29T10:16:00.000Z",
  });

  currentOrder = await entities.Order.get(orderId);
  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "lead_reactivation",
    nextStatus: "Live",
    now: "2026-04-29T10:18:00.000Z",
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.selected_lead_ids, ["lead_1", "lead_2"]);
  assert.equal(entities.LeadReactivation.records.length, 1);
  assert.equal(entities.WebsiteLead.records.length, 0);
  assert.ok(
    getEventsByService(entities, "lead_reactivation").some(
      (event) => event.event_type === "runtime_attempt_started"
    )
  );
  assert.ok(
    getEventsByService(entities, "lead_reactivation").some(
      (event) => event.event_type === "provider_send_attempted"
    )
  );
  assert.ok(
    getEventsByService(entities, "lead_reactivation").some(
      (event) => event.event_type === "provider_send_succeeded"
    )
  );
  assert.ok(
    getEventsByService(entities, "lead_reactivation").some(
      (event) => event.event_type === "lead_reactivation_batch_completed"
    )
  );
});
