import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFailedSendRetryJob,
  buildRetrySchedulePatch,
  getRetryDelayMinutes,
  isAutomationJobDue,
  shouldRetryAutomationJob,
} from "../base44/functions/_shared/automationRetry.js";

test("automation retry uses 1, 5, and 30 minute backoff windows", () => {
  assert.equal(getRetryDelayMinutes(0), 1);
  assert.equal(getRetryDelayMinutes(1), 5);
  assert.equal(getRetryDelayMinutes(2), 30);
  assert.equal(shouldRetryAutomationJob(2), true);
  assert.equal(shouldRetryAutomationJob(3), false);
});

test("automation retry patch requeues before final failure", () => {
  const now = new Date("2026-05-20T20:00:00.000Z");
  const patch = buildRetrySchedulePatch({ attempts: 1, error: "Twilio 500", now });

  assert.equal(patch.status, "queued");
  assert.equal(patch.attempts, 2);
  assert.equal(patch.last_error, "Twilio 500");
  assert.equal(patch.scheduled_for, "2026-05-20T20:05:00.000Z");
});

test("automation retry patch marks final failed after max attempts", () => {
  const now = new Date("2026-05-20T20:00:00.000Z");
  const patch = buildRetrySchedulePatch({ attempts: 3, error: "Resend 500", now });

  assert.equal(patch.status, "failed");
  assert.equal(patch.attempts, 3);
  assert.equal(patch.processed_at, "2026-05-20T20:00:00.000Z");
});

test("failed send retry job stores channel payload and first retry time", () => {
  const now = new Date("2026-05-20T20:00:00.000Z");
  const job = buildFailedSendRetryJob({
    lead: { id: "lead_1" },
    channel: "email",
    subject: "Follow-up",
    message: "Body",
    step: 2,
    stepKey: "website_follow_email_1hr",
    now,
  });
  const metadata = JSON.parse(job.result_metadata);

  assert.equal(job.job_type, "confirmation_email");
  assert.equal(job.status, "queued");
  assert.equal(job.scheduled_for, "2026-05-20T20:01:00.000Z");
  assert.equal(metadata.step_key, "website_follow_email_1hr");
  assert.equal(metadata.message, "Body");
});

test("automation job due check respects scheduled_for", () => {
  const now = new Date("2026-05-20T20:00:00.000Z");

  assert.equal(isAutomationJobDue({ status: "queued" }, now), true);
  assert.equal(isAutomationJobDue({ status: "failed" }, now), false);
  assert.equal(isAutomationJobDue({ status: "queued", scheduled_for: "2026-05-20T19:59:00.000Z" }, now), true);
  assert.equal(isAutomationJobDue({ status: "queued", scheduled_for: "2026-05-20T20:01:00.000Z" }, now), false);
});
