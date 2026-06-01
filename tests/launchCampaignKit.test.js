import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const launchKit = readFileSync(
  new URL("../docs/LAUNCH_CAMPAIGN_KIT.md", import.meta.url),
  "utf8"
);
const brochure = readFileSync(
  new URL("../public/launch/clientsurge-launch-brochure.html", import.meta.url),
  "utf8"
);

test("launch campaign kit protects canonical package prices and deal boundaries", () => {
  assert.match(launchKit, /Starter System at \$797 setup and \$497\/month/);
  assert.match(launchKit, /Growth System at \$1,297 setup and \$997\/month/);
  assert.match(launchKit, /Elite System at \$2,497 setup and \$1,997\/month/);
  assert.match(launchKit, /No discount is advertised unless the matching checkout\/coupon path exists/);
});

test("launch campaign kit includes email deliverability and compliance guardrails", () => {
  assert.match(launchKit, /RESEND_FROM_EMAIL/);
  assert.match(launchKit, /FTC CAN-SPAM guide/);
  assert.match(launchKit, /working opt-out method/);
  assert.match(launchKit, /Resend domain authentication/);
});

test("launch brochure has the current package ladder and audit CTA", () => {
  assert.match(brochure, /Starter System/);
  assert.match(brochure, /\$797 setup \/ \$497 per month/);
  assert.match(brochure, /Growth System/);
  assert.match(brochure, /\$1,297 setup \/ \$997 per month/);
  assert.match(brochure, /Elite System/);
  assert.match(brochure, /\$2,497 setup \/ \$1,997 per month/);
  assert.match(brochure, /https:\/\/clientsurgesystems\.com\/book/);
});

test("launch brochure PDF is generated beside the printable HTML source", () => {
  assert.ok(
    existsSync(new URL("../public/launch/clientsurge-launch-brochure.html", import.meta.url))
  );
  assert.ok(
    existsSync(new URL("../public/launch/clientsurge-launch-brochure.pdf", import.meta.url))
  );
});
