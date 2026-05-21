import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../base44/functions/autoArchiveOldLeads/entry.ts", import.meta.url),
  "utf8"
);
const websiteLeadEntity = readFileSync(
  new URL("../base44/entities/WebsiteLead.jsonc", import.meta.url),
  "utf8"
);

test("autoArchiveOldLeads targets canonical WebsiteLead records", () => {
  assert.match(source, /entities\.WebsiteLead\.list/);
  assert.match(source, /entities\.WebsiteLead\.update/);
  assert.doesNotMatch(source, /SpaLead/);
});

test("autoArchiveOldLeads anonymizes WebsiteLead PII before marking archived", () => {
  for (const field of [
    "full_name",
    "first_name",
    "phone_number",
    "email",
    "business_name",
    "message",
    "problem",
    "user_agent",
    "ip_address",
    "consent_ip",
    "dedup_key",
    "archived",
    "archived_at",
  ]) {
    assert.match(source, new RegExp(`${field}:`), `archive patch sets ${field}`);
  }
});

test("autoArchiveOldLeads uses the shared automation guard and bounded batches", () => {
  assert.match(source, /allowAnonymousAutomation\(req\)/);
  assert.match(source, /MAX_ARCHIVE_BATCH_SIZE = 200/);
  assert.match(source, /old\.slice\(0, MAX_ARCHIVE_BATCH_SIZE\)/);
});

test("WebsiteLead schema exposes archive marker fields", () => {
  assert.match(websiteLeadEntity, /"archived"/);
  assert.match(websiteLeadEntity, /"archived_at"/);
});
