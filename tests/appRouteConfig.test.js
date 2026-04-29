import test from "node:test";
import assert from "node:assert/strict";

import {
  ADMIN_REDIRECT_PATHS,
  isPublicPath,
  PUBLIC_PATHS,
} from "../src/lib/appRouteConfig.js";

test("public route config keeps legal, store, demo, and portal entry paths while dropping stale preview routes", () => {
  assert.ok(PUBLIC_PATHS.includes("/store"));
  assert.ok(PUBLIC_PATHS.includes("/contact"));
  assert.ok(PUBLIC_PATHS.includes("/book"));
  assert.ok(PUBLIC_PATHS.includes("/leads/capture"));
  assert.ok(!PUBLIC_PATHS.includes("/test-option-1"));
  assert.ok(!PUBLIC_PATHS.includes("/preview-idea-1"));
});

test("admin alias redirects remain explicit and public path guard stays strict", () => {
  assert.deepEqual(ADMIN_REDIRECT_PATHS, [
    "/dashboard",
    "/admin-settings",
    "/lead-intelligence",
    "/sam",
    "/medspa-dashboard",
  ]);
  assert.equal(isPublicPath("/store"), true);
  assert.equal(isPublicPath("/admin"), false);
});
