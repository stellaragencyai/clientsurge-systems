import test from "node:test";
import assert from "node:assert/strict";

import {
  executeLeadReactivationBatch,
  executeManualReviewRequest,
  executeProductionInstantLeadResponse,
  processDueNurtureSequenceSteps,
} from "../base44/functions/_shared/canonicalAutomationRuntime.js";
import { RuntimeExecutionError } from "../base44/functions/_shared/installRuntime.js";

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

const PRODUCT_IDS = {
  instant_lead_response: "prod_UNi5RHiKNSTfQl",
  nurture_sequence_14d: "prod_UNi5N0l5MtaV0R",
  lead_reactivation: "prod_UNi5PWv05ECzXI",
  review_request: "prod_UNi5dvOUm6Fi9i",
};

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function buildOrder({
  id = "order_1",
  serviceKey,
  installStatus = "Live",
  subscriptionStatus = "active",
  paymentStatus = "paid",
  serviceAccessStatus = "active",
  sharedConfig = {},
  serviceConfig = {},
} = {}) {
  return {
    id,
    created_date: isoMinutesAgo(120),
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    payment_status: paymentStatus,
    subscription_status: subscriptionStatus,
    billing_status: subscriptionStatus,
    items: [
      {
        product_id: PRODUCT_IDS[serviceKey] || `prod_${serviceKey}`,
        product_name: serviceKey,
        tracking_enabled: true,
        service_key: serviceKey,
        install_status: installStatus,
        service_access_status: serviceAccessStatus,
        status: installStatus === "Live" ? "live" : "setting_up",
      },
    ],
    install_configuration: {
      shared: {
        twilio_business_phone: "+16025550999",
        business_hours: "Mon-Fri 8am-5pm",
        after_hours_behavior: "send_after_hours_sms",
        consent_behavior: "include_opt_out_language",
        opt_out_message: "Reply STOP to opt out.",
        ...sharedConfig,
      },
      services: {
        [serviceKey]: serviceConfig,
      },
    },
  };
}

function createFakeBase44({ orders = [], leads = [], events = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders),
    Leads: new InMemoryCollection(leads),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      integrations: {
        Core: {
          SendEmail: async ({ to, subject }) => ({
            id: `email_${to}_${subject}`,
            status: "processed",
          }),
        },
      },
    },
  };
}

test("instant lead response requires Live install status", async () => {
  const order = buildOrder({
    serviceKey: "instant_lead_response",
    installStatus: "Testing",
    serviceConfig: {
      sms_template: "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
    },
  });
  const lead = {
    id: "lead_1",
    full_name: "Taylor Lead",
    phone: "+16025550001",
    email: "taylor@example.com",
    business_name: "Signal Med Spa",
  };
  const { base44, entities } = createFakeBase44({ orders: [order], leads: [lead] });

  await assert.rejects(
    () =>
      executeProductionInstantLeadResponse({
        base44,
        order,
        lead,
        now: new Date().toISOString(),
        sendSms: async () => ({ provider_message_id: "SM_test", provider_status: "sent" }),
      }),
    (error) => {
      assert.equal(error instanceof RuntimeExecutionError, true);
      assert.equal(error.code, "service_not_live");
      return true;
    }
  );

  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "runtime_attempt_blocked")
  );
});

test("instant lead response requires active subscription", async () => {
  const order = buildOrder({
    serviceKey: "instant_lead_response",
    subscriptionStatus: "past_due",
    serviceConfig: {
      sms_template: "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
    },
  });
  const lead = {
    id: "lead_1",
    full_name: "Taylor Lead",
    phone: "+16025550001",
    email: "taylor@example.com",
    business_name: "Signal Med Spa",
  };
  const { base44 } = createFakeBase44({ orders: [order], leads: [lead] });

  await assert.rejects(
    () =>
      executeProductionInstantLeadResponse({
        base44,
        order,
        lead,
        now: new Date().toISOString(),
        sendSms: async () => ({ provider_message_id: "SM_test", provider_status: "sent" }),
      }),
    (error) => {
      assert.equal(error instanceof RuntimeExecutionError, true);
      assert.equal(error.code, "subscription_not_active");
      return true;
    }
  );
});

test("instant lead response requires config and logs canonical send events with duplicate prevention", async () => {
  const now = new Date().toISOString();
  const order = buildOrder({
    serviceKey: "instant_lead_response",
    serviceConfig: {
      sms_template: "Hi {{lead_name}}, thanks for reaching out to {{business_name}}.",
    },
  });
  order.items.push({
    product_id: PRODUCT_IDS.nurture_sequence_14d,
    product_name: "nurture_sequence_14d",
    tracking_enabled: true,
    service_key: "nurture_sequence_14d",
    install_status: "Live",
    service_access_status: "active",
    status: "live",
  });
  order.install_configuration.services.nurture_sequence_14d = {
    sms_enabled: true,
    email_enabled: false,
    steps: [
      {
        day: 0,
        channel: "sms",
        message_template: "Nurture hello for {{lead_name}}.",
      },
    ],
  };
  const lead = {
    id: "lead_1",
    full_name: "Taylor Lead",
    phone: "+16025550001",
    email: "taylor@example.com",
    business_name: "Signal Med Spa",
    business_type: "Med Spa",
    problem: "Need help",
    source: "customer_webhook",
    intake_type: "customer_webhook",
  };
  const { base44, entities } = createFakeBase44({ orders: [order], leads: [lead] });

  const result = await executeProductionInstantLeadResponse({
    base44,
    order,
    lead,
    now,
    sendSms: async () => ({ provider_message_id: "SM_success", provider_status: "sent" }),
  });

  assert.equal(result.success, true);
  assert.equal(result.service_key, "instant_lead_response");
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "runtime_attempt_started")
  );
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "provider_send_attempted")
  );
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "provider_send_succeeded")
  );

  await assert.rejects(
    () =>
      executeProductionInstantLeadResponse({
        base44,
        order,
        lead,
        now,
        sendSms: async () => ({ provider_message_id: "SM_duplicate", provider_status: "sent" }),
      }),
    (error) => {
      assert.equal(error.code, "duplicate_prevented");
      return true;
    }
  );
});

test("nurture due-step runner processes due steps idempotently", async () => {
  const now = new Date().toISOString();
  const order = buildOrder({
    serviceKey: "nurture_sequence_14d",
    serviceConfig: {
      sms_enabled: true,
      email_enabled: false,
      steps: [
        {
          day: 1,
          channel: "sms",
          message_template: "Day 1 follow-up for {{lead_name}} from {{business_name}}.",
        },
        {
          day: 7,
          channel: "sms",
          message_template: "Day 7 follow-up for {{lead_name}} from {{business_name}}.",
        },
        {
          day: 14,
          channel: "sms",
          message_template: "Day 14 follow-up for {{lead_name}} from {{business_name}}.",
        },
      ],
    },
  });
  const lead = {
    id: "lead_1",
    full_name: "Taylor Lead",
    phone: "+16025550001",
    email: "taylor@example.com",
    business_name: "Signal Med Spa",
    status: "New",
    business_type: "Med Spa",
    problem: "Need help",
    source: "customer_webhook",
    intake_type: "customer_webhook",
    automation_context_json: JSON.stringify({
      order_id: order.id,
      nurture_sequence_14d: {
        order_id: order.id,
        active: true,
        enrolled_at: isoMinutesAgo(60),
        next_step_index: 0,
        next_step_due_at: isoMinutesAgo(5),
      },
    }),
  };
  const { base44, entities } = createFakeBase44({ orders: [order], leads: [lead] });

  const result = await processDueNurtureSequenceSteps({
    base44,
    orderId: order.id,
    now,
    sendSms: async () => ({ provider_message_id: "SM_nurture", provider_status: "sent" }),
  });

  assert.equal(result.success, true);
  assert.equal(result.processed, 1);

  const updatedLead = await entities.Leads.get("lead_1");
  const context = JSON.parse(updatedLead.automation_context_json);
  assert.equal(context.nurture_sequence_14d.active, true);
  assert.equal(context.nurture_sequence_14d.next_step_index, 1);
});

test("lead reactivation batch requires approval and respects cooldown", async () => {
  const now = new Date().toISOString();
  const order = buildOrder({
    serviceKey: "lead_reactivation",
    serviceConfig: {
      target_segment: "contacted_no_reply",
      max_batch_size: 10,
      message_template: "We still have availability for {{business_name}} if you'd like to reconnect.",
    },
  });
  const lead = {
    id: "lead_1",
    full_name: "Dormant Lead",
    phone: "+16025550001",
    email: "dormant@example.com",
    business_name: "Signal Med Spa",
    business_type: "Med Spa",
    problem: "Old lead",
    source: "manual_import",
    intake_type: "legacy",
    status: "Contacted",
    created_date: isoMinutesAgo(60 * 24 * 45),
    last_contacted_at: isoMinutesAgo(60 * 24 * 40),
  };
  const { base44, entities } = createFakeBase44({ orders: [order], leads: [lead] });

  await assert.rejects(
    () =>
      executeLeadReactivationBatch({
        base44,
        order,
        approved: false,
        now,
        sendSms: async () => ({ provider_message_id: "SM_reactivation", provider_status: "sent" }),
      }),
    (error) => {
      assert.equal(error.code, "approval_required");
      return true;
    }
  );

  const result = await executeLeadReactivationBatch({
    base44,
    order,
    approved: true,
    approvedBy: "ops@example.com",
    now,
    sendSms: async () => ({ provider_message_id: "SM_reactivation", provider_status: "sent" }),
  });

  assert.equal(result.success, true);
  assert.equal(result.sent_count, 1);
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "lead_reactivation_batch_completed")
  );

  await entities.Leads.update("lead_1", {
    last_contacted_at: isoMinutesAgo(60 * 24 * 40),
    last_activity_at: isoMinutesAgo(60 * 24 * 40),
  });

  const second = await executeLeadReactivationBatch({
    base44,
    order,
    approved: true,
    approvedBy: "ops@example.com",
    now,
    sendSms: async () => ({ provider_message_id: "SM_reactivation_2", provider_status: "sent" }),
  });
  assert.equal(second.skipped_count, 1);
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "runtime_attempt_blocked" && event.service_key === "lead_reactivation")
  );
});

test("manual review request sends through configured channel and prevents near-term duplicates", async () => {
  const now = new Date().toISOString();
  const order = buildOrder({
    serviceKey: "review_request",
    serviceConfig: {
      channel: "email",
      trigger_event: "manual_trigger",
      review_link: "https://reviews.example.com/signal-med-spa",
      message_template: "Thanks for choosing {{business_name}}. Review us here: {{review_link}}",
      send_delay_minutes: 0,
      fallback_internal_feedback_enabled: false,
    },
  });
  const { base44, entities } = createFakeBase44({ orders: [order] });

  const result = await executeManualReviewRequest({
    base44,
    order,
    recipientEmail: "customer@example.com",
    customerName: "Taylor Customer",
    now,
    sendEmail: async () => ({ provider_message_id: "email_review", provider_status: "processed" }),
  });

  assert.equal(result.success, true);
  assert.equal(result.channel, "email");
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "provider_send_attempted" && event.service_key === "review_request")
  );
  assert.ok(
    entities.CommunicationEvent.records.some((event) => event.event_type === "provider_send_succeeded" && event.service_key === "review_request")
  );

  await assert.rejects(
    () =>
      executeManualReviewRequest({
        base44,
        order,
        recipientEmail: "customer@example.com",
        customerName: "Taylor Customer",
        now,
        sendEmail: async () => ({ provider_message_id: "email_review_2", provider_status: "processed" }),
      }),
    (error) => {
      assert.equal(error.code, "duplicate_prevented");
      return true;
    }
  );
});
