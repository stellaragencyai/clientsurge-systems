import test from "node:test";
import assert from "node:assert/strict";

import {
  findDuplicateWebsiteLead,
  isDisposableEmail,
  normalizeEmail,
  normalizePhone,
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

test("submitLeadCapture blocks disposable email domains after normalization", () => {
  assert.equal(normalizeEmail("  PERSON@Mailinator.com "), "person@mailinator.com");
  assert.equal(isDisposableEmail("PERSON@Mailinator.com"), true);
  assert.equal(isDisposableEmail("person@realbusiness.com"), false);
});
