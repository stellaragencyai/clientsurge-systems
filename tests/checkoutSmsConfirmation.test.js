import test from "node:test";
import assert from "node:assert/strict";

import { ensureCheckoutConfirmationSms } from "../base44/functions/_shared/stripeOrderWebhook.js";

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
    const index = this.records.findIndex((record) => record.id === id);
    if (index === -1) {
      throw new Error(`Record ${id} not found`);
    }

    this.records[index] = {
      ...this.records[index],
      ...patch,
    };

    return { ...this.records[index] };
  }
}

function createFakeBase44(order) {
  const entities = {
    Order: new InMemoryCollection([order]),
    CommunicationEvent: new InMemoryCollection(),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
    },
  };
}

function buildOrder(overrides = {}) {
  return {
    id: "order_1",
    customer_email: "owner@example.com",
    customer_name: "Jamie Owner",
    customer_phone: "+16025550123",
    business_name: "Signal Med Spa",
    plan_type: "Starter System",
    pricing_summary: {
      package_name: "Starter System",
    },
    ...overrides,
  };
}

test("checkout SMS confirmation is skipped without explicit SMS consent", async () => {
  const previousDeno = globalThis.Deno;
  const previousFetch = globalThis.fetch;
  const order = buildOrder({ sms_consent_granted: false });
  const { base44, entities } = createFakeBase44(order);
  let fetchCount = 0;

  globalThis.Deno = {
    env: {
      get(name) {
        return {
          TWILIO_ACCOUNT_SID: "AC_test",
          TWILIO_AUTH_TOKEN: "token",
          TWILIO_PHONE_NUMBER: "+16025550999",
        }[name];
      },
    },
  };
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response("{}", { status: 200 });
  };

  try {
    const result = await ensureCheckoutConfirmationSms({
      base44,
      order,
      session: { metadata: {} },
      portalActivationUrl: "https://clientsurgesystems.com/client-portal",
    });

    assert.equal(result.sent, false);
    assert.equal(result.reason, "sms_consent_not_granted");
    assert.equal(fetchCount, 0);

    const savedOrder = entities.Order.records[0];
    assert.equal(savedOrder.checkout_sms_confirmation_status, "skipped");
    assert.equal(savedOrder.checkout_sms_confirmation_skipped_reason, "sms_consent_not_granted");

    const event = entities.CommunicationEvent.records[0];
    assert.equal(event.provider, "twilio");
    assert.equal(event.channel, "sms");
    assert.equal(event.status, "processed");
    assert.match(event.message_body, /sms_consent_not_granted/);
  } finally {
    globalThis.Deno = previousDeno;
    globalThis.fetch = previousFetch;
  }
});

test("checkout SMS confirmation sends only when consent and Twilio config are present", async () => {
  const previousDeno = globalThis.Deno;
  const previousFetch = globalThis.fetch;
  const order = buildOrder({
    sms_consent_granted: true,
    sms_consent_source: "checkout",
  });
  const { base44, entities } = createFakeBase44(order);
  let requestBody = "";

  globalThis.Deno = {
    env: {
      get(name) {
        return {
          TWILIO_ACCOUNT_SID: "AC_test",
          TWILIO_AUTH_TOKEN: "token",
          TWILIO_PHONE_NUMBER: "+16025550999",
        }[name];
      },
    },
  };
  globalThis.fetch = async (_url, options) => {
    requestBody = String(options.body);
    return new Response(JSON.stringify({ sid: "SM_checkout_123", status: "queued" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await ensureCheckoutConfirmationSms({
      base44,
      order,
      session: { metadata: {} },
      portalActivationUrl: "https://clientsurgesystems.com/client-portal",
    });

    assert.equal(result.sent, true);
    assert.equal(result.message_sid, "SM_checkout_123");
    assert.match(requestBody, /To=%2B16025550123/);
    assert.match(requestBody, /From=%2B16025550999/);
    assert.match(requestBody, /Reply\+STOP\+to\+opt\+out/);

    const savedOrder = entities.Order.records[0];
    assert.equal(savedOrder.checkout_sms_confirmation_status, "sent");
    assert.equal(savedOrder.checkout_sms_confirmation_message_sid, "SM_checkout_123");
    assert.match(savedOrder.checkout_sms_confirmation_sent_at, /^\d{4}-\d{2}-\d{2}T/);

    const outboxEvent = entities.CommunicationEvent.records.find(
      (record) => record.provider_message_id === "SM_checkout_123"
    );
    assert.ok(outboxEvent);
    assert.equal(outboxEvent.event_type, "sms_sent");
    assert.equal(outboxEvent.status, "sent");

    const summaryEvent = entities.CommunicationEvent.records.find(
      (record) => record.provider_message_id === "checkout_sms_confirmation:order_1"
    );
    assert.ok(summaryEvent);
    assert.match(summaryEvent.metadata_json, /SM_checkout_123/);
  } finally {
    globalThis.Deno = previousDeno;
    globalThis.fetch = previousFetch;
  }
});
