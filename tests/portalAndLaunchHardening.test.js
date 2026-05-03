import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("portal endpoints resolve canonical project ownership instead of falling back to global lead or event lists", () => {
  const portalContext = readRepoFile("base44/functions/getClientPortalContext/entry.ts");
  const clientAnalytics = readRepoFile("base44/functions/getClientAnalytics/entry.ts");
  const followUpLog = readRepoFile("base44/functions/getClientFollowUpLog/entry.ts");
  const leadFlowMetrics = readRepoFile("base44/functions/getClientLeadFlowMetrics/entry.ts");

  assert.match(portalContext, /resolveClientPortalAccess/);

  assert.match(clientAnalytics, /resolveClientPortalAccess/);
  assert.match(clientAnalytics, /entities\.Leads\.filter\(\s*\{\s*client_project_id: project\.id\s*\}/);
  assert.doesNotMatch(clientAnalytics, /CommunicationEvent\.list\(/);

  assert.match(followUpLog, /resolveClientPortalAccess/);
  assert.doesNotMatch(followUpLog, /CommunicationEvent\.list\(/);

  assert.match(leadFlowMetrics, /resolveClientPortalAccess/);
  assert.match(leadFlowMetrics, /entities\.Leads\.filter\(\s*\{\s*client_project_id: access\.project\.id\s*\}/);
});

test("launch hardening exposes launch audit data and locks metrics snapshots to automation auth plus project ownership", () => {
  const installConfig = readRepoFile("base44/functions/getInstallConfiguration/entry.ts");
  const metricsSnapshot = readRepoFile("base44/functions/updateMetricsSnapshot/entry.ts");
  const workspace = readRepoFile("src/components/admin/InstallOrderWorkspace.jsx");

  assert.match(installConfig, /lead_ingestion_setup:/);
  assert.match(installConfig, /launch_readiness:/);

  assert.match(metricsSnapshot, /allowAnonymousAutomation/);
  assert.match(metricsSnapshot, /req\.method !== "POST"/);
  assert.match(metricsSnapshot, /entities\.Leads\.filter\(\s*\{\s*client_project_id: project_id\s*\}/);
  assert.match(metricsSnapshot, /CommunicationEvent\.filter\(\s*\{\s*client_project_id: project_id\s*\}/);

  assert.match(workspace, /LeadIngestionSetupPanel/);
  assert.match(workspace, /LaunchReadinessPanel/);
});
