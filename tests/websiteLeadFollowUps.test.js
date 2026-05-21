import test from "node:test";
import assert from "node:assert/strict";

import {
  getDueWebsiteLeadFollowUpSteps,
  getNextDueWebsiteLeadFollowUpStep,
  shouldStopWebsiteLeadFollowUp,
  WEBSITE_LEAD_FOLLOW_UP_STEPS,
} from "../base44/functions/_shared/websiteLeadFollowUps.js";

const NOW = Date.parse("2026-05-20T18:00:00.000Z");

test("website lead follow-up schedule uses 10min SMS, 1hr email, and 24hr SMS", () => {
  assert.deepEqual(
    WEBSITE_LEAD_FOLLOW_UP_STEPS.map(({ step, minutesAfter, channel, key }) => ({
      step,
      minutesAfter,
      channel,
      key,
    })),
    [
      { step: 1, minutesAfter: 10, channel: "sms", key: "website_follow_sms_10min" },
      { step: 2, minutesAfter: 60, channel: "email", key: "website_follow_email_1hr" },
      { step: 3, minutesAfter: 1440, channel: "sms", key: "website_follow_sms_24hr" },
    ]
  );
});

test("website lead follow-up due steps respect elapsed time", () => {
  assert.deepEqual(
    getDueWebsiteLeadFollowUpSteps(
      { initial_response_sent_at: "2026-05-20T17:45:00.000Z" },
      NOW
    ).map((step) => step.step),
    [1]
  );

  assert.deepEqual(
    getDueWebsiteLeadFollowUpSteps(
      { initial_response_sent_at: "2026-05-20T16:00:00.000Z" },
      NOW
    ).map((step) => step.step),
    [1, 2]
  );

  assert.deepEqual(
    getDueWebsiteLeadFollowUpSteps(
      { initial_response_sent_at: "2026-05-19T17:00:00.000Z" },
      NOW
    ).map((step) => step.step),
    [1, 2, 3]
  );
});

test("website lead follow-ups stop after replies, bookings, closed leads, or paused cadence", () => {
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "contacted", reply_status: "responded", booking_status: "none" }), true);
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "contacted", reply_status: "none", booking_status: "booked" }), true);
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "closed", reply_status: "none", booking_status: "none" }), true);
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "contacted", reply_status: "none", booking_status: "none", cadence_paused: true }), true);
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "contacted", reply_status: "none", booking_status: "none", automation_enabled: false }), true);
  assert.equal(shouldStopWebsiteLeadFollowUp({ lead_status: "contacted", reply_status: "none", booking_status: "none", automation_enabled: true }), false);
});

test("website lead follow-up processor chooses only the next due unsent step", () => {
  assert.equal(
    getNextDueWebsiteLeadFollowUpStep(
      {
        initial_response_sent_at: "2026-05-20T16:00:00.000Z",
        follow_up_step: 0,
      },
      NOW
    ).step,
    1
  );

  assert.equal(
    getNextDueWebsiteLeadFollowUpStep(
      {
        initial_response_sent_at: "2026-05-20T16:00:00.000Z",
        follow_up_step: 1,
      },
      NOW
    ).step,
    2
  );

  assert.equal(
    getNextDueWebsiteLeadFollowUpStep(
      {
        initial_response_sent_at: "2026-05-20T17:55:00.000Z",
        follow_up_step: 0,
      },
      NOW
    ),
    null
  );
});
