import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const portal = readFileSync(new URL("../src/internal-pages/ClientPortal.jsx", import.meta.url), "utf8");
const referral = readFileSync(new URL("../src/components/portal/ReferABusiness.jsx", import.meta.url), "utf8");

test("client portal exposes a referrals tab that renders ReferABusiness", () => {
  assert.match(portal, /id:\s*"referrals"/);
  assert.match(portal, /label:\s*"Referrals"/);
  assert.match(portal, /<ReferABusiness/);
  assert.match(portal, /portalOrder\?\.id \|\| project\?\.id \|\| user\?\.email/);
});

test("referral component generates a stable client-specific referral code", () => {
  assert.match(referral, /refSource = order_id \|\| client_name \|\| "clientsurge"/);
  assert.match(referral, /btoa\(`ref_\$\{refSource\}`\)/);
  assert.match(referral, /clientsurgesystems\.com\/\?ref=/);
});
