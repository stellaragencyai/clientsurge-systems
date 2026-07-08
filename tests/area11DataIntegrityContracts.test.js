import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectDataIntegrityAudit } from "../scripts/audit-area11-data-integrity.mjs";

function parseJsonc(path) {
  const raw = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  return JSON.parse(raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""));
}

const report = collectDataIntegrityAudit();
const byEntity = new Map(report.rows.map((row) => [row.entity, row]));
const communicationEvent = parseJsonc("base44/entities/CommunicationEvent.jsonc");
const messages = parseJsonc("base44/entities/Messages.jsonc");
const sendSmsSource = readFileSync(new URL("../base44/functions/sendSMS/entry.ts", import.meta.url), "utf8");

test("Area 11 data integrity audit covers the core CRM/order/deployment/log entities", () => {
  assert.ok(report.summary.total_entity_files >= 20, `expected broad entity inventory, saw ${report.summary.total_entity_files}`);
  for (const entity of ["Order", "ClientProject", "ClientDeployment", "AutomationExecutionLog", "CommunicationEvent", "Messages", "WebsiteLead"]) {
    assert.ok(byEntity.has(entity), `${entity} should be audited`);
  }
});

test("Area 11 core entity contracts have no missing relationship fields or RLS markers", () => {
  const failures = report.findings;
  assert.deepEqual(failures, [], `data integrity findings: ${JSON.stringify(failures, null, 2)}`);
});

test("Area 11 CommunicationEvent schema supports compliance and guardrail events used by runtime code", () => {
  const eventTypes = communicationEvent.properties.event_type.enum;
  const providers = communicationEvent.properties.provider.enum;
  const statuses = communicationEvent.properties.status.enum;
  for (const value of ["sms_blocked", "email_blocked", "outbound_hold", "tenant_scope_blocked"]) {
    assert.ok(eventTypes.includes(value), `event_type should include ${value}`);
  }
  for (const value of ["internal_guardrail", "internal_compliance_guard", "twilio", "resend"]) {
    assert.ok(providers.includes(value), `provider should include ${value}`);
  }
  for (const value of ["blocked", "skipped", "failed", "processed"]) {
    assert.ok(statuses.includes(value), `status should include ${value}`);
  }
});

test("Area 11 Messages schema supports outbound and unmatched inbound message evidence", () => {
  const props = messages.properties;
  for (const field of ["from_address", "from_number", "from_phone", "lead_phone", "to_address", "provider", "provider_message_id", "metadata_json"]) {
    assert.ok(props[field], `Messages should define ${field}`);
  }
  assert.equal(messages.required.includes("lead_id"), false, "Messages should allow unmatched inbound evidence without lead_id");
  assert.ok(props.tenant_scope_status.enum.includes("unmatched"));
  assert.ok(props.status.enum.includes("opt_out_unmatched"));
  assert.ok(props.status.enum.includes("blocked"));
});

test("Area 11 sendSMS runtime writes are covered by entity schemas", () => {
  assert.match(sendSmsSource, /event_type: 'sms_blocked'/);
  assert.match(sendSmsSource, /provider: 'internal_compliance_guard'/);
  assert.match(sendSmsSource, /status: 'blocked'/);
  assert.match(sendSmsSource, /to_address: normalizedPhone/);
  assert.ok(communicationEvent.properties.event_type.enum.includes("sms_blocked"));
  assert.ok(communicationEvent.properties.provider.enum.includes("internal_compliance_guard"));
  assert.ok(communicationEvent.properties.status.enum.includes("blocked"));
  assert.ok(messages.properties.to_address);
});
