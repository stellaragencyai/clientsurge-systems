import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const backupStrategy = readFileSync(
  new URL("../docs/DATA_BACKUP_STRATEGY.md", import.meta.url),
  "utf8"
);
const adminRunbook = readFileSync(
  new URL("../docs/ADMIN_RUNBOOK.md", import.meta.url),
  "utf8"
);

test("data backup strategy covers critical Base44 entities and backup cadence", () => {
  for (const phrase of [
    "Leads",
    "WebsiteLead",
    "Order",
    "Subscription",
    "ClientProject",
    "OnboardingClient",
    "CommunicationEvent",
    "AutomationJob",
    "Daily during launch week",
    "Monthly operating archive",
    "clientsurge-entity-backup-YYYY-MM",
  ]) {
    assert.match(backupStrategy, new RegExp(phrase), `backup strategy includes ${phrase}`);
  }
});

test("monthly archive includes Google Sheets manifest and verification requirements", () => {
  for (const phrase of [
    "Monthly Google Sheets Archive",
    "BackupManifest",
    "Entity row counts",
    "Verification sample IDs",
    "Spot-check at least three paid/order-related records",
    "Restore Drill",
  ]) {
    assert.match(backupStrategy, new RegExp(phrase), `backup strategy includes ${phrase}`);
  }
});

test("backup strategy avoids secrets and requires approval for risky data actions", () => {
  for (const phrase of [
    "does not store secrets",
    "Never export or paste API keys",
    "Ask Nolan before",
    "new destination",
    "bulk-updating records",
  ]) {
    assert.match(backupStrategy, new RegExp(phrase), `backup strategy includes ${phrase}`);
  }
});

test("admin runbook links to the full backup strategy", () => {
  assert.match(adminRunbook, /docs\/DATA_BACKUP_STRATEGY\.md/);
  assert.match(adminRunbook, /monthly Google Sheets archive format/);
});
