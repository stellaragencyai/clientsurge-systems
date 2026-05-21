import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const navbar = readFileSync(new URL("../src/components/landing/Navbar.jsx", import.meta.url), "utf8");

test("navbar logo stays inside a stable first-viewport nav height", () => {
  assert.match(navbar, /height:\s*"clamp\(64px, 7vw, 82px\)"/);
  assert.match(navbar, /height:\s*"clamp\(52px, 6vw, 72px\)"/);
  assert.doesNotMatch(navbar, /height:\s*"clamp\(100px, 11vw, 140px\)"/);
});

test("navbar keeps compact navigation through iPad landscape widths", () => {
  assert.match(navbar, /className="hidden xl:flex items-center gap-6 absolute left-1\/2 -translate-x-1\/2"/);
  assert.match(navbar, /className="hidden xl:flex items-center gap-3 shrink-0"/);
  assert.match(navbar, /className="xl:hidden w-10 h-10 rounded-full/);
  assert.match(navbar, /className="xl:hidden bg-background border-b/);
  assert.doesNotMatch(navbar, /className="hidden lg:flex items-center gap-6 absolute/);
});
