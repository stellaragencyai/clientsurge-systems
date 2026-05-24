import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCheckinSchedule,
  buildClientCheckinEmail,
  buildClientCheckinJob,
  CLIENT_CHECKIN_JOB_TYPE,
  shouldScheduleClientCheckin,
} from "../base44/functions/_shared/clientCheckinScheduler.js";

test("client check-in only schedules on first live or active transition", () => {
  assert.equal(
    shouldScheduleClientCheckin({ status: "Live" }, { status: "Setup" }),
    true
  );
  assert.equal(
    shouldScheduleClientCheckin({ status: "Active" }, { status: "In Setup" }),
    true
  );
  assert.equal(
    shouldScheduleClientCheckin({ status: "Live" }, { status: "Live" }),
    false
  );
  assert.equal(
    shouldScheduleClientCheckin({ status: "Onboarding" }, { status: "Setup" }),
    false
  );
});

test("client check-in schedule is 30 days out with operator prep at day 28", () => {
  const schedule = buildCheckinSchedule(new Date("2026-05-21T12:00:00.000Z"));

  assert.equal(schedule.scheduled_for, "2026-06-20T12:00:00.000Z");
  assert.equal(schedule.operator_reminder_at, "2026-06-18T12:00:00.000Z");
});

test("client check-in job stores a delayed queued payload instead of immediate send state", () => {
  const plan = buildClientCheckinJob({
    entityId: "client_123",
    client: {
      id: "client_123",
      status: "Live",
      email: "owner@example.com",
      business_name: "Signal Spa",
      step_instant_response: true,
    },
    oldClient: { status: "Setup" },
    now: new Date("2026-05-21T12:00:00.000Z"),
  });

  assert.equal(plan.skipped, false);
  assert.equal(plan.job.job_type, CLIENT_CHECKIN_JOB_TYPE);
  assert.equal(plan.job.status, "queued");
  assert.equal(plan.job.scheduled_for, "2026-06-20T12:00:00.000Z");
  assert.equal(plan.job.context_type, "Client");
  assert.equal(plan.clientPatch.checkin_30_day_status, "queued");
});

test("client check-in email escapes client-provided values", () => {
  const html = buildClientCheckinEmail({
    client: {
      owner_name: "<script>alert(1)</script>",
      business_name: "Signal & Co",
    },
    activeSystems: ["Instant <SMS>"],
  });

  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("Signal &amp; Co"));
  assert.ok(html.includes("Instant &lt;SMS&gt;"));
});
