import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const welcomeBanner = readFileSync(
  new URL("../src/components/dashboard/WelcomeBanner.jsx", import.meta.url),
  "utf8"
);

const dashboardHeader = readFileSync(
  new URL("../src/components/dashboard/DashboardHeader.jsx", import.meta.url),
  "utf8"
);

test("client dashboard hero forces readable white text over the dark gradient", () => {
  assert.match(welcomeBanner, /WebkitTextFillColor:\s*"#ffffff"/);
  assert.match(welcomeBanner, /backgroundImage:\s*"none"/);
  assert.match(welcomeBanner, /rgba\(255,255,255,0\.82\)/);
});

test("proof-gated live services remain counted as verification in progress", () => {
  assert.match(dashboardHeader, /verificationInProgressCount = isProofLive \? 0 : rawLiveCount/);
  assert.match(dashboardHeader, /inProgressCount = buildInProgressCount \+ verificationInProgressCount/);
  assert.match(dashboardHeader, /Verification Running/);
});

test("client dashboard avoids internal truth-gate and fake-status language", () => {
  assert.match(dashboardHeader, /Verification Safeguard/);
  assert.match(dashboardHeader, /marks systems live only after checks pass/);
  assert.doesNotMatch(dashboardHeader, /Truth Gate/);
  assert.doesNotMatch(dashboardHeader, /fake live status/);
});
