import test from "node:test";
import assert from "node:assert/strict";

import {
  processReviewCompletionTrigger,
  ReviewCompletionTriggerError,
  RuntimeExecutionError,
} from "../base44/functions/_shared/reviewCompletionWebhook.js";

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

function buildOrder(overrides = {}) {
  return {
    id: "order_1",
    created_date: "2026-05-03T12:00:00.000Z",
    payment_status: "paid",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    client_id: "client_1",
    client_project_id: "project_1",
    onboarding_client_id: "onboarding_1",
    items: [
      {
        service_key: "review_request",
        tracking_enabled: true,
        install_status: "Live",
        status: "live",
        product_id: "prod_review",
        product_name: "Review Request Automation",
      },
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
        review_request: {
          review_link: "https://reviews.example.com/signal-med-spa",
          trigger_event: "order_completed",
          message_template: "Hi {{first_name}}, please leave us a review here: {{review_link}}",
          channel: "email",
          send_delay_minutes: 0,
          fallback_internal_feedback_enabled: true,
        },
      },
    },
    ...overrides,
  };
}

function createFakeBase44({ orders = [], events = [] } = {}) {
  const entities = {
    Order: new InMemoryCollection(orders.length ? orders : [buildOrder()]),
    CommunicationEvent: new InMemoryCollection(events),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      integrations: {
        Core: {
          SendEmail: async () => ({
            id: "email_live_1",
            status: "sent",
          }),
        },
      },
    },
  };
}

test("processReviewCompletionTrigger sends a real email review request and records live proof", async () => {
  const { base44, entities } = createFakeBase44();

  const result = await processReviewCompletionTrigger({
    base44,
    payload: {
      order_id: "order_1",
      trigger_event: "order_completed",
      completion_id: "complete_1",
      target_email: "guest@example.com",
      customer_name: "Taylor Guest",
      source: "booking_system",
    },
    now: "2026-05-03T12:30:00.000Z",
    sendEmail: async () => ({
      provider_message_id: "email_live_1",
      provider_status: "sent",
    }),
  });

  assert.equal(result.success, true);
  assert.equal(result.runtime_result.placeholder_runtime, false);
  assert.equal(result.runtime_result.provider_message_id, "email_live_1");
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.subject === "Review completion webhook accepted" &&
        event.order_id === "order_1"
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) =>
        event.event_type === "provider_send_succeeded" &&
        event.provider === "resend" &&
        event.provider_message_id === "email_live_1"
    )
  );
  assert.ok(
    entities.CommunicationEvent.records.some((event) => {
      const metadata = event.metadata_json ? JSON.parse(event.metadata_json) : {};
      return (
        event.subject === "Review Request Automation live trigger proof recorded" &&
        metadata.proof_kind === "live_review_request_trigger" &&
        metadata.completion_id === "complete_1"
      );
    })
  );
});

test("processReviewCompletionTrigger suppresses duplicate completion ids for the same order and trigger", async () => {
  const { base44, entities } = createFakeBase44();
  let sendCount = 0;

  await processReviewCompletionTrigger({
    base44,
    payload: {
      order_id: "order_1",
      trigger_event: "order_completed",
      completion_id: "complete_dup",
    },
    now: "2026-05-03T12:35:00.000Z",
    sendEmail: async () => {
      sendCount += 1;
      return {
        provider_message_id: `email_live_${sendCount}`,
        provider_status: "sent",
      };
    },
  });

  const duplicateResult = await processReviewCompletionTrigger({
    base44,
    payload: {
      order_id: "order_1",
      trigger_event: "order_completed",
      completion_id: "complete_dup",
    },
    now: "2026-05-03T12:36:00.000Z",
    sendEmail: async () => {
      sendCount += 1;
      return {
        provider_message_id: `email_live_${sendCount}`,
        provider_status: "sent",
      };
    },
  });

  assert.equal(sendCount, 1);
  assert.equal(duplicateResult.duplicate_suppressed, true);
  assert.equal(
    entities.CommunicationEvent.records.filter((event) => event.subject === "Review completion webhook accepted").length,
    1
  );
});

test("processReviewCompletionTrigger blocks mismatched trigger types and delayed live review sends", async () => {
  const { base44 } = createFakeBase44({
    orders: [
      buildOrder({
        install_configuration: {
          shared: {
            twilio_business_phone: "+16025550999",
          },
          services: {
            review_request: {
              review_link: "https://reviews.example.com/signal-med-spa",
              trigger_event: "appointment_completed",
              message_template: "Hi {{first_name}}, please leave us a review here: {{review_link}}",
              channel: "email",
              send_delay_minutes: 15,
              fallback_internal_feedback_enabled: true,
            },
          },
        },
      }),
    ],
  });

  await assert.rejects(
    () =>
      processReviewCompletionTrigger({
        base44,
        payload: {
          order_id: "order_1",
          trigger_event: "order_completed",
          completion_id: "complete_bad",
        },
      }),
    (error) => {
      assert.equal(error instanceof ReviewCompletionTriggerError, true);
      assert.equal(error.code, "review_completion_trigger_event_mismatch");
      return true;
    }
  );

  await assert.rejects(
    () =>
      processReviewCompletionTrigger({
        base44,
        payload: {
          order_id: "order_1",
          trigger_event: "appointment_completed",
          completion_id: "complete_delay",
        },
      }),
    (error) => {
      assert.equal(error instanceof RuntimeExecutionError, true);
      assert.equal(error.code, "missing_runtime_configuration");
      assert.ok(
        error.details?.validation?.missing_fields?.includes("services.review_request.send_delay_minutes")
      );
      return true;
    }
  );
});
