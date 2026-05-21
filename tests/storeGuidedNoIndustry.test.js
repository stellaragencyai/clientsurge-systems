import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storeSource = readFileSync("src/pages/Store.jsx", "utf8");

test("guided Store mode shows non-coming-soon products when no industry is selected", () => {
  assert.match(storeSource, /const \[selectedIndustry, setSelectedIndustry\] = useState\(null\);/);
  assert.match(storeSource, /const \[pathMode, setPathMode\] = useState\("guided"\);/);

  const guidedModeIndex = storeSource.indexOf('if (pathMode === "guided")');
  const returnIndex = storeSource.indexOf("return results;", guidedModeIndex);

  assert.ok(guidedModeIndex > -1, "guided mode filter still exists");
  assert.ok(returnIndex > guidedModeIndex, "guided mode returns filtered results");

  const guidedModeBlock = storeSource.slice(guidedModeIndex, returnIndex);

  assert.match(guidedModeBlock, /if \(selectedIndustry\) \{/);
  assert.match(guidedModeBlock, /recommendedServices\?\.map\(\(s\) => s\.name\)/);
  assert.match(guidedModeBlock, /results = results\.filter\(\(p\) => recommendedNames\.has\(p\.name\)\)\.slice\(0, 6\);/);
  assert.match(guidedModeBlock, /if \(!selectedIndustry\) \{/);
  assert.match(guidedModeBlock, /results = results\.filter\(\(product\) => !product\.coming_soon\);/);
  assert.match(storeSource, /No industry selected in guided mode/);
});
