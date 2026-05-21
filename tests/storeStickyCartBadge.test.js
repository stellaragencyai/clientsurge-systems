import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storeSource = readFileSync("src/pages/Store.jsx", "utf8");

test("mobile sticky cart shows a circular item-count badge", () => {
  const stickyCartIndex = storeSource.indexOf('className="store-sticky-cart"');
  const badgeLabelIndex = storeSource.indexOf('aria-label={`${items.length} item${items.length === 1 ? "" : "s"} in cart`}');

  assert.ok(stickyCartIndex > -1, "sticky cart is still rendered");
  assert.ok(badgeLabelIndex > stickyCartIndex, "item-count badge stays inside the sticky cart");

  const badgeBlock = storeSource.slice(badgeLabelIndex - 900, badgeLabelIndex + 180);
  assert.match(badgeBlock, /position: "absolute"/);
  assert.match(badgeBlock, /minWidth: "18px"/);
  assert.match(badgeBlock, /height: "18px"/);
  assert.match(badgeBlock, /borderRadius: "999px"/);
  assert.match(badgeBlock, /\{items\.length\}/);
});
