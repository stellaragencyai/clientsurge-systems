import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyRoute,
  isAppShellPublicRoute,
  ROUTE_ACCESS,
  shouldNoindexRoute,
} from "../src/lib/routeSecurity.js";
import {
  APP_SHELL_PUBLIC_PATHS,
  PUBLIC_DIRECTORY_PAGES,
  SITEMAP_STATIC_PATHS,
} from "../src/lib/publicRouteMetadata.js";

const PRIVATE_ROUTE_SAMPLES = {
  admin: [
    "/admin",
    "/admin/leads",
    "/admin-settings",
    "/AdminSettings",
    "/AdminLeadDetail",
    "/dashboard",
    "/Dashboard",
    "/mission-control",
    "/lead-intelligence",
    "/LeadIntelligence",
    "/saas/admin",
  ],
  authenticated: [
    "/client-portal",
    "/client-portal/status",
    "/client-dashboard",
    "/client-saas",
    "/dashboard-entry",
    "/onboarding",
    "/setup",
    "/setup/status/example-order",
    "/setup/preview/example-spec",
    "/setup-lookup",
  ],
  internal: [
    "/pages",
    "/pages/admin-dashboard",
    "/_generated/routes",
    "/api/apps/null/entities/User/me",
    "/functions/processMissedCallFollowUps",
    "/internal/runbook",
    "/WebsiteSpecPreview",
    "/motion-lab",
  ],
};

test("Area 2 route classifier separates public, authenticated, admin, and internal routes", () => {
  for (const path of PRIVATE_ROUTE_SAMPLES.admin) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.ADMIN, `${path} should be admin`);
    assert.equal(shouldNoindexRoute(path), true, `${path} should be noindex`);
  }

  for (const path of PRIVATE_ROUTE_SAMPLES.authenticated) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.AUTHENTICATED, `${path} should be authenticated`);
    assert.equal(shouldNoindexRoute(path), true, `${path} should be noindex`);
  }

  for (const path of PRIVATE_ROUTE_SAMPLES.internal) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.INTERNAL, `${path} should be internal`);
    assert.equal(shouldNoindexRoute(path), true, `${path} should be noindex`);
  }

  for (const path of ["/", "/pricing", "/automations", "/industries", "/contact", "/blog", "/testimonials"]) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.PUBLIC, `${path} should be public`);
    assert.equal(isAppShellPublicRoute(path), true, `${path} should render in the public shell`);
    assert.equal(shouldNoindexRoute(path), false, `${path} should be indexable`);
  }
});

test("Area 2 auth and checkout utilities render in the app shell but remain noindex", () => {
  for (const path of ["/login", "/register", "/forgot-password", "/reset-password", "/product-signup", "/signup", "/book", "/store"]) {
    assert.equal(classifyRoute(path), ROUTE_ACCESS.PUBLIC, `${path} is not an admin route`);
    assert.equal(isAppShellPublicRoute(path), true, `${path} should render without admin auth`);
    assert.equal(shouldNoindexRoute(path), true, `${path} should be noindex`);
  }

  for (const path of ["/client-portal", "/client-dashboard"]) {
    assert.equal(isAppShellPublicRoute(path), true, `${path} can show an access/login shell`);
    assert.equal(classifyRoute(path), ROUTE_ACCESS.AUTHENTICATED, `${path} should still be treated as authenticated`);
    assert.equal(shouldNoindexRoute(path), true, `${path} should be noindex`);
  }
});

test("Area 2 sitemap and public directory never include private route surfaces", () => {
  const disallowedFragments = [
    "admin",
    "dashboard",
    "client-portal",
    "client-dashboard",
    "setup",
    "api",
    "internal",
    "functions",
    "saas",
    "mission-control",
  ];

  for (const route of SITEMAP_STATIC_PATHS) {
    assert.equal(PUBLIC_DIRECTORY_PAGES.includes(route), true, `${route} should be an explicit public directory page`);
    for (const fragment of disallowedFragments) {
      assert.equal(route.includes(fragment), false, `${route} must not expose ${fragment}`);
    }
  }
});

test("Area 2 app-shell public list intentionally includes utility routes outside the sitemap", () => {
  assert.equal(APP_SHELL_PUBLIC_PATHS.includes("/login"), true);
  assert.equal(APP_SHELL_PUBLIC_PATHS.includes("/product-signup"), true);
  assert.equal(APP_SHELL_PUBLIC_PATHS.includes("/client-portal"), true);
  assert.equal(APP_SHELL_PUBLIC_PATHS.includes("/client-dashboard"), true);
  assert.equal(SITEMAP_STATIC_PATHS.includes("/login"), false);
  assert.equal(SITEMAP_STATIC_PATHS.includes("/product-signup"), false);
  assert.equal(SITEMAP_STATIC_PATHS.includes("/client-portal"), false);
});
