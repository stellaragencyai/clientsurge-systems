import test from "node:test";
import assert from "node:assert/strict";

import {
  createLeadCaptureRateLimiter,
  findDuplicateWebsiteLead,
  isDisposableEmail,
  normalizeEmail,
  normalizePhone,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  SIXTY_MINUTES,
} from "../base44/functions/submitLeadCapture/leadCapture.shared.js";

const NOW = Date.parse("2026-05-20T22:30:00.000Z");

test("submitLeadCapture dedup window includes exactly 60 minutes", () => {
  const duplicate = findDuplicateWebsiteLead({
    nowMs: NOW,
    email: "lead@example.com",
    phone: "",
    leads: [
      {
        id: "lead-exact-boundary",
        email: "lead@example.com",
        created_date: new Date(NOW - SIXTY_MINUTES).toISOString(),
      },
    ],
  });

  assert.equal(duplicate.id, "lead-exact-boundary");
});

test("submitLeadCapture dedup window excludes leads older than 60 minutes", () => {
  const duplicate = findDuplicateWebsiteLead({
    nowMs: NOW,
    email: "lead@example.com",
    phone: "",
    leads: [
      {
        id: "lead-older",
        email: "lead@example.com",
        created_date: new Date(NOW - SIXTY_MINUTES - 1).toISOString(),
      },
    ],
  });

  assert.equal(duplicate, null);
});

test("submitLeadCapture deduplicates by normalized phone inside the 60-minute window", () => {
  const duplicate = findDuplicateWebsiteLead({
    nowMs: NOW,
    email: "",
    phone: normalizePhone("(602) 555-0199"),
    leads: [
      {
        id: "lead-phone",
        phone_number: "+1 602-555-0199",
        created_date: new Date(NOW - 10 * 60 * 1000).toISOString(),
      },
    ],
  });

  assert.equal(duplicate.id, "lead-phone");
});

test("submitLeadCapture normalizes US phone numbers to E.164", () => {
  assert.equal(normalizePhone("(602) 555-0199"), "+16025550199");
  assert.equal(normalizePhone("1-602-555-0199"), "+16025550199");
  assert.equal(normalizePhone("+1 602 555 0199"), "+16025550199");
});

test("submitLeadCapture rejects phone numbers shorter than 10 digits", () => {
  assert.equal(normalizePhone("602-555-019"), "");
  assert.equal(normalizePhone("5550199"), "");
});

test("submitLeadCapture blocks disposable email domains after normalization", () => {
  assert.equal(normalizeEmail("  PERSON@Mailinator.com "), "person@mailinator.com");
  assert.equal(isDisposableEmail("PERSON@Mailinator.com"), true);
  assert.equal(isDisposableEmail("person@realbusiness.com"), false);
});

test("submitLeadCapture rate limits after 3 submissions per IP per hour", () => {
  let now = NOW;
  const limiter = createLeadCaptureRateLimiter({ now: () => now });
  const ip = "203.0.113.42";

  for (let attempt = 0; attempt < RATE_LIMIT_MAX; attempt += 1) {
    assert.equal(limiter.isRateLimited(ip), false);
  }

  assert.equal(limiter.isRateLimited(ip), true);

  now += RATE_LIMIT_WINDOW_MS + 1;
  assert.equal(limiter.isRateLimited(ip), false);
});

test("submitLeadCapture rate limiting is scoped per normalized IP", () => {
  const limiter = createLeadCaptureRateLimiter({ now: () => NOW });

  for (let attempt = 0; attempt < RATE_LIMIT_MAX; attempt += 1) {
    assert.equal(limiter.isRateLimited("203.0.113.42"), false);
  }

  assert.equal(limiter.isRateLimited("203.0.113.42"), true);
  assert.equal(limiter.isRateLimited("198.51.100.10"), false);
  assert.equal(limiter.isRateLimited("   "), false);
  assert.equal(limiter.isRateLimited("unknown"), false);
  assert.equal(limiter.isRateLimited("unknown"), false);
  assert.equal(limiter.isRateLimited("unknown"), true);
});
