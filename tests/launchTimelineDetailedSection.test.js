import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync("src/components/landing/coreOffer/LaunchTimeline.jsx", "utf8");

test("launch timeline keeps the comprehensive detailed step section", () => {
  assert.match(source, /Detailed vertical timeline with alternating image\/content/);
  assert.match(source, /launchTimelineSteps\.map\(\(step, idx\) => \(\s*<StepRow key=\{step\.id\} step=\{step\} idx=\{idx\} \/>/);
  assert.match(source, /\{\.\.\.imageProps\}/);
});
