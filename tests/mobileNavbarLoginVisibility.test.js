import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navbar = readFileSync(new URL("../src/components/landing/Navbar.jsx", import.meta.url), "utf8");

test("mobile drawer exposes login before the long Industries list", () => {
  const loginIndex = navbar.indexOf("Login to Client Portal");
  const industriesIndex = navbar.indexOf("{/* Industries compact section");

  assert.ok(loginIndex > -1, "mobile login CTA is missing");
  assert.ok(industriesIndex > -1, "mobile Industries section marker is missing");
  assert.ok(loginIndex < industriesIndex, "mobile login CTA must appear before Industries so it is immediately visible");
});

test("mobile drawer remains scrollable when menu content is taller than the viewport", () => {
  assert.match(navbar, /maxHeight: "calc\(100vh - var\(--cs-nav-height\) - env\(safe-area-inset-top\)\)"/);
  assert.match(navbar, /overflowY: "auto"/);
  assert.match(navbar, /WebkitOverflowScrolling: "touch"/);
});
