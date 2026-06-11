import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clientProject = JSON.parse(
  readFileSync(new URL("../base44/entities/ClientProject.jsonc", import.meta.url), "utf8")
);
const automationChecklist = JSON.parse(
  readFileSync(new URL("../base44/entities/AutomationChecklist.jsonc", import.meta.url), "utf8")
);
const automationChecklistStep = JSON.parse(
  readFileSync(new URL("../base44/entities/AutomationChecklistStep.jsonc", import.meta.url), "utf8")
);

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const portalOwnershipSource = readFileSync(
  new URL("../base44/functions/_shared/portalOwnership.js", import.meta.url),
  "utf8"
);

function readDoc(path) {
  return readFileSync(new URL(`../docs/${path}`, import.meta.url), "utf8");
}

test("ClientProject schema exposes fulfillment and support status fields", () => {
  const properties = clientProject.properties;

  assert.deepEqual(properties.client_project_status.enum, [
    "Payment Received",
    "Onboarding Pending",
    "Access Requested",
    "Access Verified",
    "Setup In Progress",
    "QA In Progress",
    "Awaiting Client Approval",
    "Go-Live Scheduled",
    "Live",
    "Monitoring",
    "Monthly Support",
    "Blocked",
    "Paused",
    "Canceled",
  ]);
  assert.deepEqual(properties.support_priority.enum, ["Urgent", "High", "Normal", "Low"]);
  assert.deepEqual(properties.qa_status.enum, ["Not Started", "In Progress", "Passed", "Failed", "Blocked"]);
  assert.deepEqual(properties.client_approval_status.enum, [
    "Not Requested",
    "Requested",
    "Approved",
    "Changes Requested",
    "Blocked",
  ]);
  assert.deepEqual(properties.monitoring_status.enum, [
    "Not Started",
    "Day 1",
    "Day 2",
    "Day 3",
    "Day 7",
    "Monthly Support",
    "Blocked",
    "Complete",
  ]);
});

test("automation checklist schemas cover required fulfillment automations", () => {
  const requiredKeys = [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
    "daily_lead_digest",
    "inbound_sms_assistant",
    "ai_voice_receptionist",
  ];

  for (const key of requiredKeys) {
    assert.ok(automationChecklist.properties.service_key.enum.includes(key), `${key} missing from AutomationChecklist`);
    assert.ok(automationChecklistStep.properties.service_key.enum.includes(key), `${key} missing from AutomationChecklistStep`);
  }
});

test("fulfillment operating docs include required lifecycle, support, monitoring, and handoff surfaces", () => {
  const fulfillment = readDoc("FULFILLMENT_OPERATING_SYSTEM.md");
  const access = readDoc("CLIENT_ONBOARDING_ACCESS_CHECKLIST.md");
  const acceptance = readDoc("AUTOMATION_ACCEPTANCE_CRITERIA.md");
  const support = readDoc("CLIENT_SUPPORT_WORKFLOW.md");
  const monitoring = readDoc("POST_LAUNCH_MONITORING_CHECKLIST.md");
  const handoff = readDoc("CLIENT_HANDOFF_TEMPLATE.md");
  const mapping = readDoc("FULFILLMENT_LAUNCHTASK_MAPPING.md");

  for (const stage of [
    "Payment Received",
    "Access Verified",
    "QA Passed",
    "Go-Live Completed",
    "Day 7 Monitoring",
    "Monthly Support",
  ]) {
    assert.match(fulfillment, new RegExp(stage));
  }

  for (const status of ["Not Requested", "Requested", "Received", "Verified", "Blocked", "Not Needed"]) {
    assert.match(access, new RegExp(status));
  }

  for (const automation of ["Daily Lead Digest", "Inbound SMS Assistant", "AI Voice Receptionist"]) {
    assert.match(acceptance, new RegExp(automation));
  }

  for (const priority of ["Urgent", "High", "Normal", "Low"]) {
    assert.match(support, new RegExp(`### ${priority}`));
  }

  for (const day of ["## Day 1", "## Day 2", "## Day 3", "## Day 7"]) {
    assert.match(monitoring, new RegExp(day));
  }

  assert.match(handoff, /## Client Approval/);
  assert.match(mapping, /No `LaunchTask` entity exists/);
});

test("portal and admin fulfillment surfaces remain protected or ownership scoped", () => {
  assert.match(appSource, /routePath\("client-portal"\), Component: ClientPortal/);
  assert.match(appSource, /routePath\("client-dashboard"\), Component: ClientDashboard/);
  assert.match(appSource, /<ProtectedRoute\s+unauthenticatedElement=\{<AuthRedirectFallback \/>\}/);
  assert.match(appSource, /allowedRoles=\{\["admin", "super_admin"\]\}/);
  assert.match(portalOwnershipSource, /resolveClientPortalAccess/);
  assert.match(portalOwnershipSource, /portal_project_ambiguous/);
  assert.match(portalOwnershipSource, /portal_project_not_found/);
});
