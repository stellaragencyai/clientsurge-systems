import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("local admin QA path is explicit and admin routes accept super admins", () => {
  const authContext = fs.readFileSync("src/lib/AuthContext.jsx", "utf8");
  const app = fs.readFileSync("src/App.jsx", "utf8");

  assert.match(authContext, /local_admin/);
  assert.match(authContext, /clientsurge_local_admin/);
  assert.match(authContext, /local_super_admin/);
  assert.match(authContext, /setIsAuthenticated\(true\)/);
  assert.match(app, /allowedRoles=\{\["admin", "super_admin"\]\}/);
});
