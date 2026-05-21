import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";

import {
  initializePaidOrderInstallPipeline,
  updateOrderInstallConfiguration,
  updateTrackedServiceInstallStatus,
} from "../base44/functions/_shared/installPipeline.js";
import {
  handleTrustedResendWebhook,
  handleTrustedTwilioStatusWebhook,
} from "../base44/functions/_shared/webhookHandlers.js";
import {
  verifySvixWebhookRequest,
  verifyTwilioWebhookRequest,
} from "../base44/functions/_shared/webhookSecurity.js";

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

function buildCompleteConfigPatch() {
  return {
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
        sms_template: "Sorry we missed your call, {{caller_name}}. Text us here and we will help shortly.",
      },
    },
  };
}

function createFakeBase44(orderOverrides = {}, eventOverrides = []) {
  const entities = {
    Order: new InMemoryCollection([
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
        ],
        total_setup: 494,
        total_monthly: 164,
        payment_status: "pending",
        order_status: "pending_payment",
        ...orderOverrides,
      },
    ]),
    Client: new InMemoryCollection(),
    ClientProject: new InMemoryCollection(),
    OnboardingClient: new InMemoryCollection(),
    CommunicationEvent: new InMemoryCollection(eventOverrides),
  };

  return {
    entities,
    base44: {
      asServiceRole: { entities },
      entities,
    },
  };
}

function computeTwilioSignature({ authToken, url, formData }) {
  const grouped = new Map();
  for (const [key, value] of formData.entries()) {
    const current = grouped.get(key) || [];
    current.push(String(value));
    grouped.set(key, current);
  }

  let payload = url;
  [...grouped.keys()].sort().forEach((key) => {
    [...grouped.get(key)].sort().forEach((value) => {
      payload += key + value;
    });
  });

  return createHmac("sha1", authToken).update(payload).digest("base64");
}

function buildSvixSecret() {
  return `whsec_${randomBytes(24).toString("base64")}`;
}

function computeSvixSignature({ secret, messageId, timestamp, payload }) {
  const key = Buffer.from(secret.split("_")[1], "base64");
  return createHmac("sha256", key)
    .update(`${messageId}.${timestamp}.${payload}`)
    .digest("base64");
}

test("valid Twilio webhook accepted", async () => {
  process.env.TWILIO_AUTH_TOKEN = "twilio_test_token";

  const formData = new FormData();
  formData.set("MessageSid", "SM123");
  formData.set("MessageStatus", "delivered");

  const url = "https://example.com/api/functions/receiveTwilioStatusWebhook";
  const signature = computeTwilioSignature({
    authToken: process.env.TWILIO_AUTH_TOKEN,
    url,
    formData,
  });
  const req = new Request(url, {
    method: "POST",
    headers: {
      "x-twilio-signature": signature,
    },
  });

  const verification = await verifyTwilioWebhookRequest({ req, formData });
  assert.equal(verification.ok, true);
});

test("invalid Twilio webhook rejected", async () => {
  process.env.TWILIO_AUTH_TOKEN = "twilio_test_token";

  const formData = new FormData();
  formData.set("MessageSid", "SM123");
  formData.set("MessageStatus", "delivered");

  const req = new Request("https://example.com/api/functions/receiveTwilioStatusWebhook", {
    method: "POST",
    headers: {
      "x-twilio-signature": "bad_signature",
    },
  });

  const verification = await verifyTwilioWebhookRequest({ req, formData });
  assert.equal(verification.ok, false);
  assert.equal(verification.code, "webhook_signature_invalid");
});

test("valid Resend webhook accepted", async () => {
  const secret = buildSvixSecret();
  const payload = JSON.stringify({
    type: "email.delivered",
    data: {
      email_id: "email_123",
    },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const messageId = "msg_123";
  const signature = computeSvixSignature({
    secret,
    messageId,
    timestamp,
    payload,
  });

  const headers = new Headers({
    "svix-id": messageId,
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${signature}`,
  });

  const verification = await verifySvixWebhookRequest({ payload, headers, secret });
  assert.equal(verification.ok, true);
  assert.equal(verification.messageId, messageId);
});

test("invalid Resend webhook rejected", async () => {
  const secret = buildSvixSecret();
  const payload = JSON.stringify({
    type: "email.delivered",
    data: {
      email_id: "email_123",
    },
  });
  const headers = new Headers({
    "svix-id": "msg_123",
    "svix-timestamp": String(Math.floor(Date.now() / 1000)),
    "svix-signature": "v1,invalid_signature",
  });

  const verification = await verifySvixWebhookRequest({ payload, headers, secret });
  assert.equal(verification.ok, false);
  assert.equal(verification.code, "webhook_signature_invalid");
});

test("canonical runtime and message-status behavior still works for trusted Twilio events", async () => {
  const { base44, entities } = createFakeBase44({}, [
    {
      id: "event_1",
      provider_message_id: "SM_status",
      provider: "twilio",
      channel: "sms",
      direction: "outbound",
      event_type: "provider_send_attempted",
      status: "pending",
    },
  ]);

  let order = await entities.Order.get("order_1");
  await initializePaidOrderInstallPipeline({
    base44,
    order,
    stripeCustomerId: "cus_123",
    now: "2026-04-22T12:05:00.000Z",
  });

  order = await entities.Order.get("order_1");
  order = await updateOrderInstallConfiguration({
    base44,
    order,
    patch: buildCompleteConfigPatch(),
    now: "2026-04-22T12:08:00.000Z",
  });
  order = await updateTrackedServiceInstallStatus({
    base44,
    order,
    serviceKey: "missed_call_text_back",
    nextStatus: "Configuring",
    now: "2026-04-22T12:10:00.000Z",
  });
  order = await updateTrackedServiceInstallStatus({
    base44,
    order,
    serviceKey: "missed_call_text_back",
    nextStatus: "Testing",
    now: "2026-04-22T12:12:00.000Z",
  });

  const messageStatusData = new FormData();
  messageStatusData.set("MessageSid", "SM_status");
  messageStatusData.set("MessageStatus", "delivered");

  const statusResult = await handleTrustedTwilioStatusWebhook({
    base44,
    formData: messageStatusData,
  });
  assert.equal(statusResult.status, "delivered");
  assert.equal((await entities.CommunicationEvent.get("event_1")).status, "delivered");

  const runtimeEventsBefore = entities.CommunicationEvent.records.length;
  const callStatusData = new FormData();
  callStatusData.set("CallSid", "CA123");
  callStatusData.set("CallStatus", "no-answer");
  callStatusData.set("To", "+16025550999");
  callStatusData.set("From", "+16025550066");
  callStatusData.set("CallerName", "Taylor Caller");

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

  let sendCount = 0;
  globalThis.fetch = async () => {
    sendCount += 1;
    return new Response(
      JSON.stringify({
        sid: "SM_missed_call_live",
        status: "queued",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  let callResult;
  let duplicateCallResult;
  try {
    callResult = await handleTrustedTwilioStatusWebhook({
      base44,
      formData: callStatusData,
    });
    duplicateCallResult = await handleTrustedTwilioStatusWebhook({
      base44,
      formData: callStatusData,
    });
  } finally {
    globalThis.Deno = previousDeno;
    globalThis.fetch = previousFetch;
  }

  assert.equal(callResult.success, true);
  assert.equal(callResult.runtime_result.service_key, "missed_call_text_back");
  assert.equal(callResult.runtime_result.recipient_phone, "+16025550066");
  assert.equal(duplicateCallResult.success, true);
  assert.equal(duplicateCallResult.duplicate, true);
  assert.equal(duplicateCallResult.call_sid, "CA123");
  assert.equal(sendCount, 1);
  assert.ok(entities.CommunicationEvent.records.length > runtimeEventsBefore);
  assert.equal(
    entities.CommunicationEvent.records.filter(
      (event) =>
        event.event_type === "missed_call_webhook_received" &&
        event.provider_message_id === "CA123"
    ).length,
    1
  );
  assert.equal(
    entities.CommunicationEvent.records.filter(
      (event) => event.event_type === "provider_send_succeeded" && event.service_key === "missed_call_text_back"
    ).length,
    1
  );
  assert.ok(
    entities.CommunicationEvent.records.some(
      (event) => event.event_type === "provider_send_succeeded" && event.service_key === "missed_call_text_back"
    )
  );
});

test("trusted Resend webhook still updates canonical CommunicationEvent status", async () => {
  const { base44, entities } = createFakeBase44({}, [
    {
      id: "event_email",
      provider_message_id: "email_123",
      provider: "resend",
      channel: "email",
      direction: "outbound",
      event_type: "email_sent",
      status: "sent",
    },
  ]);

  const result = await handleTrustedResendWebhook({
    base44,
    payload: {
      type: "email.delivered",
      data: {
        email_id: "email_123",
      },
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.status, "delivered");
  assert.equal((await entities.CommunicationEvent.get("event_email")).status, "delivered");
});
