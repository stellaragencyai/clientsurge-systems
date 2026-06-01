import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bookSource = readFileSync("src/pages/Book.jsx", "utf8");

test("book page uses an internal scheduling fallback instead of a broken iframe", () => {
  assert.doesNotMatch(bookSource, /const BOOKING_EMBED_URL/);
  assert.doesNotMatch(bookSource, /<iframe/);
  assert.match(bookSource, /Fast scheduling/);
  assert.match(bookSource, /id="scheduler"/);
  assert.match(bookSource, /window\.location\.href = '\/contact'/);
  assert.doesNotMatch(bookSource, /DemoBookingModal/);
});
