import {
  PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  PLATFORM_ACTIVITY_EVENT_CONTRACT,
  PLATFORM_NAVIGATION_SECTIONS,
  PLATFORM_NOTIFICATION_CONTRACT,
  PLATFORM_READINESS_CHECKS,
  PLATFORM_ROUTES,
  PLATFORM_SEARCH_SOURCES,
  PLATFORM_VALIDATION_VIEWPORTS,
  validatePlatformIntegrationFoundation,
} from "../src/lib/platformIntegrationFoundation.js";

const validation = validatePlatformIntegrationFoundation();

const report = {
  ok: validation.ok,
  checkedAt: new Date().toISOString(),
  summary: {
    routes: PLATFORM_ROUTES.length,
    navigationSections: PLATFORM_NAVIGATION_SECTIONS.map((section) => section.label),
    searchSources: PLATFORM_SEARCH_SOURCES.map((source) => source.id),
    notificationSources: PLATFORM_NOTIFICATION_CONTRACT.sources,
    activitySources: PLATFORM_ACTIVITY_EVENT_CONTRACT.sources,
    readinessChecks: PLATFORM_READINESS_CHECKS.map((check) => check.id),
    viewports: PLATFORM_VALIDATION_VIEWPORTS,
    accessibility: PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  },
  failures: validation.failures,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("ClientSurge OS Phase F platform integration validation");
  console.log(`Status: ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`Routes: ${report.summary.routes}`);
  console.log(`Navigation: ${report.summary.navigationSections.join(", ")}`);
  console.log(`Search sources: ${report.summary.searchSources.join(", ")}`);
  console.log(`Notifications: ${report.summary.notificationSources.join(", ")}`);
  console.log(`Activity: ${report.summary.activitySources.join(", ")}`);
  console.log(`Viewports: ${report.summary.viewports.join(", ")}`);
  console.log(`Accessibility: ${report.summary.accessibility.join(", ")}`);
  if (!report.ok) {
    console.log(`Failures: ${report.failures.join(", ")}`);
  }
}

process.exitCode = report.ok ? 0 : 1;
