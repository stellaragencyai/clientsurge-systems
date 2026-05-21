import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navbarSource = readFileSync("src/components/landing/Navbar.jsx", "utf8");
const bodyScrollLockSource = readFileSync("src/lib/bodyScrollLock.js", "utf8");

test("mobile navbar menu owns a shared iOS-safe body scroll lock", () => {
  assert.match(navbarSource, /if \(!open\) \{\s*return undefined;\s*\}/);
  assert.match(navbarSource, /return acquireBodyScrollLock\("landing-mobile-nav"\);/);
  assert.match(navbarSource, /className="fixed inset-0 z-40 xl:hidden"/);
  assert.match(navbarSource, /onClick=\{\(\) => setOpen\(false\)\}/);
  assert.match(navbarSource, /aria-expanded=\{open\}/);
  assert.doesNotMatch(navbarSource, /document\.body\.style\.overflow\s*=/);
  assert.doesNotMatch(navbarSource, /classList\.remove\(["']nav-open["']\)/);

  assert.match(bodyScrollLockSource, /body\.style\.setProperty\("--scroll-lock-top", `-\$\{state\.scrollY\}px`\);/);
  assert.match(bodyScrollLockSource, /body\.classList\.add\("nav-open"\);/);
  assert.match(bodyScrollLockSource, /window\.scrollTo\(0, restoreY\);/);
});
