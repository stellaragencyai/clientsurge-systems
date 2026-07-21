#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateUnifiedPlatformIntegration } from "../validate-unified-platform-integration.mjs";
import {
  PLATFORM_NOTIFICATION_CONTRACT,
  PLATFORM_NOTIFICATION_FIXTURES,
  PLATFORM_SEARCH_SOURCES,
  buildPlatformSearchResponse,
  validatePlatformIntegrationFoundation,
} from "../src/lib/platformIntegrationFoundation.js";
import { validateRouteRegistryAuthority } from "./validate-route-registry-authority.mjs";

function recordCheck(checks, id, condition, detail = {}) {
  checks.push({ id, ok: Boolean(condition), detail });
}

export function validatePlatformContracts() {
  const checks = [];
  const foundation = validatePlatformIntegrationFoundation();
  const unified = validateUnifiedPlatformIntegration();
  const routeRegistry = validateRouteRegistryAuthority();
  const restrictedSearch = buildPlatformSearchResponse({
    settings: [{ id: "roles", title: "Restricted role settings", scope: "Organization" }],
  }, "restricted", 10, { user: { role: "client" } });

  recordCheck(checks, "foundation-contract", foundation.ok, foundation);
  recordCheck(checks, "unified-contract", unified.ok, unified);
  recordCheck(checks, "route-registry-authority", routeRegistry.ok, routeRegistry);
  recordCheck(
    checks,
    "search-complete-and-permissioned",
    PLATFORM_SEARCH_SOURCES.length === 10 &&
      ["appointments", "opportunities"].every((sourceId) => PLATFORM_SEARCH_SOURCES.some((source) => source.id === sourceId)) &&
      restrictedSearch.status === "Permission Restricted" &&
      restrictedSearch.results.length === 0,
    restrictedSearch,
  );
  recordCheck(
    checks,
    "notification-contract-complete",
    PLATFORM_NOTIFICATION_CONTRACT.requiredFields.length === 13 &&
      ["id", "severity", "whatHappened", "whyItMatters", "businessImpact", "recommendedAction", "createdAt"]
        .every((field) => PLATFORM_NOTIFICATION_CONTRACT.requiredFields.includes(field)) &&
      ["AI", "Business Intelligence", "Billing", "Security", "Integration"].every((source) =>
        PLATFORM_NOTIFICATION_FIXTURES.some((fixture) => fixture.source === source),
      ),
  );

  const failures = checks.filter((check) => !check.ok);

  return {
    ok: failures.length === 0,
    checkedAt: new Date().toISOString(),
    summary: {
      routes: foundation.checked.routes,
      searchSources: PLATFORM_SEARCH_SOURCES.map((source) => source.id),
      notificationFields: PLATFORM_NOTIFICATION_CONTRACT.requiredFields,
      routeRegistryItems: routeRegistry.summary,
      unified: unified.summary,
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

  console.log("ClientSurge OS platform contracts validation");
  console.log(`Status: ${report.ok ? "PASS" : "FAIL"}`);
  console.log(`Routes: ${report.summary.routes}`);
  console.log(`Search sources: ${report.summary.searchSources.join(", ")}`);
  console.log(`Notification fields: ${report.summary.notificationFields.length}`);
  if (!report.ok) {
    console.log("Failures:");
    for (const failure of report.failures) console.log(`- ${failure.id}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = validatePlatformContracts();
  printReport(report);

  try {
    assert.equal(report.ok, true);
  } catch {
    process.exitCode = 1;
  }
}
