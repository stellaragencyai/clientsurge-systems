import test from "node:test";
import assert from "node:assert/strict";

import {
  initializePaidOrderInstallPipeline,
  updateOrderInstallConfiguration,
  updateTrackedServiceInstallStatus,
} from "../base44/functions/_shared/installPipeline.js";
import {
  executeOrderServiceRuntime,
  executeBookingSimulation,
  executeLeadReactivationTest,
  executeNurtureSequenceTest,
  executeReviewRequestTest,
  RuntimeExecutionError,
} from "../base44/functions/_shared/installRuntime.js";

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

function getEventMetadata(event) {
  return event.metadata_json ? JSON.parse(event.metadata_json) : {};
}

function buildTrackedItem(productId, productName) {
  return {
    product_id: productId,
    product_name: productName,
    status: "pending",
  };
}

function buildCompleteConfigPatch({
  consentBehavior = "include_opt_out_language",
  instantTemplate = "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
  missedTemplate = "Sorry we missed your call, {{caller_name}}. Text us here and we will help shortly.",
} = {}) {
  return {
    shared: {
      twilio_business_phone: "+16025550999",
      business_hours: "Mon-Fri 8am-5pm",
      after_hours_behavior: "send_after_hours_sms",
      consent_behavior: consentBehavior,
      opt_out_message: "Reply STOP to opt out.",
    },
    services: {
      instant_lead_response: {
        sms_template: instantTemplate,
      },
      missed_call_text_back: {
        sms_template: missedTemplate,
      },
      nurture_sequence_14d: {
        sms_enabled: true,
        email_enabled: true,
        steps: [
          {
            day: 1,
            channel: "sms",
            message_template: "Day 1 SMS for {{business_name}}.",
          },
          {
            day: 3,
            channel: "email",
            message_template: "Day 3 email for {{business_name}}.",
          },
          {
            day: 7,
            channel: "sms",
            message_template: "Day 7 SMS for {{business_name}}.",
          },
        ],
      },
      ai_booking_agent: {
        booking_link: "https://calendar.example.com/signal-med-spa",
        booking_mode: "external_link",
        business_hours: "Mon-Fri 8am-5pm",
        confirmation_template: "Thanks {{first_name}}. Book here: {{booking_link}}",
        reminder_enabled: true,
        reminder_template: "Reminder: {{scheduled_at}} is reserved here {{booking_link}}",
        intake_fields: ["lead_name", "lead_email", "lead_phone"],
      },
      lead_reactivation: {
        target_segment: "all_dormant",
        message_template:
          "Hi {{first_name}}, this is {{business_name}} checking in. Reply if you want to reconnect.",
        max_batch_size: 25,
      },
      review_request: {
        review_link: "https://reviews.example.com/signal-med-spa",
        trigger_event: "manual_trigger",
        message_template:
          "Hi {{first_name}}, thanks for visiting {{business_name}}. Leave a quick review here: {{review_link}}",
        channel: "email",
        send_delay_minutes: 15,
        fallback_internal_feedback_enabled: true,
      },
    },
  };
}

function createFakeBase44(orderOverrides = {}) {
  const orderCollection = new InMemoryCollection([
    {
      id: "order_1",
      created_date: "2026-04-22T12:00:00.000Z",
      customer_email: "owner@example.com",
      customer_name: "Jamie Owner",
      customer_phone: "+16025550123",
      business_name: "Signal Med Spa",
      items: [
        buildTrackedItem("prod_UNi5RHiKNSTfQl", "Instant Lead Response"),
        buildTrackedItem("prod_UNi5QL0bQl98If", "Missed Call Text-Back"),
        buildTrackedItem("prod_UNi5N0l5MtaV0R", "14-Day Nurture Sequence"),
        buildTrackedItem("prod_UNi5fLL2SyJJdP", "AI Booking Agent"),
        buildTrackedItem("prod_UNi5PWv05ECzXI", "Old Lead Reactivation"),
        buildTrackedItem("prod_UNi5dvOUm6Fi9i", "Review Request Automation"),
      ],
      total_setup: 494,
      total_monthly: 164,
      payment_status: "pending",
      order_status: "pending_payment",
      ...orderOverrides,
    },
  ]);

  const entities = {
    Order: orderCollection,
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
    Leads: new InMemoryCollection([
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
        full_name: "Blair Contacted",
        email: "blair@example.com",
        phone: "+16025550112",
        business_name: "Signal Med Spa",
        status: "Contacted",
        created_date: "2026-01-15T12:00:00.000Z",
        last_contacted_at: "2026-02-05T12:00:00.000Z",
      },
      {
        id: "lead_3",
        full_name: "Casey Fresh",
        email: "casey@example.com",
        phone: "+16025550113",
        business_name: "Signal Med Spa",
        status: "New",
        created_date: "2026-04-20T12:00:00.000Z",
        last_contacted_at: "2026-04-20T12:00:00.000Z",
      },
      {
        id: "lead_4",
        full_name: "Other Business Lead",
        email: "other@example.com",
        phone: "+16025550114",
        business_name: "Other Spa",
        status: "Qualified",
        created_date: "2026-01-15T12:00:00.000Z",
        last_contacted_at: "2026-02-01T12:00:00.000Z",
      },
    ]),
    CommunicationEvent: new InMemoryCollection(),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      auth: {
        async me() {
          return { id: "admin_1", role: "admin" };
        },
      },
    },
  };
}

async function initializeRuntimeReadyOrder(base44, entities) {
  const startingOrder = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order: startingOrder,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: buildCompleteConfigPatch(),
    now: "2026-04-22T12:08:00.000Z",
  });

  return currentOrder;
}

async function moveServiceToTesting(base44, order, serviceKey) {
  let currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order,
    serviceKey,
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey,
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  return currentOrder;
}

test("test lead runtime uses canonical order config and instant template", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "instant_lead_response");

  const sentMessages = [];
  const result = await executeOrderServiceRuntime({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    runtimeType: "test_lead",
    recipientPhone: "+16025550011",
    runtimeData: {
      lead_name: "Avery Prospect",
      lead_phone: "+16025550011",
    },
    sendSms: async (payload) => {
      sentMessages.push(payload);
      return {
        provider_message_id: "SM_test_lead",
        provider_status: "queued",
      };
    },
  });

  assert.equal(result.from_phone, "+16025550999");
  assert.equal(sentMessages[0].from, "+16025550999");
  assert.equal(sentMessages[0].to, "+16025550011");
  assert.match(sentMessages[0].body, /Avery Prospect/);
  assert.match(sentMessages[0].body, /Signal Med Spa/);
  assert.match(sentMessages[0].body, /Reply STOP to opt out\./);
});

test("missed-call simulation uses canonical order config and missed-call template", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "missed_call_text_back");

  const sentMessages = [];
  const result = await executeOrderServiceRuntime({
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
    sendSms: async (payload) => {
      sentMessages.push(payload);
      return {
        provider_message_id: "SM_missed_call",
        provider_status: "queued",
      };
    },
  });

  assert.equal(result.service_key, "missed_call_text_back");
  assert.equal(sentMessages[0].from, "+16025550999");
  assert.equal(sentMessages[0].to, "+16025550022");
  assert.match(sentMessages[0].body, /Jordan Caller/);
  assert.match(sentMessages[0].body, /Sorry we missed your call/);
  assert.doesNotMatch(sentMessages[0].body, /thanks for reaching out/i);
});

test("runtime blocks when service state is not ready for testing or live execution", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: buildCompleteConfigPatch(),
    now: "2026-04-22T12:08:00.000Z",
  });

  await assert.rejects(
    executeOrderServiceRuntime({
      base44,
      order: currentOrder,
      serviceKey: "instant_lead_response",
      runtimeType: "test_lead",
      recipientPhone: "+16025550033",
      runtimeData: {
        lead_name: "Blocked Prospect",
      },
      sendSms: async () => {
        throw new Error("should not send");
      },
    }),
    RuntimeExecutionError
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  assert.equal(blockedEvent.service_key, "instant_lead_response");
  assert.equal(getEventMetadata(blockedEvent).code, "runtime_not_ready");
  assert.equal(
    entities.CommunicationEvent.records.some((event) => event.event_type === "provider_send_attempted"),
    false
  );
});

test("runtime blocks when canonical config is incomplete even if service status is testing", async () => {
  const { base44, entities } = createFakeBase44({
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5RHiKNSTfQl",
        product_name: "Instant Lead Response",
        tracking_enabled: true,
        service_key: "instant_lead_response",
        install_status: "Testing",
        status: "setting_up",
      },
      {
        product_id: "prod_UNi5QL0bQl98If",
        product_name: "Missed Call Text-Back",
        tracking_enabled: true,
        service_key: "missed_call_text_back",
        install_status: "Ready for Install",
        status: "pending",
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "+16025550999",
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
  });

  const order = await entities.Order.get("order_1");

  await assert.rejects(
    executeOrderServiceRuntime({
      base44,
      order,
      serviceKey: "instant_lead_response",
      runtimeType: "test_lead",
      recipientPhone: "+16025550044",
      runtimeData: {
        lead_name: "Config Blocked Prospect",
      },
      sendSms: async () => {
        throw new Error("should not send");
      },
    }),
    RuntimeExecutionError
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.ok(metadata.validation.missing_fields.includes("shared.business_hours"));
  assert.ok(metadata.validation.missing_fields.includes("services.instant_lead_response.sms_template"));
});

test("successful runtime attempts create the expected CommunicationEvent trail", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "instant_lead_response");

  await executeOrderServiceRuntime({
    base44,
    order: currentOrder,
    serviceKey: "instant_lead_response",
    runtimeType: "test_lead",
    recipientPhone: "+16025550055",
    runtimeData: {
      lead_name: "Trail Prospect",
      lead_phone: "+16025550055",
    },
    sendSms: async () => ({
      provider_message_id: "SM_event_trail",
      provider_status: "queued",
    }),
  });

  const eventTypes = entities.CommunicationEvent.records.map((event) => event.event_type);
  assert.ok(eventTypes.includes("runtime_attempt_started"));
  assert.ok(eventTypes.includes("provider_send_attempted"));
  assert.ok(eventTypes.includes("provider_send_succeeded"));

  const successEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "provider_send_succeeded"
  );
  assert.ok(successEvent);
  assert.equal(successEvent.order_id, "order_1");
  assert.equal(successEvent.service_key, "instant_lead_response");
  assert.equal(successEvent.provider_message_id, "SM_event_trail");

  const metadata = getEventMetadata(successEvent);
  assert.equal(metadata.runtime_type, "test_lead");
  assert.equal(metadata.recipient_phone, "+16025550055");
  assert.equal(metadata.twilio_business_phone, "+16025550999");
});

test("nurture sequence test uses canonical first step config and logs success", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "nurture_sequence_14d");

  const sentMessages = [];
  const result = await executeNurtureSequenceTest({
    base44,
    order: currentOrder,
    recipientPhone: "+16025550066",
    recipientEmail: "test@example.com",
    sendSms: async (payload) => {
      sentMessages.push(payload);
      return {
        provider_message_id: "SM_nurture_step_1",
        provider_status: "queued",
      };
    },
  });

  assert.equal(result.channel, "sms");
  assert.equal(result.step_index, 0);
  assert.equal(sentMessages[0].to, "+16025550066");
  assert.match(sentMessages[0].body, /Day 1 SMS/);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "provider_send_succeeded" && event.service_key === "nurture_sequence_14d"
    )
  );
});

test("nurture sequence test blocks when sequence configuration is incomplete", async () => {
  const { base44, entities } = createFakeBase44();
  const order = await entities.Order.get("order_1");

  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  let currentOrder = await entities.Order.get("order_1");
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: {
      shared: {
        twilio_business_phone: "+16025550999",
        business_hours: "Mon-Fri 8am-5pm",
        after_hours_behavior: "send_after_hours_sms",
        consent_behavior: "include_opt_out_language",
        opt_out_message: "Reply STOP to opt out.",
      },
      services: {
        nurture_sequence_14d: {
          sms_enabled: true,
          email_enabled: false,
          steps: [
            { day: 1, channel: "sms", message_template: "" },
          ],
        },
      },
    },
    now: "2026-04-22T12:08:00.000Z",
  });

  currentOrder = await updateTrackedServiceInstallStatus({
    base44,
    order: currentOrder,
    serviceKey: "nurture_sequence_14d",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });

  await assert.rejects(
    executeNurtureSequenceTest({
      base44,
      order: currentOrder,
      recipientPhone: "+16025550066",
      recipientEmail: "test@example.com",
    }),
    RuntimeExecutionError
  );
});

test("nurture sequence email test logs a canonical blocked event when recipient email is missing", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: currentOrder,
    patch: {
      services: {
        nurture_sequence_14d: {
          sms_enabled: false,
          email_enabled: true,
          steps: [
            {
              day: 1,
              channel: "email",
              message_template: "Day 1 email for {{business_name}}.",
            },
            {
              day: 3,
              channel: "email",
              message_template: "Day 3 email for {{business_name}}.",
            },
            {
              day: 7,
              channel: "email",
              message_template: "Day 7 email for {{business_name}}.",
            },
          ],
        },
      },
    },
    now: "2026-04-22T12:09:00.000Z",
  });
  currentOrder = await moveServiceToTesting(base44, currentOrder, "nurture_sequence_14d");

  await assert.rejects(
    executeNurtureSequenceTest({
      base44,
      order: currentOrder,
      recipientPhone: "+16025550066",
      recipientEmail: "",
    }),
    (error) => {
      assert.ok(error instanceof RuntimeExecutionError);
      assert.equal(error.code, "missing_recipient_email");
      assert.ok(error.details?.blocked_event_id);
      return true;
    }
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) =>
      event.service_key === "nurture_sequence_14d" &&
      event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.ok(metadata.validation.missing_fields.includes("runtime.recipient_email"));
});

test("booking simulation logs booking creation and confirmation using canonical config", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "ai_booking_agent");

  const result = await executeBookingSimulation({
    base44,
    order: currentOrder,
    leadName: "Morgan Booker",
    leadEmail: "morgan@example.com",
    leadPhone: "+16025550077",
    scheduledAt: "2026-04-23T17:00:00.000Z",
  });

  assert.equal(result.service_key, "ai_booking_agent");
  assert.equal(result.booking_simulation_created, true);
  assert.equal(result.booking_mode, "external_link");
  assert.equal(result.booking_link, "https://calendar.example.com/signal-med-spa");
  assert.match(result.confirmation_message, /calendar\.example\.com/);
  assert.match(result.reminder_message, /Reminder:/);
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "booking_simulation_created" && event.service_key === "ai_booking_agent"
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "provider_send_succeeded" && event.service_key === "ai_booking_agent"
    )
  );
});

test("booking simulation blocks when booking config is incomplete", async () => {
  const { base44, entities } = createFakeBase44({
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5fLL2SyJJdP",
        product_name: "AI Booking Agent",
        tracking_enabled: true,
        service_key: "ai_booking_agent",
        install_status: "Testing",
        status: "setting_up",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        ai_booking_agent: {
          booking_link: "",
          booking_mode: "",
          business_hours: "",
          confirmation_template: "",
          reminder_enabled: false,
          reminder_template: "",
          intake_fields: [],
        },
      },
    },
  });

  const order = await entities.Order.get("order_1");

  await assert.rejects(
    executeBookingSimulation({
      base44,
      order,
      leadName: "Blocked Booker",
      leadEmail: "blocked@example.com",
    }),
    RuntimeExecutionError
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.ok(metadata.validation.missing_fields.includes("services.ai_booking_agent.booking_link"));
  assert.ok(metadata.validation.missing_fields.includes("services.ai_booking_agent.booking_mode"));
  assert.ok(metadata.validation.missing_fields.includes("services.ai_booking_agent.confirmation_template"));
  assert.ok(metadata.validation.missing_fields.includes("services.ai_booking_agent.intake_fields"));
});

test("lead reactivation test uses canonical Leads and logs per-lead plus summary events", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "lead_reactivation");

  const result = await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 3,
    now: "2026-04-22T12:18:00.000Z",
  });

  assert.equal(result.service_key, "lead_reactivation");
  assert.equal(result.success, true);
  assert.equal(result.target_segment, "all_dormant");
  assert.equal(result.target_size, 2);
  assert.deepEqual(result.selected_lead_ids, ["lead_1", "lead_2"]);

  const perLeadSuccessEvents = entities.CommunicationEvent.records.filter(
    (event) =>
      event.service_key === "lead_reactivation" &&
      event.event_type === "provider_send_succeeded"
  );
  assert.equal(perLeadSuccessEvents.length, 2);
  assert.deepEqual(
    perLeadSuccessEvents.map((event) => event.lead_id).sort(),
    ["lead_1", "lead_2"]
  );

  const summaryEvent = entities.CommunicationEvent.records.find(
    (event) =>
      event.service_key === "lead_reactivation" &&
      event.event_type === "lead_reactivation_batch_completed"
  );
  assert.ok(summaryEvent);
  const metadata = getEventMetadata(summaryEvent);
  assert.equal(metadata.target_segment, "all_dormant");
  assert.equal(metadata.selected_lead_count, 2);
});

test("lead reactivation campaign logic excludes fresh, booked, closed, and unrelated leads", async () => {
  const { base44, entities } = createFakeBase44();
  entities.Leads.records.push(
    {
      id: "lead_booked",
      full_name: "Booked Dormant",
      email: "booked@example.com",
      phone: "+16025550115",
      business_name: "Signal Med Spa",
      status: "Booked",
      booked_at: "2026-02-20T12:00:00.000Z",
      created_date: "2026-01-15T12:00:00.000Z",
      last_contacted_at: "2026-02-01T12:00:00.000Z",
    },
    {
      id: "lead_closed",
      full_name: "Closed Dormant",
      email: "closed@example.com",
      phone: "+16025550116",
      business_name: "Signal Med Spa",
      status: "Closed",
      created_date: "2026-01-15T12:00:00.000Z",
      last_contacted_at: "2026-02-01T12:00:00.000Z",
    }
  );

  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "lead_reactivation");

  const dormantResult = await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 10,
    now: "2026-04-22T12:18:00.000Z",
  });

  assert.deepEqual(dormantResult.selected_lead_ids.sort(), ["lead_1", "lead_2"]);
  const reactivationSuccessEvents = entities.CommunicationEvent.records.filter(
    (event) =>
      event.service_key === "lead_reactivation" &&
      event.event_type === "provider_send_succeeded"
  );
  assert.equal(reactivationSuccessEvents.length, 2);
  assert.ok(
    reactivationSuccessEvents.every(
      (event) => event.channel === "internal" && event.provider === "internal"
    )
  );

  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: await entities.Order.get("order_1"),
    patch: {
      services: {
        lead_reactivation: {
          target_segment: "contacted_no_reply",
        },
      },
    },
    now: "2026-04-22T12:19:00.000Z",
  });

  const contactedResult = await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 10,
    now: "2026-04-22T12:20:00.000Z",
  });

  assert.deepEqual(contactedResult.selected_lead_ids, ["lead_2"]);

  currentOrder = await updateOrderInstallConfiguration({
    base44,
    order: await entities.Order.get("order_1"),
    patch: {
      services: {
        lead_reactivation: {
          target_segment: "qualified_unbooked",
        },
      },
    },
    now: "2026-04-22T12:21:00.000Z",
  });

  const qualifiedResult = await executeLeadReactivationTest({
    base44,
    order: currentOrder,
    maxTestLeads: 10,
    now: "2026-04-22T12:22:00.000Z",
  });

  assert.deepEqual(qualifiedResult.selected_lead_ids, ["lead_1"]);
});

test("lead reactivation test blocks when canonical config is incomplete", async () => {
  const { base44, entities } = createFakeBase44({
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5PWv05ECzXI",
        product_name: "Old Lead Reactivation",
        tracking_enabled: true,
        service_key: "lead_reactivation",
        install_status: "Testing",
        status: "setting_up",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        lead_reactivation: {
          target_segment: "",
          message_template: "",
          max_batch_size: 25,
        },
      },
    },
  });

  const order = await entities.Order.get("order_1");

  await assert.rejects(
    executeLeadReactivationTest({
      base44,
      order,
      maxTestLeads: 3,
      now: "2026-04-22T12:18:00.000Z",
    }),
    RuntimeExecutionError
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.ok(metadata.validation.missing_fields.includes("services.lead_reactivation.target_segment"));
  assert.ok(metadata.validation.missing_fields.includes("services.lead_reactivation.message_template"));
});

test("review request test simulates configured trigger and logs canonical CommunicationEvent trail", async () => {
  const { base44, entities } = createFakeBase44();
  let currentOrder = await initializeRuntimeReadyOrder(base44, entities);
  currentOrder = await moveServiceToTesting(base44, currentOrder, "review_request");

  const result = await executeReviewRequestTest({
    base44,
    order: currentOrder,
    recipientEmail: "reviewer@example.com",
    customerName: "Taylor Customer",
    triggerEvent: "manual_trigger",
    now: "2026-04-22T12:19:00.000Z",
  });

  assert.equal(result.service_key, "review_request");
  assert.equal(result.success, true);
  assert.equal(result.channel, "email");
  assert.equal(result.trigger_event, "manual_trigger");
  assert.equal(result.fallback_internal_feedback_enabled, true);
  assert.match(result.message_preview, /reviews\.example\.com/);

  const eventTypes = entities.CommunicationEvent.records
    .filter((event) => event.service_key === "review_request")
    .map((event) => event.event_type);
  assert.ok(eventTypes.includes("runtime_attempt_started"));
  assert.ok(eventTypes.includes("review_request_trigger_simulated"));
  assert.ok(eventTypes.includes("provider_send_attempted"));
  assert.ok(eventTypes.includes("provider_send_succeeded"));
});

test("review request test blocks when canonical config is incomplete", async () => {
  const { base44, entities } = createFakeBase44({
    payment_status: "paid",
    install_initialized_at: "2026-04-22T12:05:00.000Z",
    items: [
      {
        product_id: "prod_UNi5dvOUm6Fi9i",
        product_name: "Review Request Automation",
        tracking_enabled: true,
        service_key: "review_request",
        install_status: "Testing",
        status: "setting_up",
      },
    ],
    install_configuration: {
      shared: {},
      services: {
        review_request: {
          review_link: "",
          trigger_event: "",
          message_template: "",
          channel: "",
          send_delay_minutes: null,
          fallback_internal_feedback_enabled: false,
        },
      },
    },
  });

  const order = await entities.Order.get("order_1");

  await assert.rejects(
    executeReviewRequestTest({
      base44,
      order,
      recipientEmail: "reviewer@example.com",
      customerName: "Blocked Customer",
      now: "2026-04-22T12:19:00.000Z",
    }),
    RuntimeExecutionError
  );

  const blockedEvent = entities.CommunicationEvent.records.find(
    (event) => event.event_type === "runtime_attempt_blocked"
  );
  assert.ok(blockedEvent);
  const metadata = getEventMetadata(blockedEvent);
  assert.ok(metadata.validation.missing_fields.includes("services.review_request.review_link"));
  assert.ok(metadata.validation.missing_fields.includes("services.review_request.trigger_event"));
  assert.ok(metadata.validation.missing_fields.includes("services.review_request.message_template"));
  assert.ok(metadata.validation.missing_fields.includes("services.review_request.channel"));
});
