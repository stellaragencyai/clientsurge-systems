import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../src/components/admin/AdminShell.jsx", import.meta.url), "utf8");
const notFound = fs.readFileSync(new URL("../src/lib/PageNotFound.jsx", import.meta.url), "utf8");

function occurrences(source, value) {
  return source.split(value).length - 1;
}

test("admin diagnostics are registered as protected application routes", () => {
  assert.match(app, /allowedRoles=\{\["admin", "super_admin"\]\}/);
  assert.equal(occurrences(app, 'routePath("admin", "broken-flows")'), 1);
  assert.equal(occurrences(app, 'routePath("admin", "publish-drift")'), 1);
  assert.match(app, /const BrokenFlows = lazy\(\(\) => import\("\.\/pages\/admin\/BrokenFlows"\)\)/);
  assert.match(app, /const PublishDrift = lazy\(\(\) => import\("\.\/pages\/admin\/PublishDrift"\)\)/);
});

test("deployment control route is not duplicated", () => {
  assert.equal(occurrences(app, 'routePath("admin", "deployment-control")'), 1);
});

test("admin sidebar exposes both diagnostics", () => {
  assert.equal(occurrences(shell, 'path: "/admin/broken-flows"'), 1);
  assert.equal(occurrences(shell, 'path: "/admin/publish-drift"'), 1);
  assert.match(shell, /label: "Broken Flows"/);
  assert.match(shell, /label: "Publish Drift"/);
});

test("404 page contains no admin routing exceptions", () => {
  assert.doesNotMatch(notFound, /AdminRouteFallback/);
  assert.doesNotMatch(notFound, /\/admin\/broken-flows/);
  assert.doesNotMatch(notFound, /\/admin\/publish-drift/);
  assert.doesNotMatch(notFound, /useAuth/);
  assert.doesNotMatch(notFound, /useLocation/);
});
