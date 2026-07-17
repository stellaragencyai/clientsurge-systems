import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const getBrokenFlows = fs.readFileSync("base44/functions/getBrokenFlows/main.ts", "utf8");
const repairBrokenFlow = fs.readFileSync("base44/functions/repairBrokenFlow/main.ts", "utf8");
const brokenFlowsUi = fs.readFileSync("src/pages/admin/BrokenFlows.jsx", "utf8");

test("broken flow diagnostics return request IDs and source coverage", () => {
  assert.match(getBrokenFlows, /X-Request-ID/);
  assert.match(getBrokenFlows, /request_id: requestId/);
  assert.match(getBrokenFlows, /function buildCoverage/);
  assert.match(getBrokenFlows, /sources_expected/);
  assert.match(getBrokenFlows, /status === "verified"/);
  assert.match(getBrokenFlows, /scan_incomplete/);
});

test("healthy result requires complete diagnostic coverage", () => {
  assert.match(getBrokenFlows, /flows\.length === 0 && coverage\.status === "verified"/);
  assert.match(getBrokenFlows, /No failures found, but the scan is incomplete/);
});

test("repair endpoint requires explicit confirmation", () => {
  assert.match(repairBrokenFlow, /CONFIRMATION_TEXT = "REPAIR BROKEN FLOW"/);
  assert.match(repairBrokenFlow, /confirmation_required/);
  assert.match(repairBrokenFlow, /confirmation !== CONFIRMATION_TEXT/);
});

test("repair endpoint blocks immediate duplicate mutations", () => {
  assert.match(repairBrokenFlow, /DUPLICATE_GUARD_MS = 5 \* 60 \* 1000/);
  assert.match(repairBrokenFlow, /duplicate_repair_guard/);
  assert.match(repairBrokenFlow, /retry_after_seconds/);
  assert.match(repairBrokenFlow, /last_repair_action/);
  assert.match(repairBrokenFlow, /last_repair_at/);
});

test("admin UI displays trust and confirms production repairs", () => {
  assert.match(brokenFlowsUi, /Diagnostic coverage:/);
  assert.match(brokenFlowsUi, /window\.confirm/);
  assert.match(brokenFlowsUi, /confirmation: REPAIR_CONFIRMATION/);
  assert.match(brokenFlowsUi, /Retry after/);
  assert.match(brokenFlowsUi, /flow\.repairable/);
});
