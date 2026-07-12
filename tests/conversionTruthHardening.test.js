import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const bookingSource = read("base44/functions/scheduleDemoBooking/main.ts");
const bookingEntry = read("base44/functions/scheduleDemoBooking/entry.ts");
const calendarSource = read("base44/functions/createDemoCalendarEvent/main.ts");
const calendarEntry = read("base44/functions/createDemoCalendarEvent/entry.ts");
const contactSource = read("base44/functions/submitContactInquiry/main.ts");

test("audit booking records a pending request rather than a fake confirmed appointment", () => {
  assert.match(bookingSource, /status:\s*["']requested["']/);
  assert.match(bookingSource, /request_status:\s*["']requested["']/);
  assert.match(bookingSource, /calendar_created:\s*false/);
  assert.match(bookingSource, /America\/Phoenix/);
  assert.match(bookingSource, /pending manual confirmation/i);
  assert.doesNotMatch(bookingSource, /entities\.Leads\.update\([^)]*,\s*\{[^}]*status:\s*["']Booked["']/s);
  assert.doesNotMatch(bookingSource, /crm_stage:\s*["']Audit Booked["']/);
  assert.doesNotMatch(bookingSource, /functions\.invoke\(["']createDemoCalendarEvent["']/);
});

test("legacy entry points cannot drift away from the canonical booking handler", () => {
  assert.match(bookingEntry, /import\s+["']\.\/main\.ts["']/);
  assert.match(calendarEntry, /import\s+["']\.\/main\.ts["']/);
});

test("calendar placeholder fails honestly instead of mutating CRM state", () => {
  assert.match(calendarSource, /CALENDAR_PROVIDER_NOT_CONFIGURED/);
  assert.match(calendarSource, /calendar_created:\s*false/);
  assert.match(calendarSource, /status:\s*501/);
  assert.doesNotMatch(calendarSource, /entities\.Leads\.update/);
  assert.doesNotMatch(calendarSource, /Calendar event created/);
});

test("contact inquiries upsert the canonical CRM lead", () => {
  assert.match(contactSource, /findExistingCanonicalLead/);
  assert.match(contactSource, /website_lead_id:\s*websiteLeadId/);
  assert.match(contactSource, /existing\s*\?\s*await\s+base44\.asServiceRole\.entities\.Leads\.update/s);
  assert.match(contactSource, /:\s*await\s+base44\.asServiceRole\.entities\.Leads\.create/s);
  assert.match(contactSource, /source_history:\s*mergeSourceHistory/);
  assert.match(contactSource, /dedupe_key:/);
  assert.match(contactSource, /canonical_lead_id:/);
  assert.doesNotMatch(
    contactSource,
    /const\s+canonicalLead\s*=\s*await\s+base44\.asServiceRole\.entities\.Leads\.create/,
  );
});

test("advanced CRM stages are protected from contact-form downgrades", () => {
  assert.match(contactSource, /function\s+isAdvancedLead/);
  assert.match(contactSource, /Audit Booked/);
  assert.match(contactSource, /Proposal Sent/);
  assert.match(contactSource, /Won Pending Payment/);
  assert.match(contactSource, /else\s+if\s*\(!advanced\)/);
});
