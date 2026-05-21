import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("admin mutation functions write AuditLog records for task 385", () => {
  const leadStatus = read("base44/functions/updateLeadStatus/entry.ts");
  const installStatus = read("base44/functions/updateInstallStatus/entry.ts");

  assert.match(leadStatus, /createAuditLog/);
  assert.match(leadStatus, /update_lead_status/);
  assert.match(leadStatus, /entity_name:\s*"Leads"/);

  assert.match(installStatus, /createAuditLog/);
  assert.match(installStatus, /update_install_status/);
  assert.match(installStatus, /entity_name:\s*"Order"/);
});

test("shared audit helper writes fields that exist on the AuditLog entity", () => {
  const helper = read("base44/functions/shared/auditLog.ts");
  const entity = read("base44/entities/AuditLog.jsonc");

  assert.match(helper, /entity_name:/);
  assert.match(helper, /record_id:/);
  assert.match(helper, /timestamp: new Date\(\)\.toISOString\(\)/);
  assert.match(helper, /base44\.asServiceRole\.entities\.AuditLog\?\.create\?\.\(/);
  assert.match(entity, /"name": "AuditLog"/);
  assert.match(entity, /"admin_email"/);
  assert.match(entity, /"action"/);
  assert.match(entity, /"entity_name"/);
  assert.match(entity, /"record_id"/);
  assert.doesNotMatch(helper, /\bentity:\s*opts\.entity\b/);
  assert.doesNotMatch(helper, /\bentity_id:\s*opts\.entity_id\b/);
});

test("admin dashboard exposes a dedicated AuditLog viewer tab", () => {
  const dashboard = read("src/internal-pages/AdminDashboard.jsx");
  const shell = read("src/components/admin/AdminShell.jsx");
  const panel = read("src/components/admin/AuditLogPanel.jsx");

  assert.match(dashboard, /import AuditLogPanel from '\.\.\/components\/admin\/AuditLogPanel'/);
  assert.match(dashboard, /id: 'audit-log', label: 'Audit Log'/);
  assert.match(dashboard, /case 'audit-log': return <AuditLogPanel \/>/);
  assert.match(shell, /id: "audit-log",\s+label: "Audit Log"/);
  assert.match(panel, /base44\.asServiceRole\.entities\.AuditLog\.list\('-timestamp', LIMIT\)/);
  assert.match(panel, /audit-log-\$\{new Date\(\)\.toISOString\(\)\.slice\(0, 10\)\}\.csv/);
  assert.match(panel, /Search action, admin, entity, record, or notes/);
});
