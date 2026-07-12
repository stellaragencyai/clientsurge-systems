import test from "node:test";
import assert from "node:assert/strict";

import {
  LAUNCH_EMAIL_CAMPAIGNS as FRONTEND_CAMPAIGNS,
} from "../src/lib/launchEmailCampaigns.js";
import {
  LAUNCH_EMAIL_CAMPAIGNS as BACKEND_CAMPAIGNS,
} from "../base44/functions/_shared/launchEmailCampaigns.js";

const FORBIDDEN_CLAIMS = /(?:\b\d{1,3}%\b|\b\d+[-–]\d+\s+new bookings|guaranteed|double your|triple your|client result|case study|recovered \$|revenue increase|conversion increase)/i;

test("frontend and backend launch campaign drafts remain identical", () => {
  assert.deepEqual(FRONTEND_CAMPAIGNS, BACKEND_CAMPAIGNS);
});

test("launch campaign library contains exactly the five priority industries", () => {
  assert.deepEqual(
    FRONTEND_CAMPAIGNS.map((campaign) => campaign.key),
    ["roofing", "hvac", "dental", "med_spa", "plumbing"],
  );
});

test("every first-touch campaign is concise, permission-based, and claim-safe", () => {
  for (const campaign of FRONTEND_CAMPAIGNS) {
    assert.ok(campaign.campaign_name.startsWith("Launch —"));
    assert.ok(campaign.subject.includes("{business_name}"));
    assert.match(campaign.body_text, /Hi \{first_name\}/);
    assert.match(campaign.body_text, /brief automation audit/i);
    assert.match(campaign.body_text, /Nolan\nClientSurge Systems/);
    assert.doesNotMatch(campaign.subject, FORBIDDEN_CLAIMS);
    assert.doesNotMatch(campaign.body_text, FORBIDDEN_CLAIMS);
    assert.deepEqual(campaign.statuses, ["New"]);
    assert.equal(campaign.tags.length, 1);
    assert.match(campaign.landing_page_url, /^https:\/\/clientsurgesystems\.com\//);
  }
});
