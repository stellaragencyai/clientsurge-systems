import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const stagingDoc = readFileSync(
  new URL("../docs/STAGING_ENVIRONMENT.md", import.meta.url),
  "utf8"
);
const readmeEnv = readFileSync(
  new URL("../docs/README_ENV.md", import.meta.url),
  "utf8"
);
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("staging runbook requires Base44 test database for pre-launch QA", () => {
  assert.match(stagingDoc, /Base44 test database \/ test workspace/i);
  assert.match(stagingDoc, /Production Base44, live Stripe, real SMS, real customer email/i);
  assert.match(stagingDoc, /approval-sensitive/i);
});

test("staging runbook defines provider-safe test surfaces", () => {
  for (const required of [
    "Stripe test mode",
    "Resend test-safe recipients",
    "Twilio test credentials",
    "persist_records: false",
    "dry_run",
    "preview_only",
  ]) {
    assert.match(stagingDoc, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("environment docs and README link staging before release or provider tests", () => {
  assert.match(readmeEnv, /docs\/STAGING_ENVIRONMENT\.md/);
  assert.match(readmeEnv, /Base44 test database \/ test workspace/i);
  assert.match(readme, /docs\/STAGING_ENVIRONMENT\.md/);
});
