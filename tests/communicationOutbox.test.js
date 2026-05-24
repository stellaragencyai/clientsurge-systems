import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEmailSuppression,
  applySmsOptOut,
  listCommunicationOutboxItems,
  processCommunicationOutboxRetries,
  retryCommunicationOutboxRecord,
  sendCommunicationViaOutbox,
  updateOutboxDeliveryStatus,
} from "../base44/functions/_shared/communicationOutbox.js";

class InMemoryEntity {
  constructor(records = []) {
    this.records = records.map((record, index) => ({ id: record.id || `rec_${index + 1}`, ...record }));
    this.nextId = this.records.length + 1;
  }

  async create(payload) {
    const record = {
      id: payload.id || `rec_${this.nextId++}`,
      created_date: payload.created_date || new Date().toISOString(),
      ...payload,
    };
    this.records.push(record);
    return record;
  }

  async update(id, patch) {
    const index = this.records.findIndex((record) => record.id === id);
    if (index === -1) throw new Error(`Record not found: ${id}`);
    this.records[index] = { ...this.records[index], ...patch };
    return this.records[index];
  }

  async get(id) {
    return this.records.find((record) => record.id === id) || null;
  }

  async list(_sort, limit) {
    return typeof limit === "number" ? this.records.slice(0, limit) : this.records;
  }

  async filter(query = {}, _sort, limit) {
    const matches = this.records.filter((record) => {
      return Object.entries(query).every(([key, expected]) => {
        if (expected && typeof expected === "object" && "$in" in expected) {
          return expected.$in.includes(record[key]);
        }
        return record[key] === expected;
      });
    });
    return typeof limit === "number" ? matches.slice(0, limit) : matches;
  }
}

function createBase44(seed = {}) {
  const entities = {
    CommunicationOutbox: new InMemoryEntity(seed.CommunicationOutbox || []),
    CommunicationEvent: new InMemoryEntity(seed.CommunicationEvent || []),
    WebsiteLead: new InMemoryEntity(seed.WebsiteLead || []),
    Leads: new InMemoryEntity(seed.Leads || []),
    Lead: new InMemoryEntity(seed.Lead || []),
  };
  return {
    entities,
    asServiceRole: { entities },
  };
}

test("SMS send goes through canonical outbox and CommunicationEvent", async () => {
  const base44 = createBase44();
  let providerCalls = 0;

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "(602) 555-0100",
    body: "Your appointment is confirmed.",
    source: "booking_reminder",
    sourceRecordId: "booking_1",
    templateKey: "booking_confirmation",
    messageType: "transactional",
    providerSend: async () => {
      providerCalls++;
      return { provider_message_id: "SM123", provider_status: "queued" };
    },
  });

  assert.equal(result.success, true);
  assert.equal(providerCalls, 1);
  assert.equal(base44.entities.CommunicationOutbox.records.length, 1);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "sent");
  assert.equal(base44.entities.CommunicationOutbox.records[0].provider_message_id, "SM123");
  assert.equal(base44.entities.CommunicationEvent.records.length, 1);
  assert.equal(base44.entities.CommunicationEvent.records[0].event_type, "sms_sent");
});

test("Email send goes through canonical outbox", async () => {
  const base44 = createBase44();

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "email",
    provider: "resend",
    recipient: "Owner@Example.com",
    subject: "Welcome",
    body: "Welcome aboard.",
    source: "portal_invite",
    sourceRecordId: "order_1",
    templateKey: "portal_welcome",
    messageType: "transactional",
    providerSend: async () => ({ provider_message_id: "em_123", provider_status: "sent" }),
  });

  assert.equal(result.success, true);
  assert.equal(base44.entities.CommunicationOutbox.records[0].recipient_normalized, "owner@example.com");
  assert.equal(base44.entities.CommunicationEvent.records[0].provider, "resend");
});

test("missing SMS marketing consent suppresses send", async () => {
  const base44 = createBase44();
  let providerCalls = 0;

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "+16025550101",
    body: "We have a special offer this week.",
    lead: { id: "lead_1", consent_given: false },
    source: "review_request",
    sourceRecordId: "lead_1",
    templateKey: "marketing_sms",
    messageType: "marketing",
    enforceQuietHours: false,
    providerSend: async () => {
      providerCalls++;
      return { provider_message_id: "SM_SHOULD_NOT_SEND" };
    },
  });

  assert.equal(result.suppressed, true);
  assert.equal(result.reason, "missing_sms_marketing_consent");
  assert.equal(providerCalls, 0);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "suppressed");
  assert.equal(base44.entities.CommunicationEvent.records[0].event_type, "sms_suppressed");
});

test("transactional SMS can send with transactional basis", async () => {
  const base44 = createBase44();

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "+16025550102",
    body: "Your order setup link is ready.",
    messageType: "transactional",
    consentBasis: "transactional_relationship",
    source: "onboarding_invite",
    sourceRecordId: "order_2",
    providerSend: async () => ({ provider_message_id: "SM_TXN" }),
  });

  assert.equal(result.success, true);
  assert.equal(base44.entities.CommunicationOutbox.records[0].consent_basis, "transactional_relationship");
});

test("STOP opt-out suppresses future SMS", async () => {
  const base44 = createBase44({
    WebsiteLead: [{ id: "lead_1", phone_number: "+16025550103", consent_given: true }],
  });

  await applySmsOptOut({
    base44,
    phone: "+1 (602) 555-0103",
    keyword: "STOP",
    providerMessageId: "SM_STOP",
    now: "2026-05-22T12:00:00.000Z",
  });

  const lead = base44.entities.WebsiteLead.records[0];
  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "+16025550103",
    body: "Follow-up message",
    lead,
    source: "website_lead_followup",
    sourceRecordId: "lead_1",
    messageType: "transactional",
    providerSend: async () => ({ provider_message_id: "SM_SHOULD_NOT_SEND" }),
  });

  assert.equal(lead.sms_opted_out, true);
  assert.equal(result.suppressed, true);
  assert.equal(result.reason, "sms_opted_out");
});

test("duplicate event does not duplicate provider send", async () => {
  const base44 = createBase44();
  let providerCalls = 0;
  const shared = {
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "+16025550104",
    body: "Same event",
    source: "missed_call",
    sourceRecordId: "CA123",
    templateKey: "missed_call_reply",
    messageType: "transactional",
    providerSend: async () => {
      providerCalls++;
      return { provider_message_id: `SM_DUP_${providerCalls}` };
    },
  };

  const first = await sendCommunicationViaOutbox(shared);
  const second = await sendCommunicationViaOutbox(shared);

  assert.equal(first.success, true);
  assert.equal(second.duplicate, true);
  assert.equal(providerCalls, 1);
  assert.equal(base44.entities.CommunicationOutbox.records.length, 1);
});

test("provider failure records failed outbox and event", async () => {
  const base44 = createBase44();

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "email",
    provider: "resend",
    recipient: "lead@example.com",
    subject: "Follow-up",
    body: "Hello",
    source: "followup",
    sourceRecordId: "lead_2",
    providerSend: async () => {
      const error = new Error("Resend error: 400");
      error.status = 400;
      throw error;
    },
  });

  assert.equal(result.failed, true);
  assert.equal(result.retryable, false);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "failed");
  assert.equal(base44.entities.CommunicationEvent.records[0].status, "failed");
});

test("retryable provider failure creates retry metadata", async () => {
  const base44 = createBase44();

  const result = await sendCommunicationViaOutbox({
    base44,
    channel: "sms",
    provider: "twilio",
    recipient: "+16025550105",
    body: "Retry later",
    source: "booking_reminder",
    sourceRecordId: "booking_retry",
    providerSend: async () => {
      const error = new Error("Twilio error: 429");
      error.status = 429;
      throw error;
    },
    now: "2026-05-22T12:00:00.000Z",
  });

  assert.equal(result.failed, true);
  assert.equal(result.retryable, true);
  assert.equal(base44.entities.CommunicationOutbox.records[0].next_retry_at, "2026-05-22T12:15:00.000Z");
});

test("delivery callback updates provider status on outbox and event", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{ id: "out_1", provider_message_id: "SM_DELIVERED", status: "sent", metadata_json: "{}" }],
    CommunicationEvent: [{ id: "evt_1", provider_message_id: "SM_DELIVERED", status: "sent", metadata_json: "{}" }],
  });

  const result = await updateOutboxDeliveryStatus({
    base44,
    provider: "twilio",
    providerMessageId: "SM_DELIVERED",
    providerStatus: "delivered",
    status: "delivered",
    now: "2026-05-22T12:30:00.000Z",
  });

  assert.equal(result.success, true);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "delivered");
  assert.equal(base44.entities.CommunicationEvent.records[0].status, "delivered");
});

test("Resend bounce and complaint update event and suppression state", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{ id: "out_1", provider_message_id: "em_bounce", status: "sent", metadata_json: "{}" }],
    CommunicationEvent: [{ id: "evt_1", provider_message_id: "em_bounce", status: "sent", metadata_json: "{}" }],
    WebsiteLead: [{ id: "lead_1", email: "bounce@example.com" }],
  });

  await updateOutboxDeliveryStatus({
    base44,
    provider: "resend",
    providerMessageId: "em_bounce",
    providerStatus: "email.bounced",
    status: "failed",
    failureReason: "mailbox unavailable",
  });
  await applyEmailSuppression({
    base44,
    email: "bounce@example.com",
    reason: "bounce",
    providerMessageId: "em_bounce",
  });

  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "failed");
  assert.equal(base44.entities.CommunicationEvent.records[0].status, "failed");
  assert.equal(base44.entities.WebsiteLead.records[0].email_suppressed, true);
  assert.equal(base44.entities.WebsiteLead.records[0].email_suppression_reason, "bounce");
});

test("retry worker sends eligible failed retryable item", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{
      id: "out_retry",
      channel: "sms",
      provider: "twilio",
      recipient: "+16025550106",
      recipient_normalized: "+16025550106",
      message_body: "Retry me",
      message_type: "transactional",
      consent_basis: "transactional_relationship",
      idempotency_key: "twilio:sms:test:+16025550106:transactional:retry:source",
      status: "failed",
      attempts: 1,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });
  let providerCalls = 0;

  const result = await processCommunicationOutboxRetries({
    base44,
    now: "2026-05-22T12:01:00.000Z",
    providerSend: async () => {
      providerCalls++;
      return { provider_message_id: "SM_RETRY" };
    },
  });

  assert.equal(result.retried, 1);
  assert.equal(providerCalls, 1);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "sent");
});

test("retry worker skips max-attempt exceeded", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{
      id: "out_max",
      channel: "email",
      provider: "resend",
      recipient: "max@example.com",
      recipient_normalized: "max@example.com",
      subject: "Retry",
      message_body: "Retry",
      message_type: "transactional",
      idempotency_key: "resend:email:test:max@example.com:transactional:retry:source",
      status: "failed",
      attempts: 3,
      max_attempts: 3,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });

  const result = await processCommunicationOutboxRetries({
    base44,
    now: "2026-05-22T12:01:00.000Z",
    providerSend: async () => ({ provider_message_id: "em_nope" }),
  });

  assert.equal(result.skipped, 1);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "needs_manual_review");
});

test("retry worker re-checks STOP opt-out", async () => {
  const base44 = createBase44({
    WebsiteLead: [{ id: "lead_stop", phone_number: "+16025550107", sms_opted_out: true }],
    CommunicationOutbox: [{
      id: "out_stop",
      channel: "sms",
      provider: "twilio",
      recipient: "+16025550107",
      recipient_normalized: "+16025550107",
      lead_id: "lead_stop",
      message_body: "Retry after STOP",
      message_type: "transactional",
      idempotency_key: "twilio:sms:test:+16025550107:transactional:retry:source",
      status: "failed",
      attempts: 1,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });

  const result = await processCommunicationOutboxRetries({
    base44,
    now: "2026-05-22T12:01:00.000Z",
    providerSend: async () => ({ provider_message_id: "SM_SHOULD_NOT_SEND" }),
  });

  assert.equal(result.failed, 1);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "suppressed");
  assert.equal(base44.entities.CommunicationOutbox.records[0].suppression_reason, "sms_opted_out");
});

test("retry worker re-checks email suppression", async () => {
  const base44 = createBase44({
    WebsiteLead: [{ id: "lead_email_stop", email: "stop@example.com", email_suppressed: true }],
    CommunicationOutbox: [{
      id: "out_email_stop",
      channel: "email",
      provider: "resend",
      recipient: "stop@example.com",
      recipient_normalized: "stop@example.com",
      lead_id: "lead_email_stop",
      subject: "Retry",
      message_body: "Retry",
      message_type: "transactional",
      idempotency_key: "resend:email:test:stop@example.com:transactional:retry:source",
      status: "failed",
      attempts: 1,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });

  const result = await processCommunicationOutboxRetries({
    base44,
    now: "2026-05-22T12:01:00.000Z",
    providerSend: async () => ({ provider_message_id: "em_should_not_send" }),
  });

  assert.equal(result.failed, 1);
  assert.equal(base44.entities.CommunicationOutbox.records[0].status, "suppressed");
  assert.equal(base44.entities.CommunicationOutbox.records[0].suppression_reason, "email_suppressed");
});

test("manual retry writes audit event", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{
      id: "out_manual",
      channel: "email",
      provider: "resend",
      recipient: "manual@example.com",
      recipient_normalized: "manual@example.com",
      subject: "Manual",
      message_body: "Manual retry",
      message_type: "transactional",
      idempotency_key: "resend:email:test:manual@example.com:transactional:retry:source",
      status: "failed",
      attempts: 1,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });

  const result = await retryCommunicationOutboxRecord({
    base44,
    outboxId: "out_manual",
    manual: true,
    adminEmail: "admin@example.com",
    providerSend: async () => ({ provider_message_id: "em_manual" }),
  });

  assert.equal(result.success, true);
  assert.ok(base44.entities.CommunicationEvent.records.some((event) => event.context_type === "CommunicationOutbox"));
});

test("manual retry function requires admin auth in entrypoint", async () => {
  const fs = await import("node:fs/promises");
  const source = await fs.readFile(new URL("../base44/functions/retryCommunicationOutboxItem/entry.ts", import.meta.url), "utf8");
  assert.match(source, /requireAdminUser/);
});

test("idempotency prevents duplicate retry sends after success", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [{
      id: "out_once",
      channel: "sms",
      provider: "twilio",
      recipient: "+16025550108",
      recipient_normalized: "+16025550108",
      message_body: "Only once",
      message_type: "transactional",
      idempotency_key: "twilio:sms:test:+16025550108:transactional:retry:source",
      status: "failed",
      attempts: 1,
      retryable: true,
      next_retry_at: "2026-05-22T12:00:00.000Z",
      metadata_json: "{}",
    }],
  });
  let providerCalls = 0;
  const providerSend = async () => {
    providerCalls++;
    return { provider_message_id: "SM_ONCE" };
  };

  await retryCommunicationOutboxRecord({ base44, outboxId: "out_once", providerSend });
  await retryCommunicationOutboxRecord({ base44, outboxId: "out_once", providerSend });

  assert.equal(providerCalls, 1);
});

test("listCommunicationOutbox supports filters", async () => {
  const base44 = createBase44({
    CommunicationOutbox: [
      { id: "out_sms", channel: "sms", provider: "twilio", status: "failed", message_type: "transactional", recipient: "+16025550109", recipient_normalized: "+16025550109" },
      { id: "out_email", channel: "email", provider: "resend", status: "sent", message_type: "marketing", recipient: "sent@example.com", recipient_normalized: "sent@example.com" },
    ],
  });

  const result = await listCommunicationOutboxItems({
    base44,
    filters: { failed_or_suppressed: true, channel: "sms" },
  });

  assert.equal(result.count, 1);
  assert.equal(result.items[0].id, "out_sms");
});
