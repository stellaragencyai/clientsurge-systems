import test from "node:test";
import assert from "node:assert/strict";

import { parseLeadImportRows } from "../src/lib/leadImportParser.js";

test("parseLeadImportRows accepts CSV lead exports with quoted commas", () => {
  const rows = parseLeadImportRows(
    'full_name,business_name,email,phone,status\n"Alex Doe","Signal, Med Spa",alex@example.com,6025550101,Contacted'
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].full_name, "Alex Doe");
  assert.equal(rows[0].business_name, "Signal, Med Spa");
  assert.equal(rows[0].email, "alex@example.com");
});

test("parseLeadImportRows keeps JSON array import compatibility", () => {
  const rows = parseLeadImportRows('[{"full_name":"Taylor New","email":"taylor@example.com"}]');

  assert.equal(rows.length, 1);
  assert.equal(rows[0].full_name, "Taylor New");
});

test("parseLeadImportRows accepts tab-separated exports", () => {
  const rows = parseLeadImportRows("full_name\tbusiness_name\temail\nJamie Lead\tGlow Dental\tjamie@example.com");

  assert.equal(rows.length, 1);
  assert.equal(rows[0].business_name, "Glow Dental");
});
