import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/App.jsx", "utf8");
const adminDashboard = readFileSync("src/internal-pages/AdminDashboard.jsx", "utf8");
const adminShell = readFileSync("src/components/admin/AdminShell.jsx", "utf8");

test("admin leads has one canonical dashboard route", () => {
  assert.doesNotMatch(app, /import\("\.\/internal-pages\/AdminLeads"\)/);
  assert.match(app, /routePath\("admin", "leads"\), element: <Navigate to=\{`\$\{routePath\("admin"\)\}\?tab=leads`\} replace \/>/);
  assert.match(adminShell, /id: "leads",\s+label: "Leads",\s+icon: Users,\s+path: "\/admin", tab: "leads"/);
});

test("admin dashboard tab state is driven by canonical query params", () => {
  assert.match(adminDashboard, /VALID_TAB_IDS/);
  assert.match(adminDashboard, /getActiveTabFromSearch\(location\.search\)/);
  assert.match(adminDashboard, /\/admin\?tab=\$\{encodeURIComponent\(nextTab\)\}/);
});
