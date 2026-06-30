import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const main = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/admin-mobile-hotfix.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../src/lib/adminMobileRuntime.js", import.meta.url), "utf8");

test("admin mobile runtime is installed from app bootstrap", () => {
  assert.ok(main.includes("installAdminMobileRuntime"));
  assert.ok(main.includes("@/lib/adminMobileRuntime"));
});

test("mobile admin action bar exposes core destinations", () => {
  assert.ok(runtime.includes("cs-admin-mobile-action-bar"));
  assert.ok(runtime.includes("/admin?tab=leads"));
  assert.ok(runtime.includes("/admin?tab=inbox"));
  assert.ok(runtime.includes("/admin?tab=settings"));
});

test("admin mobile CSS covers settings tabs, lead cards, overview compression, and overflow containment", () => {
  assert.ok(css.includes("Admin settings tabs"));
  assert.ok(css.includes("Lead table card mode"));
  assert.ok(css.includes("Admin dashboard overview compression"));
  assert.ok(css.includes("overscroll-behavior"));
  assert.ok(css.includes("cs-admin-mobile-action-bar"));
});
