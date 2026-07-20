import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CUSTOMER_CONTEXT_CONTRACT,
  DATA_TRUTH_LAYER,
  PLATFORM_ACCESSIBILITY_REQUIREMENTS,
  PLATFORM_ACTIVITY_EVENT_CONTRACT,
  PLATFORM_NAVIGATION_SECTION_IDS,
  PLATFORM_NAVIGATION_SECTIONS,
  PLATFORM_NOTIFICATION_CONTRACT,
  PLATFORM_PERMISSION_SCOPES,
  PLATFORM_READINESS_CHECKS,
  PLATFORM_ROUTES,
  PLATFORM_SEARCH_RESULT_FIELDS,
  PLATFORM_SEARCH_SOURCES,
  PLATFORM_SEARCH_STATES,
  PLATFORM_UNAUTHORIZED_STATES,
  PLATFORM_VALIDATION_VIEWPORTS,
  WORKER_3_PACKET,
  buildCustomerContext,
  buildPlatformSearchResults,
  canPromoteTruthState,
  evaluatePlatformPermission,
  getPlatformBreadcrumbs,
  getPlatformRouteByDestination,
  getVisiblePlatformRoutes,
  validatePlatformIntegrationFoundation,
} from "../src/lib/platformIntegrationFoundation.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const adminShellSource = readFileSync(new URL("../src/components/admin/AdminShell.jsx", import.meta.url), "utf8");
const adminDashboardSource = readFileSync(new URL("../src/internal-pages/AdminDashboard.jsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/pages/admin/PlatformIntegrationFoundation.jsx", import.meta.url), "utf8");

test("Phase F route inventory covers final navigation architecture", () => {
  assert.deepEqual(PLATFORM_NAVIGATION_SECTIONS.map((section) => section.id), PLATFORM_NAVIGATION_SECTION_IDS);

  for (const sectionId of [
    "command-center",
    "intelligence",
    "operations",
    "customers",
    "communications",
    "ai-workforce",
    "administration",
    "account",
  ]) {
    assert.ok(
      PLATFORM_ROUTES.some((route) => route.navigationLocation.section === sectionId),
      `${sectionId} should have at least one route`,
    );
  }

  for (const route of PLATFORM_ROUTES) {
    assert.ok(route.title, `${route.id} missing title`);
    assert.ok(route.description, `${route.id} missing description`);
    assert.ok(route.permissionRequirement.permission, `${route.id} missing permission`);
    assert.ok(route.permissionRequirement.scope, `${route.id} missing scope`);
    assert.ok(route.navigationLocation.section, `${route.id} missing navigation section`);
    assert.ok(route.destination, `${route.id} missing deep-link destination`);
  }

  assert.equal(getPlatformRouteByDestination("/admin/platform").id, "platform-integration");
  assert.equal(getPlatformRouteByDestination("/admin?tab=leads").id, "leads");
  assert.equal(getPlatformRouteByDestination("/admin/leads/lead_1").id, "lead-detail");
  assert.deepEqual(getPlatformBreadcrumbs("/admin/platform").map((crumb) => crumb.label), [
    "ClientSurge OS",
    "Command Center",
    "Platform Integration Foundation",
  ]);
});

test("Phase F search contract spans the required source families", () => {
  assert.deepEqual(PLATFORM_SEARCH_SOURCES.map((source) => source.id), [
    "customers",
    "leads",
    "conversations",
    "ai-workers",
    "timeline-events",
    "settings",
    "billing",
    "documents",
  ]);
  assert.deepEqual(PLATFORM_SEARCH_RESULT_FIELDS, [
    "title",
    "type",
    "owner",
    "timestamp",
    "permission",
    "destination",
  ]);
  assert.deepEqual(PLATFORM_SEARCH_STATES, [
    "Loading",
    "Results",
    "No Results",
    "Partial",
    "Permission Restricted",
    "Error",
  ]);

  const results = buildPlatformSearchResults({
    customers: [{ id: "client_1", business_name: "Mesa Dental", owner: "Ops" }],
    leads: [{ id: "lead_1", business_name: "Mesa Plumbing", assigned_to: "Sales" }],
    conversations: [{ id: "message_1", subject: "Mesa support", sender_email: "client@example.com" }],
    ai_workers: [{ id: "worker_1", name: "Mesa responder", owner: "AI Ops" }],
    timeline_events: [{ id: "event_1", type: "Mesa launch", actor: "Nolan" }],
    settings: [{ id: "security", title: "Mesa security", scope: "Organization" }],
    billing: [{ id: "order_1", business_name: "Mesa HVAC", customer_email: "billing@example.com" }],
    documents: [{ id: "doc_1", title: "Mesa launch packet", owner: "Ops" }],
  }, "mesa");

  assert.equal(results.length, 8);
  for (const result of results) {
    for (const field of PLATFORM_SEARCH_RESULT_FIELDS) {
      assert.ok(result[field], `${field} should be present for ${result.type}`);
    }
  }
});

test("notification, activity, customer context, and truth contracts are explicit", () => {
  assert.deepEqual(PLATFORM_NOTIFICATION_CONTRACT.requiredFields, [
    "title",
    "category",
    "priority",
    "source",
    "businessImpact",
    "recommendedAction",
    "owner",
    "destination",
    "status",
  ]);
  assert.deepEqual(PLATFORM_NOTIFICATION_CONTRACT.states, [
    "Unread",
    "Read",
    "Resolved",
    "Expired",
    "Dismissed",
  ]);
  assert.equal(PLATFORM_ACTIVITY_EVENT_CONTRACT.provenancePolicy, "Never flatten provenance");
  assert.deepEqual(PLATFORM_ACTIVITY_EVENT_CONTRACT.requiredFields, [
    "actor",
    "timestamp",
    "source",
    "type",
    "verification",
    "relatedObject",
    "deepLink",
  ]);
  assert.deepEqual(CUSTOMER_CONTEXT_CONTRACT.requiredFields, [
    "customer",
    "company",
    "location",
    "plan",
    "aiWorkers",
    "recentActivity",
    "openOpportunities",
    "communications",
    "risks",
  ]);
  assert.equal(buildCustomerContext({ customer: "Mesa Dental", truth: { truthState: "Estimated", freshness: "Delayed" } }).truth.truthState, "Estimated");

  assert.equal(canPromoteTruthState("Unknown", "Healthy"), false);
  assert.equal(canPromoteTruthState("Estimated", "Verified"), false);
  assert.equal(canPromoteTruthState("No Data", "Zero"), false);
  assert.equal(canPromoteTruthState("Connected", "Operational"), false);
  assert.ok(DATA_TRUTH_LAYER.displayPolicy.includes("truth state and freshness"));
});

test("permission enforcement supports scopes and unauthorized states", () => {
  assert.deepEqual(PLATFORM_PERMISSION_SCOPES, ["Organization", "Client", "Location"]);
  assert.deepEqual(PLATFORM_UNAUTHORIZED_STATES, ["Hidden", "Restricted", "Request Access"]);

  const platformRoute = getPlatformRouteByDestination("/admin/platform");
  const settingsRoute = getPlatformRouteByDestination("/settings/roles");
  const portalRoute = getPlatformRouteByDestination("/client-portal");

  assert.equal(evaluatePlatformPermission({ role: "admin" }, platformRoute.permissionRequirement).allowed, true);
  assert.equal(evaluatePlatformPermission({ role: "client" }, platformRoute.permissionRequirement).state, "Hidden");
  assert.equal(evaluatePlatformPermission({ role: "client" }, settingsRoute.permissionRequirement).state, "Restricted");
  assert.equal(evaluatePlatformPermission({ role: "client" }, portalRoute.permissionRequirement).state, "Allowed");

  assert.ok(getVisiblePlatformRoutes({ role: "admin" }).some((route) => route.id === "platform-integration"));
  assert.ok(getVisiblePlatformRoutes({ role: "client" }).some((route) => route.id === "client-portal"));
});

test("protected route, admin navigation, accessibility, and readiness harness are wired", () => {
  assert.match(appSource, /lazy\(\(\) => import\("\.\/pages\/admin\/PlatformIntegrationFoundation"\)\)/);
  assert.match(appSource, /routePath\("admin", "platform"\), Component: PlatformIntegrationFoundation/);
  assert.match(appSource, /allowedRoles=\{\["admin", "super_admin"\]\}/);
  assert.match(adminShellSource, /group: "Command Center"/);
  assert.match(adminShellSource, /group: "AI Workforce"/);
  assert.match(adminShellSource, /group: "Account"/);
  assert.match(adminShellSource, /label: "Platform Integration", icon: Layers, path: "\/admin\/platform"/);
  assert.match(adminDashboardSource, /group: 'Command Center'/);
  assert.match(adminDashboardSource, /externalPath: '\/admin\/platform'/);

  for (const required of [
    "aria-current",
    "aria-live=\"polite\"",
    "role=\"status\"",
    "caption className=\"sr-only\"",
    "validatePlatformIntegrationFoundation",
  ]) {
    assert.ok(pageSource.includes(required), `${required} missing from platform page`);
  }

  assert.deepEqual(PLATFORM_VALIDATION_VIEWPORTS, [1440, 1280, 1024, 768, 390, 375]);
  assert.deepEqual(PLATFORM_ACCESSIBILITY_REQUIREMENTS, [
    "Keyboard",
    "Focus",
    "ARIA",
    "Screen reader",
    "Reduced Motion",
  ]);
  assert.deepEqual(PLATFORM_READINESS_CHECKS.map((check) => check.id), [
    "navigation",
    "search",
    "notifications",
    "permissions",
    "deep-links",
    "customer-context",
    "truth-layer",
  ]);
  assert.equal(WORKER_3_PACKET.reviewFocus.length, 4);
  assert.equal(validatePlatformIntegrationFoundation().ok, true);
});
