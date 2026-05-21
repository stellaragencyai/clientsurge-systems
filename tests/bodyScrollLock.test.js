import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { acquireBodyScrollLock } from "../src/lib/bodyScrollLock.js";

function createMockClassList() {
  const values = new Set();
  return {
    add: (value) => values.add(value),
    remove: (value) => values.delete(value),
    contains: (value) => values.has(value),
  };
}

function createMockStyle() {
  const values = new Map();
  return {
    getPropertyValue: (key) => values.get(key) || "",
    removeProperty: (key) => values.delete(key),
    setProperty: (key, value) => values.set(key, value),
  };
}

function installMockDom(scrollY = 240) {
  const body = {
    classList: createMockClassList(),
    style: createMockStyle(),
  };
  const scrollPositions = [];

  globalThis.window = {
    scrollY,
    pageYOffset: scrollY,
    scrollTo: (x, y) => scrollPositions.push({ x, y }),
  };
  globalThis.document = { body };

  return { body, scrollPositions };
}

test("body scroll lock preserves iOS fixed-position scroll offset until the final release", () => {
  const { body, scrollPositions } = installMockDom(375);

  const releaseNav = acquireBodyScrollLock("landing-mobile-nav");
  const releaseModal = acquireBodyScrollLock("portal-login-modal");

  assert.equal(body.classList.contains("nav-open"), true);
  assert.equal(body.style.getPropertyValue("--scroll-lock-top"), "-375px");

  releaseNav();
  assert.equal(body.classList.contains("nav-open"), true);
  assert.equal(body.style.getPropertyValue("--scroll-lock-top"), "-375px");
  assert.deepEqual(scrollPositions, []);

  releaseModal();
  assert.equal(body.classList.contains("nav-open"), false);
  assert.equal(body.style.getPropertyValue("--scroll-lock-top"), "");
  assert.deepEqual(scrollPositions, [{ x: 0, y: 375 }]);
});

test("navbar relies on shared scroll-lock release instead of clearing nav-open directly", () => {
  const navbarSource = readFileSync("src/components/landing/Navbar.jsx", "utf8");

  assert.match(navbarSource, /acquireBodyScrollLock\("landing-mobile-nav"\)/);
  assert.doesNotMatch(navbarSource, /classList\.remove\(["']nav-open["']\)/);
  assert.doesNotMatch(navbarSource, /removeProperty\(["']--scroll-lock-top["']\)/);
});

