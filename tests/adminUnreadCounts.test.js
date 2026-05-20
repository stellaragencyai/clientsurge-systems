import test from "node:test";
import assert from "node:assert/strict";

import {
  countWebhookErrorEvents,
  isWebhookErrorEvent,
} from "../src/lib/adminUnreadCounts.js";

test("admin webhook error badge counts only failed webhook-related events", () => {
  const events = [
    { status: "failed", channel: "webhook", event_type: "workflow_triggered" },
    { status: "failed", channel: "internal", event_type: "webhook_error" },
    { status: "failed", channel: "email", context_type: "stripe_webhook" },
    { status: "sent", channel: "webhook", event_type: "webhook_sent" },
    { status: "failed", channel: "sms", event_type: "sms_failed" },
  ];

  assert.equal(countWebhookErrorEvents(events), 3);
});

test("admin webhook error badge ignores non-failed events", () => {
  assert.equal(isWebhookErrorEvent({ status: "processed", channel: "webhook" }), false);
  assert.equal(isWebhookErrorEvent({ status: "failed", channel: "webhook" }), true);
});
