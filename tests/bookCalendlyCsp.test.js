import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync("index.html", "utf8");
const bookSource = readFileSync("src/pages/Book.jsx", "utf8");

test("book page CSP permits Calendly scheduler frames", () => {
  assert.match(bookSource, /https:\/\/calendly\.com\/nolan-clientsurgesystems/);
  assert.match(indexSource, /http-equiv="Content-Security-Policy"/);
  assert.match(indexSource, /frame-src https:\/\/calendly\.com https:\/\/assets\.calendly\.com;/);
  assert.match(indexSource, /script-src[^"]*https:\/\/assets\.calendly\.com[^"]*https:\/\/calendly\.com/);
});

