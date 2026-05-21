import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(
  new URL("../src/components/admin/LeadManagementDashboard.jsx", import.meta.url),
  "utf8"
);
const rowModel = readFileSync(
  new URL("../src/lib/adminLeadLoadModel.js", import.meta.url),
  "utf8"
);

test("admin leads exposes a sortable lead score control", () => {
  assert.match(dashboard, /sortConfig,\s*setSortConfig/);
  assert.match(dashboard, /field:\s*"lead_score"/);
  assert.match(dashboard, /toggleLeadScoreSort/);
  assert.match(dashboard, /Sort by lead score/);
  assert.match(dashboard, /Score \{sortConfig\.field === "lead_score"/);
});

test("admin leads sorts visible rows by lead score direction", () => {
  assert.match(dashboard, /buildAdminLeadRows\(rawLeads, sortConfig\)/);
  assert.match(rowModel, /left\.lead_score \?\? -1/);
  assert.match(rowModel, /right\.lead_score \?\? -1/);
  assert.match(dashboard, /direction:\s*current\.field === "lead_score" && current\.direction === "desc" \? "asc" : "desc"/);
});
