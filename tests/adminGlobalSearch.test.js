import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminGlobalSearchResults,
  getAdminGlobalSearchPlaceholder,
} from "../src/lib/adminGlobalSearch.js";
import { PLATFORM_SEARCH_RESULT_FIELDS } from "../src/lib/platformIntegrationFoundation.js";

test("admin global search includes all Phase F platform source types", () => {
  const results = buildAdminGlobalSearchResults({
    customers: [{ id: "client_1", business_name: "Phoenix Roofing", client_email: "owner@example.com" }],
    leads: [{ id: "lead_1", business_name: "Phoenix Med Spa", email: "lead@example.com" }],
    conversations: [{ id: "support_1", subject: "Phoenix portal question", sender_email: "client@example.com" }],
    ai_workers: [{ id: "worker_1", name: "Phoenix responder", owner: "AI Ops" }],
    timeline_events: [{ id: "event_1", type: "Phoenix handoff", actor: "Nolan" }],
    settings: [{ id: "notifications", title: "Phoenix notifications", scope: "Organization" }],
    billing: [{ id: "order_1", business_name: "Phoenix Dental", customer_email: "billing@example.com" }],
    documents: [{ id: "doc_1", title: "Phoenix launch plan", owner: "Ops" }],
  }, "phoenix");

  assert.deepEqual(results.map((result) => result.type), [
    "customer",
    "lead",
    "conversation",
    "ai_worker",
    "timeline_event",
    "setting",
    "billing",
    "document",
  ]);
  assert.deepEqual(results.map((result) => result.tab), [
    "client-projects",
    "leads",
    "inbox",
    "automations",
    "audit-log",
    "settings",
    "revenue",
    "resource-library",
  ]);

  for (const result of results) {
    for (const field of PLATFORM_SEARCH_RESULT_FIELDS) {
      assert.ok(result[field], `${field} should be present on ${result.type}`);
    }
  }
});

test("admin global search ignores short queries and exposes all-entity placeholder", () => {
  assert.deepEqual(buildAdminGlobalSearchResults({ lead: [{ id: "1", business_name: "AI" }] }, "a"), []);
  assert.equal(getAdminGlobalSearchPlaceholder(), "Search customers, leads, conversations, AI workers, settings, billing...");
});
