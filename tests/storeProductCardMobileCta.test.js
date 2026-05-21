import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const productCardSource = readFileSync("src/components/store/ProductCard.jsx", "utf8");

test("store product card CTA reduces label font size on narrow mobile screens", () => {
  assert.match(productCardSource, /\.product-card-cta-label \{\s*font-size: 11px;\s*\}/s);
  assert.match(
    productCardSource,
    /@media \(max-width: 480px\) \{\s*\.product-card-cta-label \{\s*font-size: 10px;\s*\}\s*\}/s
  );
  assert.match(productCardSource, /className="product-card-cta-label"/);
  assert.doesNotMatch(productCardSource, /fontSize: "11px", whiteSpace: "nowrap"/);
});

