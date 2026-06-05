import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync("index.html", "utf8");
const bookSource = readFileSync("src/pages/Book.jsx", "utf8");

test("book page avoids broken Calendly scheduler frames", () => {
  assert.doesNotMatch(bookSource, /https:\/\/calendly\.com\/nolan-clientsurgesystems/);
  assert.doesNotMatch(bookSource, /<iframe/);
  assert.match(indexSource, /http-equiv="Content-Security-Policy"/);
  assert.match(bookSource, /Free Automation Audit scheduler/);
  assert.match(bookSource, /<DemoBookingInline \/>/);
});
