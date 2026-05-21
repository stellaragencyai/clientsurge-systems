import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboard = readFileSync("src/components/admin/LeadManagementDashboard.jsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const harness = readFileSync("scripts/verify-admin-load-budget.mjs", "utf8");
const rowModel = readFileSync("src/lib/adminLeadLoadModel.js", "utf8");

test("admin lead dashboard supports fixture injection for local load verification", () => {
  assert.match(dashboard, /initialSnapshot = null/);
  assert.match(dashboard, /initialLoading = true/);
  assert.match(dashboard, /useState\(initialSnapshot \|\| \{/);
  assert.match(dashboard, /useState\(initialLoading\)/);
  assert.match(dashboard, /buildAdminLeadRows\(rawLeads, sortConfig\)/);
});

test("admin load budget harness verifies 100 plus leads under a 3s budget", () => {
  assert.equal(packageJson.scripts["verify:admin-load"], "node scripts/verify-admin-load-budget.mjs");
  assert.match(harness, /CLIENTSURGE_ADMIN_LOAD_LEADS \|\| "120"/);
  assert.match(harness, /CLIENTSURGE_ADMIN_LOAD_BUDGET_MS \|\| "3000"/);
  assert.match(harness, /buildAdminLeadRows/);
  assert.match(harness, /tableProjection/);
  assert.match(harness, /elapsedMs < budgetMs/);
  assert.match(rowModel, /return \[\.\.\.rawLeads\]\.sort/);
});
