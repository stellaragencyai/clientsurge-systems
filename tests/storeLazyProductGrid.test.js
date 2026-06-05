import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const storeSource = readFileSync("src/pages/Store.jsx", "utf8");
const enhancementSource = readFileSync("src/components/store/StorePageEnhancements.jsx", "utf8");

test("store defers large product grids with the intersection-observer grid", () => {
  assert.match(storeSource, /import \{ LazyProductGrid \} from "@\/components\/store\/StorePageEnhancements"/);
  assert.match(storeSource, /filtered\.length >= 8/);
  assert.match(storeSource, /<LazyProductGrid/);
  assert.match(storeSource, /className="store-grid"/);
});

test("lazy product grid preserves store grid styling and waits for viewport entry", () => {
  assert.match(enhancementSource, /new IntersectionObserver/);
  assert.match(enhancementSource, /rootMargin: "800px 0px"/);
  assert.match(enhancementSource, /failOpenTimer/);
  assert.match(enhancementSource, /typeof IntersectionObserver === "undefined"/);
  assert.match(enhancementSource, /className=\{className\}/);
  assert.match(enhancementSource, /products\.map\(\(p, i\) => renderCard\(p, i\)\)/);
});
