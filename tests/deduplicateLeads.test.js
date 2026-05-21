import test from "node:test";
import assert from "node:assert/strict";

import {
  getLeadDedupKey,
  groupDuplicateLeads,
  normalizeLeadPhone,
  selectLeadKeeper,
} from "../base44/functions/deduplicateLeads/deduplicateLeads.shared.js";

test("deduplicateLeads normalizes US phone formatting before grouping", () => {
  assert.equal(normalizeLeadPhone("+1 (602) 555-0100"), "6025550100");
  assert.equal(normalizeLeadPhone("602.555.0100"), "6025550100");
  assert.equal(getLeadDedupKey({ phone: "+1 (602) 555-0100" }), "phone:6025550100");
});

test("deduplicateLeads groups duplicate phone hashes before raw phone fallback", () => {
  const groups = groupDuplicateLeads([
    { id: "a", phone_hash: "same-hash", phone: "6025550100" },
    { id: "b", phone_hash: "same-hash", phone: "4805550100" },
    { id: "c", phone: "4805550101" },
  ]);

  assert.deepEqual(Object.keys(groups), ["hash:same-hash"]);
  assert.deepEqual(groups["hash:same-hash"].map((lead) => lead.id), ["a", "b"]);
});

test("deduplicateLeads groups normalized phones when no phone hash exists", () => {
  const groups = groupDuplicateLeads([
    { id: "a", phone: "+1 (602) 555-0100" },
    { id: "b", phone: "602-555-0100" },
  ]);

  assert.deepEqual(Object.keys(groups), ["phone:6025550100"]);
});

test("deduplicateLeads keeps highest score and then newest lead", () => {
  const keeper = selectLeadKeeper([
    { id: "older", lead_score: 80, created_date: "2026-05-01T00:00:00Z" },
    { id: "newer", lead_score: 80, created_date: "2026-05-02T00:00:00Z" },
    { id: "lower", lead_score: 40, created_date: "2026-05-03T00:00:00Z" },
  ]);

  assert.equal(keeper.id, "newer");
});
