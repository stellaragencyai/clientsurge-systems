import test from "node:test";
import assert from "node:assert/strict";

import { deriveIntegrationHealth } from "../base44/functions/_shared/integrationHealth.js";

test("integration health derives provider summaries from canonical settings and events", () => {
  const snapshot = deriveIntegrationHealth({
    settings: {
      twilio_enabled: true,
      twilio_from_number: "+16025550100",
      resend_enabled: true,
      resend_from_email: "ops@example.com",
      webhook_enabled: true,
      webhook_url: "https://example.com/webhook",
      last_webhook_test_result: "success",
      last_webhook_test_at: "2026-04-22T09:00:00.000Z",
    },
    events: [
      {
        id: "event_1",
        provider: "twilio",
        status: "failed",
        event_type: "provider_send_failed",
        created_date: "2026-04-22T10:00:00.000Z",
        error_message: "Carrier rejected",
      },
      {
        id: "event_2",
        provider: "resend",
        status: "delivered",
        event_type: "email_sent",
        created_date: "2026-04-22T09:55:00.000Z",
      },
    ],
  });

  const twilio = snapshot.integrations.find((integration) => integration.id === "twilio");
  const resend = snapshot.integrations.find((integration) => integration.id === "resend");
  const webhook = snapshot.integrations.find((integration) => integration.id === "webhook");

  assert.equal(twilio.derived_status, "failed");
  assert.equal(twilio.recent_failure_count, 1);
  assert.equal(resend.derived_status, "configured");
  assert.equal(resend.recent_activity_count, 1);
  assert.equal(webhook.derived_status, "configured");
  assert.equal(snapshot.system.messages_tracked, 2);
  assert.equal(snapshot.system.success_rate_percent, 50);
  assert.equal(snapshot.system.uptime.available, false);
});

test("integration health marks unconfigured providers as not configured instead of guessing health", () => {
  const snapshot = deriveIntegrationHealth({
    settings: {
      twilio_enabled: false,
      resend_enabled: false,
      webhook_enabled: false,
    },
    events: [],
  });

  snapshot.integrations.forEach((integration) => {
    assert.equal(integration.derived_status, "not_configured");
    assert.ok(integration.missing_configuration.length > 0);
  });

  assert.equal(snapshot.system.messages_tracked, 0);
  assert.equal(snapshot.system.success_rate_percent, null);
});
