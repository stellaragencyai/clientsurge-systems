import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appSource = readFileSync("src/App.jsx", "utf8");

test("secondary public routes are lazy loaded out of the entry bundle", () => {
  for (const routeModule of [
    "./pages/Start",
    "./pages/Book",
    "./pages/Contact",
    "./pages/Industries",
    "./pages/Blog",
    "./pages/Store",
    "./pages/About",
    "./pages/Automations",
  ]) {
    assert.match(appSource, new RegExp(`lazy\\(\\(\\) => import\\("${routeModule.replaceAll(".", "\\.")}"\\)\\)`));
    assert.doesNotMatch(appSource, new RegExp(`import .* from "${routeModule.replaceAll(".", "\\.")}"`));
  }
});

test("large internal routes stay behind suspense boundaries", () => {
  for (const routeModule of [
    "./internal-pages/AdminDashboard",
    "./internal-pages/ClientPortal",
    "./internal-pages/Onboarding",
    "./internal-pages/CredentialsSetup",
  ]) {
    assert.match(appSource, new RegExp(`lazy\\(\\(\\) => import\\("${routeModule.replaceAll(".", "\\.")}"\\)\\)`));
  }

  assert.match(appSource, /function LazyRoute/);
  assert.match(appSource, /<Suspense fallback={<RouteLoadingSkeleton \/>}>/);
});
