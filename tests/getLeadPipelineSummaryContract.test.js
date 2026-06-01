import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("getLeadPipelineSummary delegates to the canonical rich pipeline snapshot builder", () => {
  const source = fs.readFileSync("base44/functions/getLeadPipelineSummary/entry.ts", "utf8");

  assert.match(source, /buildLeadPipelineSnapshot/);
  assert.match(source, /LEAD_PIPELINE_MAX_FETCH/);
  assert.doesNotMatch(source, /function getNextAction/);
  assert.match(source, /CommunicationEvent\.list/);
  assert.match(source, /data_window/);
});
