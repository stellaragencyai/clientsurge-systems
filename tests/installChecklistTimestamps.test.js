import test from "node:test";
import assert from "node:assert/strict";

import { formatChecklistStepCompletedAt } from "../src/lib/installChecklistTimestamps.js";

test("install checklist timestamp helper formats valid completion timestamps", () => {
  const formatted = formatChecklistStepCompletedAt("2026-05-20T18:45:00.000Z", "en-US");

  assert.match(formatted, /May 20, 2026/);
});

test("install checklist timestamp helper hides missing or invalid values", () => {
  assert.equal(formatChecklistStepCompletedAt(null, "en-US"), null);
  assert.equal(formatChecklistStepCompletedAt("not-a-date", "en-US"), null);
});
