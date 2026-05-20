import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const commandBarSource = readFileSync(
  new URL("../src/components/admin/AdminAICommandBar.jsx", import.meta.url),
  "utf8"
);
const dashboardSource = readFileSync(
  new URL("../src/pages/AdminDashboard.jsx", import.meta.url),
  "utf8"
);

test("admin AI command bar routes natural language to safe backend actions", () => {
  assert.match(commandBarSource, /resolveCommand/);
  assert.match(commandBarSource, /getAutomationStatus/);
  assert.match(commandBarSource, /runWinBackSequence", \{ dry_run: true \}/);
  assert.match(commandBarSource, /fetchLeadPipelineSummary/);
  assert.match(commandBarSource, /testProviderConnections", \{ dry_run: true \}/);
});

test("admin AI command bar is mounted on the admin overview", () => {
  assert.match(dashboardSource, /AdminAICommandBar/);
  assert.match(dashboardSource, /<AdminAICommandBar \/>/);
});
