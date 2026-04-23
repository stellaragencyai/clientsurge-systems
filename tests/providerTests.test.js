import test from "node:test";
import assert from "node:assert/strict";

import { runProviderConnectionTests } from "../base44/functions/_shared/providerTests.js";

function createBase44Mock(settings, { sendEmailImpl } = {}) {
  const calls = {
    updatedSettings: [],
    events: [],
    sentEmails: [],
  };

  const base44 = {
    integrations: {
      Core: {
        async SendEmail(payload) {
          calls.sentEmails.push(payload);
          if (sendEmailImpl) {
            return sendEmailImpl(payload);
          }
          return { success: true };
        },
      },
    },
    asServiceRole: {
      entities: {
        AdminSettings: {
          async list() {
            return [{ id: "settings_1", ...settings }];
          },
          async update(id, patch) {
            calls.updatedSettings.push({ id, patch });
            return { id, ...patch };
          },
        },
        CommunicationEvent: {
          async create(payload) {
            calls.events.push(payload);
            return payload;
          },
        },
      },
    },
  };

  return { base44, calls };
}

test("provider tests return deterministic structured results and log test activity", async () => {
  const { base44, calls } = createBase44Mock({
    twilio_enabled: true,
    twilio_from_number: "+16025550100",
    resend_enabled: true,
    resend_from_email: "ops@example.com",
    webhook_enabled: true,
    webhook_url: "https://hooks.zapier.com/test",
  });

  const fetchCalls = [];
  const fetchImpl = async (url) => {
    fetchCalls.push(url);
    return { ok: true, status: 200 };
  };

  const { results } = await runProviderConnectionTests({
    base44,
    actor: { email: "admin@example.com" },
    providerType: "all",
    fetchImpl,
    env: {
      get(key) {
        if (key === "TWILIO_ACCOUNT_SID") return "sid";
        if (key === "TWILIO_AUTH_TOKEN") return "token";
        return undefined;
      },
    },
  });

  assert.equal(results.twilio.derived_status, "healthy");
  assert.equal(results.email.derived_status, "healthy");
  assert.equal(results.webhook.derived_status, "healthy");
  assert.equal(results.webhook.provider, "zapier");
  assert.equal(calls.updatedSettings.length, 0);
  assert.equal(calls.events.length, 3);
  assert.equal(calls.sentEmails.length, 1);
  assert.equal(fetchCalls.length, 2);
});

test("provider tests fail clearly when configuration is missing and never mutate AdminSettings", async () => {
  const { base44, calls } = createBase44Mock({
    twilio_enabled: false,
    resend_enabled: false,
    webhook_enabled: false,
  });

  const { results } = await runProviderConnectionTests({
    base44,
    actor: { email: "admin@example.com" },
    providerType: "all",
    fetchImpl: async () => ({ ok: true, status: 200 }),
    env: {
      get() {
        return undefined;
      },
    },
  });

  assert.equal(results.twilio.derived_status, "disabled");
  assert.equal(results.email.derived_status, "disabled");
  assert.equal(results.webhook.derived_status, "disabled");
  assert.equal(calls.updatedSettings.length, 0);
  assert.equal(calls.events.length, 3);
  calls.events.forEach((event) => {
    assert.match(event.metadata_json, /provider_test/);
  });
});
