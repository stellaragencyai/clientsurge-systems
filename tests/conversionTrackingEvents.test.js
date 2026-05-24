import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("analytics helper exposes the primary conversion event names", () => {
  const source = read("src/lib/analytics.js");

  assert.match(source, /export function trackLeadSubmitted/);
  assert.match(source, /trackEvent\("lead_submitted"/);
  assert.match(source, /export function trackDemoBooked/);
  assert.match(source, /trackEvent\("demo_booked"/);
  assert.match(source, /export function trackPurchase/);
  assert.match(source, /trackEvent\("purchase"/);
});

test("contact and booking success paths emit conversion events", () => {
  const contact = read("src/pages/Contact.jsx");
  const demoBooking = read("src/components/forms/DemoBookingInline.jsx");
  const orderSuccess = read("src/internal-pages/OrderSuccess.jsx");

  assert.match(contact, /trackLeadSubmitted\("contact_page"/);
  assert.match(demoBooking, /trackDemoBooked\("demo_booking_inline"/);
  assert.match(orderSuccess, /trackPurchase\(/);
});

test("weekly SEO content audit manifest stays review-first", () => {
  const manifest = JSON.parse(read("base44/automations/seo_content_weekly_audit.json"));

  assert.equal(manifest.id, "seo_content_weekly_audit");
  assert.equal(manifest.function, "generateSocialContent");
  assert.equal(manifest.trigger.event, "weekly_schedule");
  assert.match(manifest.task, /Do not auto-edit public Base44 page structure/);
  assert.match(manifest.task, /without approval/);
});
