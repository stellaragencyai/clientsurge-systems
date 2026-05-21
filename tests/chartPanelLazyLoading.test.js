import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const adminDashboardSource = readFileSync("src/internal-pages/AdminDashboard.jsx", "utf8");
const clientPortalSource = readFileSync("src/internal-pages/ClientPortal.jsx", "utf8");

test("admin chart-heavy panels stay lazy until their tabs are selected", () => {
  for (const panelModule of [
    "../components/admin/AnalyticsDashboard",
    "../components/admin/EmailCampaignPanel",
    "../components/admin/LeadSourceAttribution",
    "../components/admin/RevenueDashboard",
  ]) {
    assert.match(
      adminDashboardSource,
      new RegExp(`lazy\\(\\(\\) => import\\('${panelModule.replaceAll(".", "\\.")}'\\)\\)`),
    );
    assert.doesNotMatch(
      adminDashboardSource,
      new RegExp(`import .* from '${panelModule.replaceAll(".", "\\.")}'`),
    );
  }

  assert.match(adminDashboardSource, /function LazyAdminPanel/);
  assert.match(adminDashboardSource, /<Suspense fallback={<AdminPanelSkeleton \/>}>/);
});

test("client portal chart panels stay lazy until performance reports are opened", () => {
  for (const panelModule of [
    "../components/portal/RevenueMetricsPanel",
    "../components/portal/WeeklyReports",
  ]) {
    assert.match(
      clientPortalSource,
      new RegExp(`lazy\\(\\(\\) => import\\("${panelModule.replaceAll(".", "\\.")}"\\)\\)`),
    );
    assert.doesNotMatch(
      clientPortalSource,
      new RegExp(`import .* from "${panelModule.replaceAll(".", "\\.")}"`),
    );
  }

  assert.match(clientPortalSource, /function LazyPortalPanel/);
  assert.match(clientPortalSource, /<Suspense fallback={<PortalPanelSkeleton \/>}>/);
});
