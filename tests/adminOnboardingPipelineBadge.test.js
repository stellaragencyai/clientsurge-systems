import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const card = readFileSync(
  new URL("../src/components/admin/onboarding/ClientOnboardingCard.jsx", import.meta.url),
  "utf8"
);
const schema = readFileSync(
  new URL("../base44/entities/OnboardingClient.jsonc", import.meta.url),
  "utf8"
);

test("admin onboarding client cards render the canonical pipeline status badge", () => {
  assert.match(card, /PipelineStatusBadge/);
  assert.match(card, /order\?\.pipeline_status \|\| client\.pipeline_status \|\| client\.status/);
  assert.match(card, /<PipelineStatusBadge status=\{pipelineStatus\}/);
});

test("onboarding client schema can store mirrored pipeline status", () => {
  assert.match(schema, /"pipeline_status"/);
  assert.match(schema, /"Canonical Install Pipeline Status"/);
});
