import test from "node:test";
import assert from "node:assert/strict";

import {
  WEBSITE_LEAD_SORT_OPTIONS,
  WEBSITE_LEADS_PAGE_SIZE,
  buildWebsiteLeadQuery,
  getWebsiteLeadFetchLimit,
  getWebsiteLeadPage,
  hasNextWebsiteLeadPage,
  normalizeWebsiteLeadPage,
} from "../src/lib/websiteLeadsDashboard.js";

test("website lead query excludes non-production records and scopes status filters", () => {
  const allQuery = buildWebsiteLeadQuery("all");
  assert.ok(Array.isArray(allQuery.$nor));
  assert.ok(allQuery.$nor.length > 0);
  assert.equal(buildWebsiteLeadQuery("new").$and[0].lead_status, "new");
  assert.equal(buildWebsiteLeadQuery("booked").$and[0].lead_status, "booked");
});

test("website leads pagination supports 50+ lead review with fetch buffer", () => {
  const leads = Array.from({ length: 53 }, (_, index) => ({ id: `lead-${index + 1}` }));

  assert.equal(WEBSITE_LEADS_PAGE_SIZE, 25);
  assert.equal(getWebsiteLeadFetchLimit(1), 104);
  assert.equal(getWebsiteLeadFetchLimit(2), 204);
  assert.equal(getWebsiteLeadFetchLimit(1, WEBSITE_LEADS_PAGE_SIZE, false), 26);
  assert.equal(getWebsiteLeadPage(leads, 1).length, 25);
  assert.equal(getWebsiteLeadPage(leads, 2)[0].id, "lead-26");
  assert.equal(getWebsiteLeadPage(leads, 3).length, 3);
  assert.equal(hasNextWebsiteLeadPage(leads, 1), true);
  assert.equal(hasNextWebsiteLeadPage(leads, 2), true);
  assert.equal(hasNextWebsiteLeadPage(leads, 3), false);
});

test("website lead page and sort options are bounded", () => {
  assert.equal(normalizeWebsiteLeadPage(0), 1);
  assert.equal(normalizeWebsiteLeadPage("2"), 2);
  assert.equal(normalizeWebsiteLeadPage("bad"), 1);
  assert.deepEqual(
    WEBSITE_LEAD_SORT_OPTIONS.map((option) => option.value),
    ["-created_date", "created_date", "full_name", "-last_message_sent"]
  );
});
