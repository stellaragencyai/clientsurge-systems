import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("AdminSettings schema exposes allowed_admin_ips", () => {
  const schema = read("base44/entities/AdminSettings.jsonc");

  assert.match(schema, /"allowed_admin_ips"/);
  assert.match(schema, /"type": "array"/);
  assert.match(schema, /"default": \[\]/);
});

test("admin settings endpoints use the shared normalized settings save path", () => {
  const getEntry = read("base44/functions/getAdminSettings/entry.ts");
  const updateEntry = read("base44/functions/updateAdminSettings/entry.ts");

  assert.match(getEntry, /loadAdminSettings/);
  assert.match(updateEntry, /saveAdminSettings/);
  assert.match(updateEntry, /payload\?\.settings \|\| payload/);
});

test("admin settings panel exposes the IP allowlist editor", () => {
  const panel = read("src/components/admin/AdminSettingsPanel.jsx");

  assert.match(panel, /id: "security", label: "Security"/);
  assert.match(panel, /Allowed Admin IPs/);
  assert.match(panel, /allowed_admin_ips/);
  assert.match(panel, /split\(\/\[\\n,\]\//);
});

test("frontend settings API unwraps settings payloads", () => {
  const api = read("src/lib/adminSettingsApi.js");

  assert.match(api, /response\?\.data\?\.settings \|\| response\?\.data/);
  assert.match(api, /invoke\("updateAdminSettings", \{ settings \}\)/);
});
