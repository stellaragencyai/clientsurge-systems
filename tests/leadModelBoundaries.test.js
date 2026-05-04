import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const websiteOnlyFunctions = [
  "base44/functions/submitLeadCapture/entry.ts",
  "base44/functions/submitContactInquiry/entry.ts",
  "base44/functions/scheduleDemoBooking/entry.ts",
  "base44/functions/trackContactFormCompletion/entry.ts",
  "base44/functions/createDemoCalendarEvent/entry.ts",
];

const lockedDownWebsiteFunctions = [];

const canonicalCustomerRuntimeFiles = [
  "base44/functions/webhookLeadCapture/entry.ts",
  "base44/functions/getLeadPipelineSummary/entry.ts",
  "base44/functions/updateLeadStatus/entry.ts",
  "base44/functions/manageLeadNotes/entry.ts",
  "base44/functions/routeLead/entry.ts",
  "base44/functions/scoreLeads/entry.ts",
  "base44/functions/syncLeadToCRM/entry.ts",
  "base44/functions/processDripCampaigns/entry.ts",
  "base44/functions/triggerFollowUpSequence/entry.ts",
  "base44/functions/sendTestLead/entry.ts",
  "base44/functions/_shared/installRuntime.js",
];

const quarantinedLegacyEndpoints = [
  "base44/functions/sendLeadConfirmationEmail/entry.ts",
  "base44/functions/sendFollowUpEmail/entry.ts",
  "base44/functions/onLeadCreated/entry.ts",
  "base44/functions/handleBookingTrigger/entry.ts",
  "base44/functions/sendBookingEmail/entry.ts",
  "base44/functions/sendBookingLinkSMS/entry.ts",
];

test("platform website functions are explicitly labeled and scoped to WebsiteLead", () => {
  for (const relativePath of websiteOnlyFunctions) {
    const source = readRepoFile(relativePath);

    assert.match(source, /PLATFORM-WEBSITE-ONLY/);
    assert.match(source, /WebsiteLead/);
    assert.doesNotMatch(source, /entities\.Lead\b/);
  }

  for (const relativePath of lockedDownWebsiteFunctions) {
    const source = readRepoFile(relativePath);

    assert.match(source, /PLATFORM-WEBSITE-ONLY/);
    assert.match(source, /canonical lockdown|canonical paid-customer automation engine|WebsiteLead/i);
    assert.match(source, /buildLegacyEndpointResponse/);
  }
});

test("website capture functions write WebsiteLead records instead of canonical Leads", () => {
  for (const relativePath of websiteOnlyFunctions.slice(0, 2)) {
    const source = readRepoFile(relativePath);

    assert.match(source, /entities\.WebsiteLead\./);
    assert.doesNotMatch(source, /entities\.Leads\.(create|update)\(/);
  }
});

test("submitLeadCapture is explicitly labeled as WebsiteLead-only intake", () => {
  const source = readRepoFile("base44/functions/submitLeadCapture/entry.ts");

  assert.match(source, /PLATFORM-WEBSITE-ONLY/);
  assert.match(source, /WebsiteLead/);
  assert.match(source, /entities\.WebsiteLead\./);
  assert.doesNotMatch(source, /entities\.Leads\.(create|update)\(/);
});

test("canonical customer runtime files do not use legacy Lead or platform WebsiteLead entities", () => {
  for (const relativePath of canonicalCustomerRuntimeFiles) {
    const source = readRepoFile(relativePath);

    assert.doesNotMatch(source, /entities\.Lead\b/);
    assert.doesNotMatch(source, /entities\.WebsiteLead\b/);
  }
});

test("customer admin analytics excludes platform website-only CommunicationEvent activity", () => {
  const source = readRepoFile("base44/functions/getAdminAnalytics/entry.ts");

  assert.match(source, /\.filter\(\(ev\) => Boolean\(ev\.lead_id\)\)/);
  assert.doesNotMatch(source, /website_lead_id:\s*ev\.website_lead_id/);
});

test("canonical customer ingestion entrypoint delegates to the shared Leads ingestion path", () => {
  const source = readRepoFile("base44/functions/webhookLeadCapture/entry.ts");

  assert.match(source, /CUSTOMER-CANONICAL/);
  assert.match(source, /ingestCustomerLead/);
  assert.doesNotMatch(source, /WebsiteLead/);
  assert.doesNotMatch(source, /entities\.Lead\b/);
});

test("legacy endpoints are quarantined behind structured legacy responses", () => {
  for (const relativePath of quarantinedLegacyEndpoints) {
    const source = readRepoFile(relativePath);

    assert.match(source, /buildLegacyEndpointResponse/);
    assert.match(source, /Deno\.serve\(/);
  }
});

test("admin UI labels distinguish customer leads, platform website leads, and legacy lead surfaces", () => {
  const adminDashboard = readRepoFile("src/pages/AdminDashboard.jsx");
  const leadManagement = readRepoFile("src/components/admin/LeadManagementDashboard.jsx");
  const analyticsDashboard = readRepoFile("src/components/admin/AnalyticsDashboard.jsx");
  const legacyLeadIntelligence = readRepoFile("src/pages/LeadIntelligence.jsx");

  assert.match(adminDashboard, /Website Leads/);
  assert.match(leadManagement, /Platform Website Leads/);
  assert.match(analyticsDashboard, /Customer Lead Analytics/);
  assert.match(legacyLeadIntelligence, /Legacy Lead Discovery Workspace/);
});
