import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const base44Client = readFileSync(new URL("../src/api/base44Client.js", import.meta.url), "utf8");
const adminGateway = readFileSync(new URL("../base44/functions/adminDataGateway/main.ts", import.meta.url), "utf8");
const salesMetrics = readFileSync(new URL("../base44/functions/getSalesAutomationMetrics/main.ts", import.meta.url), "utf8");

test("frontend admin access goes through the guarded admin gateway", () => {
  assert.match(base44Client, /const ADMIN_GATEWAY_FUNCTION = "adminDataGateway";/);
  assert.match(base44Client, /client\.admin = \{/);
  assert.match(base44Client, /operation: "filter"/);
  assert.match(base44Client, /subscribe: \(\) => \(\) => \{\}/);
  assert.doesNotMatch(base44Client, /base44\.asServiceRole/);
});

test("admin gateway only permits known admin entities and functions", () => {
  assert.match(adminGateway, /await requireAdminUser\(base44\)/);
  assert.match(adminGateway, /const ALLOWED_ENTITIES = new Set/);
  assert.match(adminGateway, /"ClientProject"/);
  assert.match(adminGateway, /"CommunicationEvent"/);
  assert.match(adminGateway, /const ALLOWED_FUNCTIONS = new Set/);
  assert.match(adminGateway, /"getSalesAutomationMetrics"/);
});

test("sales automation metrics endpoint is not directly callable by non-admin users", () => {
  assert.match(salesMetrics, /await requireAdminUser\(base44\)/);
  assert.match(salesMetrics, /await req\.json\(\)\.catch/);
});
