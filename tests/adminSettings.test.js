import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminSettingsPatch,
  DEFAULT_ADMIN_SETTINGS,
  normalizeAdminSettings,
  saveAdminSettings,
} from "../base44/functions/_shared/adminSettings.js";

test("normalizeAdminSettings fills defaults without dropping stored values", () => {
  const normalized = normalizeAdminSettings({
    resend_enabled: true,
    resend_from_email: "ops@example.com",
    allowed_admin_ips: ["203.0.113.10"],
  });

  assert.equal(normalized.resend_enabled, true);
  assert.equal(normalized.resend_from_email, "ops@example.com");
  assert.equal(normalized.twilio_enabled, DEFAULT_ADMIN_SETTINGS.twilio_enabled);
  assert.equal(normalized.sms_template, DEFAULT_ADMIN_SETTINGS.sms_template);
  assert.deepEqual(normalized.allowed_admin_ips, ["203.0.113.10"]);
});

test("buildAdminSettingsPatch only keeps mutable settings fields", () => {
  const patch = buildAdminSettingsPatch({
    sms_template: "hello",
    webhook_enabled: true,
    allowed_admin_ips: ["203.0.113.10"],
    id: "forbidden",
    created_date: "ignore-me",
  });

  assert.deepEqual(patch, {
    sms_template: "hello",
    webhook_enabled: true,
    allowed_admin_ips: ["203.0.113.10"],
  });
});

test("saveAdminSettings updates the existing record and logs the change", async () => {
  const calls = {
    updated: null,
    created: null,
    event: null,
  };

  const base44 = {
    asServiceRole: {
      entities: {
        AdminSettings: {
          async list() {
            return [{ id: "settings_1", sms_template: "old" }];
          },
          async update(id, patch) {
            calls.updated = { id, patch };
            return { id, sms_template: patch.sms_template };
          },
          async create(payload) {
            calls.created = payload;
            return payload;
          },
        },
        CommunicationEvent: {
          async create(payload) {
            calls.event = payload;
            return payload;
          },
        },
      },
    },
  };

  const saved = await saveAdminSettings({
    base44,
    actor: { email: "admin@example.com" },
    patch: { sms_template: "new template" },
  });

  assert.deepEqual(calls.updated, {
    id: "settings_1",
    patch: { sms_template: "new template" },
  });
  assert.equal(calls.created, null);
  assert.equal(saved.sms_template, "new template");
  assert.equal(calls.event.subject, "Admin settings updated");
  assert.equal(calls.event.provider, "internal");
  assert.match(calls.event.metadata_json, /sms_template/);
});
