import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scheduleDemoBooking = readFileSync(
  new URL("../base44/functions/scheduleDemoBooking/main.ts", import.meta.url),
  "utf8"
);
const demoBookingGuard = readFileSync(
  new URL("../base44/functions/demoBookingGuard/entry.ts", import.meta.url),
  "utf8"
);
const getBookedDemoSlots = readFileSync(
  new URL("../base44/functions/getBookedDemoSlots/entry.ts", import.meta.url),
  "utf8"
);

test("scheduleDemoBooking protects preferred slots before creating a request", () => {
  assert.match(scheduleDemoBooking, /MAX_REQUESTS_PER_DAY = 8/);
  assert.match(scheduleDemoBooking, /reserveRequestedSlot/);
  assert.match(scheduleDemoBooking, /That preferred time is no longer available/);
  assert.match(scheduleDemoBooking, /No more audit requests are available on that date/);
  assert.match(scheduleDemoBooking, /status:\s*409/);

  const slotQuery = scheduleDemoBooking.indexOf("entities.DemoRequest.filter");
  const requestCreate = scheduleDemoBooking.indexOf("entities.DemoRequest.create");
  assert.ok(slotQuery > -1, "expected bounded slot query");
  assert.ok(requestCreate > -1, "expected DemoRequest creation");
  assert.ok(slotQuery < requestCreate, "expected slot query before request creation");
});

test("scheduleDemoBooking records engaged CRM state without claiming a confirmed booking", () => {
  assert.match(scheduleDemoBooking, /intake_type:\s*"audit_time_request"/);
  assert.match(scheduleDemoBooking, /crm_stage = "Replied"|leadData\.crm_stage = "Replied"/);
  assert.match(scheduleDemoBooking, /outreach_status = existing\?\.do_not_contact \? "do_not_contact" : "replied"/);
  assert.match(scheduleDemoBooking, /source_page: payload\.source_page/);
  assert.match(scheduleDemoBooking, /website_url: payload\.website/);
  assert.match(scheduleDemoBooking, /Preferred audit time received/);
  assert.doesNotMatch(scheduleDemoBooking, /crm_stage:\s*"Audit Booked"/);
  assert.doesNotMatch(scheduleDemoBooking, /booked_at:\s*now/);
});

test("demoBookingGuard entry reuses the shared booking-date guard", () => {
  assert.match(demoBookingGuard, /from "\.\.\/shared\/demoBookingGuard\.ts"/);
  assert.doesNotMatch(demoBookingGuard, /getUTCDay/);
});

test("getBookedDemoSlots treats pending and scheduled requests as unavailable", () => {
  assert.match(getBookedDemoSlots, /const \{ date \} = await req\.json\(\);/);
  assert.match(getBookedDemoSlots, /scheduled_date:\s*date/);
  assert.match(getBookedDemoSlots, /status:\s*\{\s*\$in:\s*\['requested', 'scheduled', 'confirmed'\]\s*\}/);
  assert.match(getBookedDemoSlots, /'-created_date',\s*50/);
  assert.doesNotMatch(getBookedDemoSlots, /DemoRequest\.list/);
});
