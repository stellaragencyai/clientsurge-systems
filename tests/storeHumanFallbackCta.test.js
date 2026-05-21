import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storeSource = readFileSync("src/pages/Store.jsx", "utf8");

test("store shows a talk-to-human escape valve below the product grid", () => {
  assert.match(storeSource, /function StoreHumanFallbackCTA/);
  assert.match(storeSource, /aria-label="Talk to a human"/);
  assert.match(storeSource, /Talk to a Human/);
  assert.match(storeSource, /href="\/book"/);

  const gridIndex = storeSource.indexOf("<LazyProductGrid");
  const fallbackIndex = storeSource.indexOf("<StoreHumanFallbackCTA />");
  const builderIndex = storeSource.indexOf("<InteractiveStackBuilder />");

  assert.ok(gridIndex > -1, "Store still renders the product grid");
  assert.ok(fallbackIndex > gridIndex, "fallback CTA appears after the product grid");
  assert.ok(builderIndex === -1 || fallbackIndex < builderIndex, "fallback CTA appears before optional stack builder");
});

