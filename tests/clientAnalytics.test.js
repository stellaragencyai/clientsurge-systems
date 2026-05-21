import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildClientAnalytics } from "../base44/functions/_shared/clientAnalytics.js";

test("client analytics builds portal and legacy metric shapes from real entities", () => {
  const result = buildClientAnalytics({
    now: new Date("2026-05-21T20:00:00.000Z"),
    periodDays: 30,
    orders: [
      {
        id: "order_1",
        payment_status: "paid",
        total_setup: 497,
        total_monthly: 199,
      },
      {
        id: "order_2",
        payment_status: "pending",
        total_setup: 999,
        total_monthly: 999,
      },
    ],
    leads: [
      { id: "lead_1", status: "Booked", created_date: "2026-05-20T12:00:00.000Z" },
      { id: "lead_2", status: "Qualified", created_date: "2026-05-18T12:00:00.000Z" },
      { id: "lead_3", status: "New", created_date: "2026-04-01T12:00:00.000Z" },
    ],
    events: [
      { id: "event_1", channel: "sms", event_type: "sms_sent", status: "sent", created_date: "2026-05-20T13:00:00.000Z" },
      { id: "event_2", channel: "email", event_type: "email_sent", status: "sent", created_date: "2026-05-20T13:10:00.000Z" },
      { id: "event_3", channel: "sms", event_type: "sms_failed", status: "failed", created_date: "2026-05-20T13:20:00.000Z" },
    ],
  });

  assert.equal(result.metrics.mrr, 199);
  assert.equal(result.metrics.arr, 2388);
  assert.equal(result.metrics.setup_revenue, 497);
  assert.equal(result.metrics.total_clients, 1);
  assert.equal(result.totals.totalLeads, 2);
  assert.equal(result.totals.bookedLeads, 1);
  assert.equal(result.totals.qualifiedLeads, 2);
  assert.equal(result.totals.responseRate, 100);
  assert.equal(result.totals.conversionRate, 50);
  assert.equal(result.totals.smsSent, 1);
  assert.equal(result.totals.emailSent, 1);
  assert.equal(result.totals.failedEvents, 1);
  assert.deepEqual(result.pipeline, [
    { status: "Booked", count: 1 },
    { status: "Qualified", count: 1 },
  ]);
});

test("getClientAnalytics source avoids legacy mock/placeholder entities", () => {
  const source = readFileSync("base44/functions/getClientAnalytics/entry.ts", "utf8");
  assert.doesNotMatch(source, /SpaLead/);
  assert.doesNotMatch(source, /ClientOnboarding/);
  assert.match(source, /entities\.Leads/);
  assert.match(source, /entities\.CommunicationEvent/);
  assert.match(source, /Authentication required/);
});
