import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const endpointSource = readFileSync("base44/functions/getClientPortalContext/entry.ts", "utf8");
const communicationEventSchema = JSON.parse(
  readFileSync("base44/entities/CommunicationEvent.jsonc", "utf8")
);

test("client portal context logs authenticated portal login outcomes", () => {
  assert.match(endpointSource, /function buildPortalLoginEvent/);
  assert.match(endpointSource, /CommunicationEvent\.create/);
  assert.match(endpointSource, /event_type:\s*"portal_login"/);
  assert.match(endpointSource, /channel:\s*"internal"/);
  assert.match(endpointSource, /direction:\s*"system"/);
  assert.match(endpointSource, /provider:\s*"internal"/);
  assert.match(endpointSource, /status:\s*"processed"/);
  assert.match(endpointSource, /context_type:\s*"client_portal"/);
  assert.match(endpointSource, /metadata_json:\s*JSON\.stringify/);
  assert.match(endpointSource, /catch \(error\)/);

  for (const linkStatus of [
    "no_paid_order",
    "ambiguous_paid_orders",
    "missing_canonical_links",
    "linked_records_missing",
    "linked",
  ]) {
    assert.match(endpointSource, new RegExp(`linkStatus:\\s*"${linkStatus}"`));
  }
});

test("CommunicationEvent schema accepts portal_login audit records", () => {
  assert.ok(
    communicationEventSchema.properties.event_type.enum.includes("portal_login")
  );
});
