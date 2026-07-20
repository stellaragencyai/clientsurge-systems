import assert from "node:assert/strict";
import test from "node:test";
import { validateUnifiedPlatformIntegration } from "../validate-unified-platform-integration.mjs";

test("Phase H unified platform integration validator passes", () => {
  const report = validateUnifiedPlatformIntegration();

  assert.equal(report.ok, true);
  assert.equal(report.summary.phaseBModules, 5);
  assert.equal(report.summary.phaseCSystems, 4);
  assert.equal(report.summary.phaseDRoutes, 10);
  assert.equal(report.summary.phaseERoutes, 10);
  assert.ok(report.summary.platformRoutes >= 40);
  assert.deepEqual(report.summary.viewports, [1440, 1280, 1024, 768, 390, 375]);
});
