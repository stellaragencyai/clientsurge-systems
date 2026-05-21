import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storeSource = readFileSync("src/pages/Store.jsx", "utf8");

test("store product grid collapses to one column on narrow mobile screens", () => {
  assert.match(storeSource, /\.store-page \.store-grid \{\s*display: grid;\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/s);
  assert.match(storeSource, /@media \(max-width: 1080px\) \{\s*\.store-page \.store-grid \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(
    storeSource,
    /@media \(max-width: 720px\) \{[\s\S]*?\.store-page \.store-grid \{\s*grid-template-columns: 1fr;\s*gap: 20px;\s*\}/
  );
  assert.match(storeSource, /maxWidth: "1300px"/);
  assert.match(storeSource, /padding: "0 24px 24px"/);
});

