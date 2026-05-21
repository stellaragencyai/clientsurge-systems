import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildAdminConversionFunnel } from "../src/lib/adminConversionFunnel.js";

const dashboard = readFileSync(
  new URL("../src/components/admin/LeadManagementDashboard.jsx", import.meta.url),
  "utf8"
);

test("admin leads exposes a css-only conversion funnel chart", () => {
  assert.match(dashboard, /function ConversionFunnelChart/);
  assert.match(dashboard, /buildAdminConversionFunnel/);
  assert.match(dashboard, /<ConversionFunnelChart summary=\{snapshot\.summary\}/);
  assert.match(dashboard, /style=\{\{ width: `\$\{stage\.percentage\}%` \}\}/);
});

test("admin conversion funnel rolls up lead contacted booked and paid stages", () => {
  const stages = buildAdminConversionFunnel({
    total_leads: 20,
    stage_counts: {
      new: 4,
      working: 6,
      qualified: 5,
      booked: 3,
      closed: 2,
    },
    status_counts: {
      New: 4,
      Contacted: 3,
      Replied: 3,
      Qualified: 5,
      Booked: 3,
      Client: 2,
    },
  });

  assert.deepEqual(
    stages.map(({ key, count, percentage }) => ({ key, count, percentage })),
    [
      { key: "lead", count: 20, percentage: 100 },
      { key: "contacted", count: 16, percentage: 80 },
      { key: "booked", count: 5, percentage: 25 },
      { key: "paid", count: 2, percentage: 10 },
    ]
  );
});

test("admin conversion funnel handles empty snapshots without fake percentages", () => {
  const stages = buildAdminConversionFunnel({});

  assert.deepEqual(
    stages.map(({ key, count, percentage }) => ({ key, count, percentage })),
    [
      { key: "lead", count: 0, percentage: 0 },
      { key: "contacted", count: 0, percentage: 0 },
      { key: "booked", count: 0, percentage: 0 },
      { key: "paid", count: 0, percentage: 0 },
    ]
  );
});
