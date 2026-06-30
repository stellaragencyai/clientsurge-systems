import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../src/components/admin/AdminShell.jsx", import.meta.url), "utf8");

test("AdminShell sidebar starts closed on mobile and open on desktop", () => {
  assert.match(shell, /const isDesktopViewport = \(\) => typeof window === "undefined" \|\| window\.innerWidth >= 1024/);
  assert.match(shell, /useState\(isDesktopViewport\)/);
});

test("AdminShell mobile drawer is safe-area aware and scroll friendly", () => {
  assert.match(shell, /w-\[min\(20rem,86vw\)\] lg:w-64/);
  assert.match(shell, /pt-\[env\(safe-area-inset-top\)\]/);
  assert.match(shell, /overscroll-contain/);
  assert.match(shell, /backdrop-blur-\[2px\]/);
});

test("AdminShell exposes mobile quick navigation chips", () => {
  assert.match(shell, /MOBILE_QUICK_NAV/);
  assert.match(shell, /Overview/);
  assert.match(shell, /Leads/);
  assert.match(shell, /Inbox/);
  assert.match(shell, /Settings/);
});
