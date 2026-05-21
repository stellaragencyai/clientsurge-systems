import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scheduleDemoBooking = readFileSync(
  new URL("../base44/functions/scheduleDemoBooking/entry.ts", import.meta.url),
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

test("scheduleDemoBooking enforces date availability and optimistic slot locks before confirming", () => {
  assert.match(scheduleDemoBooking, /assertBookingDateAvailable/);
  assert.match(scheduleDemoBooking, /status:\s*409/);
  assert.match(scheduleDemoBooking, /status:\s*error\.status \|\| 500/);

  const firstLock = scheduleDemoBooking.indexOf("await optimisticLockSlot(base44, payload.scheduled_date, payload.scheduled_time);");
  const ensureRequest = scheduleDemoBooking.indexOf("await ensureDemoRequest(base44, lead.id, payload);");
  assert.ok(firstLock > -1, "expected optimistic lock call");
  assert.ok(firstLock < ensureRequest, "expected optimistic lock before creating the DemoRequest");
});

test("demoBookingGuard entry reuses the shared booking-date guard", () => {
  assert.match(demoBookingGuard, /from "\.\.\/shared\/demoBookingGuard\.ts"/);
  assert.doesNotMatch(demoBookingGuard, /getUTCDay/);
});

test("getBookedDemoSlots queries by scheduled date with a bounded daily result set", () => {
  assert.match(getBookedDemoSlots, /const \{ date \} = await req\.json\(\);/);
  assert.match(getBookedDemoSlots, /scheduled_date:\s*date/);
  assert.match(getBookedDemoSlots, /status:\s*\{\s*\$in:\s*\['requested', 'scheduled', 'confirmed'\]\s*\}/);
  assert.match(getBookedDemoSlots, /'-created_date',\s*50/);
  assert.doesNotMatch(getBookedDemoSlots, /DemoRequest\.list/);
});
