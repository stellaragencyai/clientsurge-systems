import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PORTAL_AUTOMATION_ACCESS_NOTE,
  PORTAL_SETTINGS_SECTIONS,
} from "../src/lib/portalSettingsConfig.js";

test("portal settings no longer exposes a customer webhook editor section", () => {
  assert.deepEqual(
    PORTAL_SETTINGS_SECTIONS.map((section) => section.id),
    ["timeline", "automation-access"]
  );
  assert.match(PORTAL_AUTOMATION_ACCESS_NOTE.body, /contact support|operator/i);
});

test("portal webhook component no longer invokes admin settings functions", () => {
  const source = readFileSync(
    new URL("../src/components/portal/WebhookSettings.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /getAdminSettings/);
  assert.doesNotMatch(source, /updateAdminSettings/);
  assert.doesNotMatch(source, /dispatchLeadWebhook/);
});
