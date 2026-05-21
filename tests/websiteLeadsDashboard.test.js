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

test("website lead query keeps all leads unfiltered and scopes status filters", () => {
  assert.deepEqual(buildWebsiteLeadQuery("all"), {});
  assert.deepEqual(buildWebsiteLeadQuery("new"), { lead_status: "new" });
  assert.deepEqual(buildWebsiteLeadQuery("booked"), { lead_status: "booked" });
});

test("website leads pagination supports 50+ lead review", () => {
  const leads = Array.from({ length: 53 }, (_, index) => ({ id: `lead-${index + 1}` }));

  assert.equal(WEBSITE_LEADS_PAGE_SIZE, 25);
  assert.equal(getWebsiteLeadFetchLimit(1), 26);
  assert.equal(getWebsiteLeadFetchLimit(2), 51);
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
