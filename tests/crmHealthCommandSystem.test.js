import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  buildCrmHealthSnapshot,
  buildFirstCampaignDryRun,
  maskEmail,
  maskPhone,
} from "../src/lib/crmHealth.js";

function read(path) {
  return readFileSync(path, "utf8");
}

const fixtureLeads = [
  {
    id: "lead_roofing_1",
    business_name: "Riley Roofing",
    full_name: "Riley Owner",
    email: "owner@rileyroofing.example",
    phone: "602-555-0101",
    website_url: "https://rileyroofing.example",
    industry: "roofing",
    crm_tag: "roofing_lead",
    status: "New",
    crm_stage: "Not Contacted",
    normalized_email: "owner@rileyroofing.example",
    normalized_phone: "+16025550101",
    source_history: ["csv_import"],
    last_contacted_at: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "lead_roofing_duplicate",
    business_name: "Riley Roofing Branch",
    full_name: "Branch Owner",
    email: "OWNER@rileyroofing.example",
    phone: "602-555-0199",
    website_url: "https://rileyroofing.example",
    industry: "roofing",
    crm_tag: "roofing_lead",
    status: "New",
    crm_stage: "Not Contacted",
    normalized_email: "owner@rileyroofing.example",
    source_history: ["csv_import"],
  },
  {
    id: "lead_roofing_dnc",
    business_name: "Quiet Roofing",
    email: "quiet@example.com",
    phone: "602-555-0102",
    industry: "roofing",
    do_not_contact: true,
    status: "New",
    crm_stage: "Not Contacted",
  },
  {
    id: "lead_roofing_unsubscribed",
    business_name: "Stop Roofing",
    email: "stop@example.com",
    phone: "602-555-0103",
    industry: "roofing",
    email_unsubscribed: true,
    status: "New",
    crm_stage: "Not Contacted",
  },
  {
    id: "lead_roofing_missing_email",
    business_name: "No Email Roofing",
    phone: "602-555-0104",
    website: "https://noemail.example",
    industry: "roofing",
    status: "New",
    crm_stage: "Not Contacted",
  },
  {
    id: "lead_roofing_recent",
    business_name: "Recent Roofing",
    email: "recent@example.com",
    phone: "602-555-0105",
    website: "https://recent.example",
    industry: "roofing",
    status: "Contacted",
    crm_stage: "Contacted",
    last_contacted_at: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "lead_hvac_1",
    business_name: "Hayden HVAC",
    email: "owner@haydenhvac.example",
    phone: "602-555-0201",
    website_url: "https://haydenhvac.example",
    industry: "hvac",
    crm_tag: "hvac_lead",
    status: "New",
    crm_stage: "Not Contacted",
    source_history: ["csv_import"],
  },
  {
    id: "lead_closed",
    business_name: "Closed Dental",
    email: "closed@example.com",
    phone: "602-555-0301",
    industry: "dental",
    status: "Closed",
    crm_stage: "Won",
  },
];

test("CRM Health snapshot reports required summary cards and read-only launch mappings", () => {
  const snapshot = buildCrmHealthSnapshot(fixtureLeads, {
    now: "2026-06-06T12:00:00.000Z",
    previewIndustry: "roofing",
  });

  assert.equal(snapshot.summary.total_leads, 8);
  assert.equal(snapshot.summary.missing_email, 1);
  assert.equal(snapshot.summary.suppressed_leads, 3);
  assert.equal(snapshot.summary.unsubscribed, 1);
  assert.equal(snapshot.summary.dnc, 1);
  assert.equal(snapshot.summary.duplicate_groups >= 1, true);
  assert.equal(snapshot.summary.campaign_eligible_leads, 3);
  assert.equal(snapshot.launch_command_center.category, "F CRM / Leads");
  assert.equal(snapshot.launch_command_center.mode, "documentation_only_until_launch_entities_exist");
  assert.ok(snapshot.launch_command_center.tasks.includes("Prepare 25-lead preview"));
  assert.ok(snapshot.launch_command_center.proofs.includes("First campaign dry-run preview"));
});

test("first campaign preview excludes unsafe leads and returns only masked samples", () => {
  const preview = buildFirstCampaignDryRun(fixtureLeads, {
    industry: "roofing",
    maxCount: 25,
    now: "2026-06-06T12:00:00.000Z",
  });

  assert.equal(preview.dry_run_only, true);
  assert.equal(preview.safe_to_send, false);
  assert.equal(preview.total_matching, 6);
  assert.equal(preview.suppressed_excluded, 2);
  assert.equal(preview.missing_email_excluded, 1);
  assert.equal(preview.recently_contacted_excluded, 1);
  assert.equal(preview.duplicate_excluded_count, 1);
  assert.equal(preview.final_selected_count, 1);

  const serialized = JSON.stringify(preview.selected_preview_masked);
  assert.doesNotMatch(serialized, /owner@rileyroofing\.example/i);
  assert.match(serialized, /o\*\*\*@rileyroofing\.example/);
  assert.match(serialized, /\*\*\*-\*\*\*-0101/);
});

test("mask helpers keep email and phone private", () => {
  assert.equal(maskEmail("Nolan@example.com"), "n***@example.com");
  assert.equal(maskPhone("(602) 555-1234"), "***-***-1234");
});

test("admin CRM Health tab is wired without sending or mutating campaigns", () => {
  const adminDashboard = read("src/internal-pages/AdminDashboard.jsx");
  const adminShell = read("src/components/admin/AdminShell.jsx");
  const crmDashboard = read("src/components/admin/CrmHealthDashboard.jsx");
  const campaignSender = read("base44/functions/sendEmailCampaign/entry.ts");

  assert.match(adminDashboard, /CrmHealthDashboard/);
  assert.match(adminDashboard, /id: 'crm-health', label: 'CRM Health'/);
  assert.match(adminShell, /id: "crm-health",\s+label: "CRM Health"/);
  assert.match(crmDashboard, /base44\.asServiceRole\.entities\.Leads\.list/);
  assert.doesNotMatch(crmDashboard, /\.update\(/);
  assert.doesNotMatch(crmDashboard, /\.create\(/);
  assert.doesNotMatch(crmDashboard, /sendEmailCampaign/);

  assert.match(campaignSender, /email_masked:\s*maskEmail\(l\.email\)/);
  assert.match(campaignSender, /phone_masked:\s*maskPhone\(l\.phone\)/);
  assert.doesNotMatch(campaignSender, /email:\s*l\.email/);
  assert.doesNotMatch(campaignSender, /name:\s*l\.full_name/);
});

test("CRM readiness doc covers source, suppression, privacy, proof, and LaunchTask dependency", () => {
  const doc = read("docs/CRM_LEADS_COMMAND_SYSTEM.md");

  assert.match(doc, /Base44 `Leads` entity/);
  assert.match(doc, /Usable Lead Definition/);
  assert.match(doc, /Suppression Rules/);
  assert.match(doc, /n\*\*\*@domain\.com/);
  assert.match(doc, /F CRM \/ Leads/);
  assert.match(doc, /LaunchCategory`, `LaunchTask`, and `LaunchProof` entities are not present/);
  assert.equal(existsSync("base44/entities/LaunchTask.jsonc"), false);
  assert.equal(existsSync("base44/entities/LaunchProof.jsonc"), false);
});
