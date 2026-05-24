import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("final area audit reads the current SEO conversion audit score field", () => {
  const source = readFileSync(new URL("../scripts/final-area-audit.mjs", import.meta.url), "utf8");

  assert.match(source, /score: audit\.effectiveness_score_out_of_10/);
  assert.doesNotMatch(source, /score: audit\.score/);
});
