import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../base44/functions/submitClientChangeRequest/main.ts", import.meta.url),
  "utf8"
);
const onboardingWizard = readFileSync(
  new URL("../src/components/portal/ClientOnboardingWizard.jsx", import.meta.url),
  "utf8"
);
const planManager = readFileSync(
  new URL("../src/components/portal/PlanManager.jsx", import.meta.url),
  "utf8"
);

test("client change request function requires auth, ownership, and an allowed field list", () => {
  assert.match(source, /await requireAuthenticatedUser\(base44\)/);
  assert.match(source, /const TARGETS = \{/);
  assert.match(source, /ClientProject: new Set/);
  assert.match(source, /userOwnsTarget/);
  assert.match(source, /ClientChangeRequest\.create/);
});

test("client portal submits project intent instead of updating authoritative project records", () => {
  assert.match(onboardingWizard, /submitClientChangeRequest/);
  assert.doesNotMatch(onboardingWizard, /entities\.ClientProject\.update/);
  assert.match(planManager, /submitClientChangeRequest/);
  assert.doesNotMatch(planManager, /entities\.ClientProject\.update/);
});
