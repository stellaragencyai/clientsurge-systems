import test from "node:test";
import assert from "node:assert/strict";

import {
  ROUTE_ACCESS,
  classifyRoute,
  isPublicRoute,
  routeSecurityMap,
  shouldNoindexRoute,
} from "../src/lib/routeSecurity.js";

test("route classification keeps marketing and lead capture public", () => {
  for (const path of ["/", "/store", "/book", "/lead-capture-automation", "/leads/capture"]) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.PUBLIC);
    assert.equal(isPublicRoute(path), true);
  }
});

test("route classification protects client onboarding and setup routes", () => {
  for (const path of [
    "/client-portal",
    "/client-dashboard",
    "/onboarding",
    "/setup",
    "/setup/credentials",
    "/setup/status/order_123",
  ]) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.AUTHENTICATED);
    assert.equal(isPublicRoute(path), false);
    assert.equal(shouldNoindexRoute(path), true);
  }
});

test("route classification separates admin and internal routes", () => {
  assert.equal(classifyRoute("/admin"), ROUTE_ACCESS.ADMIN);
  assert.equal(classifyRoute("/admin/leads/lead_123"), ROUTE_ACCESS.ADMIN);
  assert.equal(classifyRoute("/dashboard"), ROUTE_ACCESS.ADMIN);
  assert.equal(classifyRoute("/motion-lab"), ROUTE_ACCESS.INTERNAL);
  assert.equal(classifyRoute("/setup/preview/spec_123"), ROUTE_ACCESS.INTERNAL);

  for (const path of ["/admin", "/admin/leads/lead_123", "/motion-lab", "/setup/preview/spec_123"]) {
    assert.equal(isPublicRoute(path), false);
    assert.equal(shouldNoindexRoute(path), true);
  }
});

test("route security map documents each route class", () => {
  assert.ok(routeSecurityMap.public.includes("/store"));
  assert.ok(routeSecurityMap.authenticated.includes("/onboarding"));
  assert.ok(routeSecurityMap.admin.includes("/admin/onboarding"));
  assert.ok(routeSecurityMap.internal.includes("/motion-lab"));
});
