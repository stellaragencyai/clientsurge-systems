import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storePage = readFileSync(
  new URL("../src/pages/Store.jsx", import.meta.url),
  "utf8"
);

test("Store lazy sections reserve space while their bundles load", () => {
  assert.match(storePage, /function StoreSuspenseFallback/);
  assert.match(storePage, /minHeight/);
  assert.doesNotMatch(storePage, /fallback=\{null\}/);

  const fallbackCount =
    storePage.match(/fallback=\{<StoreSuspenseFallback minHeight=\{\d+\} \/>}/g)
      ?.length || 0;
  assert.equal(fallbackCount, 4);

  for (const componentName of [
    "InteractiveStackBuilder",
    "BuildYourStackFlow",
    "BundleSavingsToast",
    "SocialProofTicker",
    "ServiceComparisonModal"
  ]) {
    assert.match(storePage, new RegExp(componentName));
  }
});
