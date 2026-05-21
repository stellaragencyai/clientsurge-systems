import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const LOGGER_SOURCE = "base44/functions/shared/logger.ts";

test("shared function logger emits the standardized message and context shape", () => {
  const source = readFileSync(LOGGER_SOURCE, "utf8");

  assert.match(source, /Format: \[functionName\] message \{context\}/);
  assert.match(source, /export function formatLogMessage/);
  assert.match(source, /return `\[\$\{functionName\}\] \$\{message\}`;/);
  assert.match(source, /console\[level\]\(formattedMessage, ctx\)/);
  assert.doesNotMatch(source, /JSON\.stringify\(ctx\)/);
  assert.equal(/[^\x00-\x7F]/.test(source), false);
});

test("known unprefixed function console messages were normalized", () => {
  const samples = [
    {
      file: "base44/functions/analyzeReplySentiment/entry.ts",
      expected: "[analyzeReplySentiment] analyzeReplySentiment:",
    },
    {
      file: "base44/functions/routeLead/entry.ts",
      expected: "[routeLead] routeLead:",
    },
    {
      file: "base44/functions/onLeadCreated/entry.ts",
      expected: "[onLeadCreated] Webhook failed",
    },
    {
      file: "base44/functions/processCallRecording/entry.ts",
      expected: "[processCallRecording] processCallRecording:",
    },
  ];

  for (const sample of samples) {
    assert.match(readFileSync(sample.file, "utf8"), new RegExp(sample.expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
