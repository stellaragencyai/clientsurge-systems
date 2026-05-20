import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/pages/Home.jsx", import.meta.url), "utf8");

test("homepage renders the founder credibility section before testimonials", () => {
  assert.match(home, /const FounderSection = lazy/);
  assert.ok(home.indexOf("<FounderSection />") > home.indexOf("<FAQ />"));
  assert.ok(home.indexOf("<FounderSection />") < home.indexOf("<Testimonials />"));
});
