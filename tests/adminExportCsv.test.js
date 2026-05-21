import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildLeadsCsv } from "../src/lib/leadCsvExport.js";

const leadManagementDashboard = readFileSync(
  new URL("../src/components/admin/LeadManagementDashboard.jsx", import.meta.url),
  "utf8"
);
const communicationLogsPanel = readFileSync(
  new URL("../src/components/admin/CommunicationLogsPanel.jsx", import.meta.url),
  "utf8"
);
const bulkActionToolbar = readFileSync(
  new URL("../src/components/admin/BulkActionToolbar.jsx", import.meta.url),
  "utf8"
);

test("lead CSV export escapes commas quotes and newlines", () => {
  const csv = buildLeadsCsv([
    {
      full_name: "Nolan, Test",
      business_name: 'Client "A"',
      email: "owner@example.com",
      phone: "+16025550123",
      status: "New",
      lead_score: 88,
      source: "website\nform",
    },
  ]);

  assert.match(csv, /Full Name,Business,Email,Phone,Status/);
  assert.match(csv, /"Nolan, Test"/);
  assert.match(csv, /"Client ""A"""/);
  assert.match(csv, /website form/);
});

test("lead admin exposes a visible export csv button", () => {
  assert.match(leadManagementDashboard, /handleExportVisibleLeads/);
  assert.match(leadManagementDashboard, /admin-leads-\$\{new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]\}\.csv/);
  assert.match(leadManagementDashboard, />\s*Export CSV\s*<\/button>/);
});

test("selected-lead toolbar reuses shared CSV export helper", () => {
  assert.match(bulkActionToolbar, /buildLeadsCsv/);
  assert.match(bulkActionToolbar, /downloadCsvFile/);
});

test("communication logs panel exposes export logs csv button", () => {
  assert.match(communicationLogsPanel, /buildCommunicationLogsCsv/);
  assert.match(communicationLogsPanel, /communication-logs-\$\{filter\}-\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}\.csv/);
  assert.match(communicationLogsPanel, /Export CSV/);
});
