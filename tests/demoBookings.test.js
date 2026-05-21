import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DEMO_BOOKING_ACTIONS,
  filterDemoBookingsByStatus,
  formatDemoBookingDateTime,
  normalizeDemoBookingStatus,
} from "../src/lib/demoBookings.js";

const adminDashboard = readFileSync(
  new URL("../src/pages/AdminDashboard.jsx", import.meta.url),
  "utf8"
);
const demoBookingsTab = readFileSync(
  new URL("../src/components/admin/AdminDemoBookingsTab.jsx", import.meta.url),
  "utf8"
);

test("demo booking statuses normalize legacy labels into canonical values", () => {
  assert.equal(normalizeDemoBookingStatus("Pending"), "requested");
  assert.equal(normalizeDemoBookingStatus("Booked"), "scheduled");
  assert.equal(normalizeDemoBookingStatus("No Show"), "no_show");
  assert.equal(normalizeDemoBookingStatus("No-Show"), "no_show");
  assert.equal(normalizeDemoBookingStatus("Reschedule"), "rescheduled");
  assert.equal(normalizeDemoBookingStatus("unknown"), "requested");
});

test("demo booking filters use normalized status values", () => {
  const demos = [
    { id: "demo_1", status: "Completed" },
    { id: "demo_2", status: "no_show" },
    { id: "demo_3", status: "scheduled" },
  ];

  assert.deepEqual(filterDemoBookingsByStatus(demos, "all").map((demo) => demo.id), [
    "demo_1",
    "demo_2",
    "demo_3",
  ]);
  assert.deepEqual(filterDemoBookingsByStatus(demos, "completed").map((demo) => demo.id), ["demo_1"]);
  assert.deepEqual(filterDemoBookingsByStatus(demos, "no_show").map((demo) => demo.id), ["demo_2"]);
});

test("demo booking actions cover complete no-show and reschedule", () => {
  assert.deepEqual(
    DEMO_BOOKING_ACTIONS.map((action) => action.value),
    ["completed", "no_show", "rescheduled"]
  );
});

test("demo booking date formatter shows scheduled time without parsing it as local midnight", () => {
  assert.equal(
    formatDemoBookingDateTime({ scheduled_date: "2026-05-21", scheduled_time: "10:30 AM" }, "en-US"),
    "May 21, 2026 at 10:30 AM"
  );
  assert.equal(formatDemoBookingDateTime({}, "en-US"), "Not scheduled");
});

test("admin dashboard exposes the demo bookings tab", () => {
  assert.match(adminDashboard, /AdminDemoBookingsTab/);
  assert.match(adminDashboard, /id: 'demo-bookings'/);
  assert.match(adminDashboard, /case 'demo-bookings': return <AdminDemoBookingsTab \/>/);
});

test("demo bookings tab writes status_updated_at when status changes", () => {
  assert.match(demoBookingsTab, /DemoRequest\.list\("-created_date", 100\)/);
  assert.match(demoBookingsTab, /status_updated_at: new Date\(\)\.toISOString\(\)/);
  assert.match(demoBookingsTab, /DEMO_BOOKING_ACTIONS\.map/);
});
