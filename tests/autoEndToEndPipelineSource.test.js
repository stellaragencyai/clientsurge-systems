import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const autoEndToEndSource = readFileSync(
  new URL("../base44/functions/autoEndToEndTest/entry.ts", import.meta.url),
  "utf8"
);

const runFullPipelineSource = readFileSync(
  new URL("../base44/functions/runFullPipelineTest/entry.ts", import.meta.url),
  "utf8"
);

test("autoEndToEndTest is admin gated and delegates a quiet cleanup-by-default E2E run", () => {
  assert.match(autoEndToEndSource, /requireAdminUser/);
  assert.match(autoEndToEndSource, /AuthGuardError/);
  assert.match(autoEndToEndSource, /"runFullPipelineTest"/);
  assert.match(autoEndToEndSource, /persist_records:\s*false/);
  assert.match(autoEndToEndSource, /notify_telegram:\s*false/);
  assert.match(autoEndToEndSource, /scenario:\s*"lead_order_activate"/);
});

test("runFullPipelineTest uses canonical lead and checkout order data instead of legacy SpaLead", () => {
  assert.doesNotMatch(runFullPipelineSource, /SpaLead/);
  assert.match(runFullPipelineSource, /entities\.Leads\.create/);
  assert.match(runFullPipelineSource, /getPackageServices/);
  assert.match(runFullPipelineSource, /buildPricingSummaryForProducts/);
  assert.match(runFullPipelineSource, /buildStoredPricingSummary/);
  assert.match(runFullPipelineSource, /normalizeInstallConfiguration/);
  assert.match(runFullPipelineSource, /initializePaidOrderInstallPipeline/);
  assert.match(runFullPipelineSource, /customer_email/);
  assert.match(runFullPipelineSource, /pricing_summary/);
});

test("runFullPipelineTest cleans fixtures by default and makes Telegram reporting opt-in", () => {
  assert.match(runFullPipelineSource, /persist_records\s*=\s*false/);
  assert.match(runFullPipelineSource, /cleanupRecords/);
  assert.match(runFullPipelineSource, /cleaned_up:\s*!persist_records/);
  assert.match(runFullPipelineSource, /notify_telegram\s*=\s*false/);
  assert.match(runFullPipelineSource, /if\s*\(notify_telegram && botToken\)/);
});
