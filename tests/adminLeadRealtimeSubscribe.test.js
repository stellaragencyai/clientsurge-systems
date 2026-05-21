import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(
  new URL("../src/components/admin/LeadManagementDashboard.jsx", import.meta.url),
  "utf8"
);
const leadPipelineApi = readFileSync(
  new URL("../src/lib/leadPipelineApi.js", import.meta.url),
  "utf8"
);

test("admin lead pipeline API subscribes to canonical Leads changes", () => {
  assert.match(leadPipelineApi, /subscribeToLeadPipelineChanges/);
  assert.match(leadPipelineApi, /base44\.entities\?\.Leads\?\.subscribe/);
  assert.match(leadPipelineApi, /\["create", "update", "delete"\]\.includes\(event\?\.type\)/);
  assert.match(leadPipelineApi, /subscription\?\.unsubscribe\?\.\(\)/);
});

test("active admin leads dashboard refreshes from the real-time subscription", () => {
  assert.match(dashboard, /subscribeToLeadPipelineChanges/);
  assert.match(dashboard, /onChange:\s*\(\)\s*=>\s*loadSnapshot/);
  assert.match(dashboard, /activeFilters:\s*filters/);
  assert.match(dashboard, /return \(\)\s*=>\s*unsubscribe\?\.\(\)/);
});
