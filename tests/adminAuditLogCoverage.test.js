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

  assert.match(helper, /entity_name:/);
  assert.match(helper, /record_id:/);
  assert.doesNotMatch(helper, /\bentity:\s*opts\.entity\b/);
  assert.doesNotMatch(helper, /\bentity_id:\s*opts\.entity_id\b/);
});
