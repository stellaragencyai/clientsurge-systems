import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/components/landing/HomepageConversionContent.jsx", import.meta.url), "utf8");

test("homepage industry chips navigate to canonical live industry pages", () => {
  for (const route of ["/roofing", "/hvac", "/plumbing", "/dental", "/med-spa", "/chiropractic", "/contractors"]) {
    assert.match(source, new RegExp(`href:\\s*"${route.replace("/", "\\/")}"`));
  }

  assert.match(source, /<Link\s+to=\{industry\.href\}/);
  assert.match(source, /aria-label=\{`View \$\{industry\.label\} automation systems`\}/);
  assert.match(source, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.match(source, /"plumbing"/);
});
