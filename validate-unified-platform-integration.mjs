import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  PHASE_B_REQUIRED_STATES,
  phaseBFixtures,
} from "./src/components/business-intelligence/phaseBFixtures.js";
import {
  PHASE_C_STATE_MATRIX,
  phaseCFixtures,
} from "./src/components/customer-operations/phaseCFixtures.js";
import {
  ENTERPRISE_ADMIN_ROLES,
  ENTERPRISE_ADMIN_SCOPES,
  ENTERPRISE_SETTINGS_ROUTES,
  ENTERPRISE_STATE_CONTRACTS,
  ROLE_SCOPE_PERMISSIONS,
} from "./src/lib/enterpriseAdminFoundation.js";
import {
  PHASE_E_ACCESSIBILITY_REQUIREMENTS,
  PHASE_E_ROUTES,
  PHASE_E_TRUTH_RULES,
  PHASE_E_VIEWPORTS,
} from "./src/lib/phaseELifecycleFoundation.js";
import {
  CUSTOMER_CONTEXT_CONTRACT,
  DATA_FRESHNESS_STATES,
  DATA_TRUTH_STATES,
  PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  PLATFORM_ACTIVITY_EVENT_CONTRACT,
  PLATFORM_NAVIGATION_SECTION_IDS,
  PLATFORM_NAVIGATION_SECTIONS,
  PLATFORM_NOTIFICATION_CONTRACT,
  PLATFORM_READINESS_CHECKS,
  PLATFORM_ROUTES,
  PLATFORM_SEARCH_SOURCES,
  PLATFORM_VALIDATION_VIEWPORTS,
  canPromoteTruthState,
  getPlatformRouteByDestination,
  validatePlatformIntegrationFoundation,
} from "./src/lib/platformIntegrationFoundation.js";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

const sourceFile = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");
const fileExists = (relativePath) => existsSync(path.join(repoRoot, relativePath));

const requiredViewportWidths = [1440, 1280, 1024, 768, 390, 375];

const phaseRouteRequirements = {
  phaseB: ["lead-intelligence", "analytics", "revenue", "attribution", "health"],
  phaseC: ["client-projects", "leads", "lead-detail", "client-onboarding", "onboarding-pipeline", "client-portal", "inbox", "communication-logs", "automations", "ai-sales"],
  phaseD: ENTERPRISE_SETTINGS_ROUTES.map((route) => `settings-${route.id}`),
  phaseF: ["platform-integration"],
};

const removedDuplicatePhaseCFiles = [
  "src/components/review/phase-c/PhaseCReviewComponents.jsx",
  "src/data/phaseCReviewFixtures.js",
  "src/pages/review/PhaseCCommunicationsReview.jsx",
  "src/pages/review/PhaseCCustomerSuccessReview.jsx",
  "src/pages/review/PhaseCTimelineReview.jsx",
  "src/pages/review/PhaseCWorkforceReview.jsx",
  "tests/phaseCReviewContracts.test.js",
];

function recordCheck(checks, id, condition, detail = {}) {
  checks.push({ id, ok: Boolean(condition), detail });
}

function assertPhaseB(checks) {
  const moduleKeys = Object.keys(phaseBFixtures);
  recordCheck(checks, "phase-b.modules", moduleKeys.length === 5, { moduleKeys });
  recordCheck(
    checks,
    "phase-b.required-states",
    moduleKeys.every((key) => PHASE_B_REQUIRED_STATES.every((state) => Boolean(phaseBFixtures[key]?.[state]))),
    { states: PHASE_B_REQUIRED_STATES },
  );
  recordCheck(
    checks,
    "phase-b.truth-language",
    [
      phaseBFixtures.businessHealth.unknown.headline,
      phaseBFixtures.revenueIntelligence?.unknown?.headline || phaseBFixtures.revenueIntelligence?.unknown?.state,
      phaseBFixtures.revenueIntelligence?.empty?.description,
    ].join(" ").toLowerCase().includes("unknown") &&
      phaseBFixtures.revenueIntelligence.empty.description.toLowerCase().includes("zero"),
  );
  recordCheck(
    checks,
    "phase-b.review-route-files",
    fileExists("src/review/phase-b/PhaseBReviewHarness.jsx") &&
      fileExists("src/review/phase-b/phase-b-entry.jsx") &&
      fileExists("scripts/validate-phase-b-business-intelligence-browser.mjs"),
  );
}

function assertPhaseC(checks) {
  const systemKeys = Object.keys(PHASE_C_STATE_MATRIX);
  recordCheck(checks, "phase-c.systems", systemKeys.length === 4, { systemKeys });
  recordCheck(
    checks,
    "phase-c.state-matrix",
    systemKeys.every((systemKey) =>
      PHASE_C_STATE_MATRIX[systemKey].every((state) => Boolean(phaseCFixtures[systemKey]?.[state])),
    ),
  );
  recordCheck(
    checks,
    "phase-c.truth-phrases",
    phaseCFixtures.aiWorkforce.unknown.happening.includes("cannot be verified") &&
      phaseCFixtures.communicationCenter.unread.attention.includes("Delivered is not treated as read") &&
      phaseCFixtures.customerSuccess.missing_data.attention.includes("cannot classify"),
  );
  recordCheck(
    checks,
    "phase-c.review-route-files",
    fileExists("src/review/phase-c/PhaseCReviewHarness.jsx") &&
      fileExists("src/review/phase-c/phase-c-entry.jsx") &&
      fileExists("scripts/validate-phase-c-customer-operations-browser.mjs"),
  );
  recordCheck(
    checks,
    "phase-c.no-duplicate-review-modules",
    removedDuplicatePhaseCFiles.every((relativePath) => !fileExists(relativePath)),
    { removedDuplicatePhaseCFiles },
  );
}

function assertPhaseD(checks) {
  recordCheck(checks, "phase-d.roles", ENTERPRISE_ADMIN_ROLES.length === 8, { roles: ENTERPRISE_ADMIN_ROLES });
  recordCheck(checks, "phase-d.scopes", ENTERPRISE_ADMIN_SCOPES.join(",") === "Organization,Client,Location");
  recordCheck(checks, "phase-d.settings-routes", ENTERPRISE_SETTINGS_ROUTES.length === 10);
  recordCheck(
    checks,
    "phase-d.billing-truth-states",
    ["Active", "Trial", "Past Due", "Cancelled", "Scheduled Change", "Payment Failed", "Incomplete", "Unavailable", "Permission Restricted"]
      .every((state) => ENTERPRISE_STATE_CONTRACTS.billing.includes(state)),
  );
  recordCheck(
    checks,
    "phase-d.rbac-admin-view",
    ROLE_SCOPE_PERMISSIONS.Admin.Organization.includes("Manage") &&
      ROLE_SCOPE_PERMISSIONS.Viewer.Client.includes("View"),
  );
  recordCheck(
    checks,
    "phase-d.test-file",
    fileExists("tests/phaseDEnterpriseAdminFoundation.test.js"),
  );
}

function assertPhaseE(checks) {
  const viewportWidths = PHASE_E_VIEWPORTS.map((viewport) => viewport.width);
  recordCheck(checks, "phase-e.routes", PHASE_E_ROUTES.length === 10, { routes: PHASE_E_ROUTES.map((route) => route.path) });
  recordCheck(
    checks,
    "phase-e.viewports",
    requiredViewportWidths.every((width) => viewportWidths.includes(width)),
    { viewportWidths },
  );
  recordCheck(
    checks,
    "phase-e.truth-rules",
    ["Unknown is not healthy", "Estimated is not verified", "Sent is not delivered", "No data is not zero", "Configured is not working", "Connected is not healthy"]
      .every((rule) => PHASE_E_TRUTH_RULES.includes(rule)),
  );
  recordCheck(
    checks,
    "phase-e.accessibility",
    PHASE_E_ACCESSIBILITY_REQUIREMENTS.some((item) => item.includes("Keyboard")) &&
      PHASE_E_ACCESSIBILITY_REQUIREMENTS.some((item) => item.includes("200% zoom")),
  );
  recordCheck(
    checks,
    "phase-e.validator-files",
    fileExists("scripts/validate-phase-e-browser.mjs") &&
      fileExists("tests/phaseELifecycleContracts.test.js"),
  );
}

function assertPhaseF(checks) {
  const phaseFValidation = validatePlatformIntegrationFoundation();
  const navIds = PLATFORM_NAVIGATION_SECTIONS.map((section) => section.id);
  recordCheck(checks, "phase-f.platform-validation", phaseFValidation.ok, phaseFValidation);
  recordCheck(checks, "phase-f.navigation-sections", navIds.join(",") === PLATFORM_NAVIGATION_SECTION_IDS.join(","), { navIds });
  recordCheck(checks, "phase-f.search-sources", PLATFORM_SEARCH_SOURCES.length === 8);
  recordCheck(checks, "phase-f.notifications", PLATFORM_NOTIFICATION_CONTRACT.requiredFields.includes("businessImpact"));
  recordCheck(checks, "phase-f.activity", PLATFORM_ACTIVITY_EVENT_CONTRACT.requiredFields.includes("deepLink"));
  recordCheck(checks, "phase-f.customer-context", CUSTOMER_CONTEXT_CONTRACT.requiredFields.includes("recentActivity"));
  recordCheck(
    checks,
    "phase-f.truth-denials",
    !canPromoteTruthState("Unknown", "Healthy") &&
      !canPromoteTruthState("Estimated", "Verified") &&
      !canPromoteTruthState("No Data", "Zero") &&
      !canPromoteTruthState("Connected", "Operational"),
  );
}

function assertUnifiedWiring(checks) {
  const appSource = sourceFile("src/App.jsx");
  const adminShellSource = sourceFile("src/components/admin/AdminShell.jsx");
  const adminSearchSource = sourceFile("src/lib/adminGlobalSearch.js");
  const routeIds = new Set(PLATFORM_ROUTES.map((route) => route.id));
  const routeDestinationIds = new Set(PLATFORM_ROUTES.map((route) => getPlatformRouteByDestination(route.destination)?.id));

  for (const [phaseId, routeRequirements] of Object.entries(phaseRouteRequirements)) {
    recordCheck(
      checks,
      `unified.routes.${phaseId}`,
      routeRequirements.every((routeId) => routeIds.has(routeId) && routeDestinationIds.has(routeId)),
      { routeRequirements },
    );
  }

  recordCheck(
    checks,
    "unified.app-routes",
    appSource.includes('import("./pages/admin/PlatformIntegrationFoundation")') &&
      appSource.includes('import("./pages/review/PhaseEReviewPage")') &&
      appSource.includes('routePath("admin", "platform"), Component: PlatformIntegrationFoundation') &&
      appSource.includes("isReviewPath(location.pathname)") &&
      PHASE_E_ROUTES.every((route) => appSource.includes(`path="${route.path}"`) || route.path === "/review/phase-e/onboarding"),
  );
  recordCheck(
    checks,
    "unified.admin-shell",
    adminShellSource.includes('group: "Command Center"') &&
      adminShellSource.includes('group: "Intelligence"') &&
      adminShellSource.includes('group: "Operations"') &&
      adminShellSource.includes('group: "Customers"') &&
      adminShellSource.includes('group: "Communications"') &&
      adminShellSource.includes('group: "AI Workforce"') &&
      adminShellSource.includes('group: "Administration"') &&
      adminShellSource.includes('group: "Account"') &&
      adminShellSource.includes('path: "/admin/platform"'),
  );
  recordCheck(
    checks,
    "unified.search-adapter",
    adminSearchSource.includes("PLATFORM_SEARCH_SOURCES") &&
      adminSearchSource.includes("buildPlatformSearchResults") &&
      adminSearchSource.includes("Unavailable") &&
      adminSearchSource.includes("Partial"),
  );
  recordCheck(
    checks,
    "unified.validation-matrix",
    requiredViewportWidths.every((width) => PLATFORM_VALIDATION_VIEWPORTS.includes(width)) &&
      ["Keyboard", "Focus", "ARIA", "Screen reader", "Reduced Motion"].every((item) => PLATFORM_ACCESSIBILITY_REQUIREMENTS.includes(item)) &&
      ["Verified", "Derived", "Estimated", "Reported", "Unknown"].every((item) => DATA_TRUTH_STATES.includes(item)) &&
      ["Live", "Current", "Delayed", "Stale", "Unavailable"].every((item) => DATA_FRESHNESS_STATES.includes(item)),
  );
  recordCheck(
    checks,
    "unified.readiness-checks",
    ["navigation", "search", "notifications", "permissions", "deep-links", "customer-context", "truth-layer"]
      .every((id) => PLATFORM_READINESS_CHECKS.map((check) => check.id).includes(id)),
  );
}

export function validateUnifiedPlatformIntegration() {
  const checks = [];

  assertPhaseB(checks);
  assertPhaseC(checks);
  assertPhaseD(checks);
  assertPhaseE(checks);
  assertPhaseF(checks);
  assertUnifiedWiring(checks);

  const failures = checks.filter((check) => !check.ok);

  return {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      phaseBModules: Object.keys(phaseBFixtures).length,
      phaseCSystems: Object.keys(PHASE_C_STATE_MATRIX).length,
      phaseDRoutes: ENTERPRISE_SETTINGS_ROUTES.length,
      phaseERoutes: PHASE_E_ROUTES.length,
      platformRoutes: PLATFORM_ROUTES.length,
      navigationSections: PLATFORM_NAVIGATION_SECTIONS.length,
      searchSources: PLATFORM_SEARCH_SOURCES.length,
      notificationSources: PLATFORM_NOTIFICATION_CONTRACT.sources.length,
      activitySources: PLATFORM_ACTIVITY_EVENT_CONTRACT.sources.length,
      readinessChecks: PLATFORM_READINESS_CHECKS.map((check) => check.id),
      viewports: requiredViewportWidths,
    },
    checks,
    failures,
  };
}

function printReport(report) {
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("ClientSurge OS unified platform integration validation");
  console.log(`Status: ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`Phase B modules: ${report.summary.phaseBModules}`);
  console.log(`Phase C systems: ${report.summary.phaseCSystems}`);
  console.log(`Phase D settings routes: ${report.summary.phaseDRoutes}`);
  console.log(`Phase E review routes: ${report.summary.phaseERoutes}`);
  console.log(`Platform routes: ${report.summary.platformRoutes}`);
  console.log(`Navigation sections: ${report.summary.navigationSections}`);
  console.log(`Search sources: ${report.summary.searchSources}`);
  console.log(`Notifications: ${report.summary.notificationSources}`);
  console.log(`Activity sources: ${report.summary.activitySources}`);
  console.log(`Viewports: ${report.summary.viewports.join(", ")}`);

  if (!report.ok) {
    console.log("Failures:");
    for (const failure of report.failures) {
      console.log(`- ${failure.id}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = validateUnifiedPlatformIntegration();
  printReport(report);

  try {
    assert.equal(report.ok, true);
  } catch {
    process.exitCode = 1;
  }
}
