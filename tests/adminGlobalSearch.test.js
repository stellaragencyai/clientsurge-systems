import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminGlobalSearchResults,
  getAdminGlobalSearchPlaceholder,
} from "../src/lib/adminGlobalSearch.js";

test("admin global search includes leads, clients, orders, and support messages", () => {
  const results = buildAdminGlobalSearchResults({
    lead: [{ id: "lead_1", business_name: "Phoenix Med Spa", email: "lead@example.com" }],
    client: [{ id: "client_1", business_name: "Phoenix Roofing", client_email: "owner@example.com" }],
    order: [{ id: "order_1", business_name: "Phoenix Dental", customer_email: "billing@example.com" }],
    support: [{ id: "support_1", sender_name: "Nolan", message: "Phoenix portal question" }],
  }, "phoenix");

  assert.deepEqual(results.map((result) => result.type), ["lead", "client", "order", "support"]);
  assert.deepEqual(results.map((result) => result.tab), ["leads", "client-projects", "install-queue", "inbox"]);
});

test("admin global search ignores short queries and exposes all-entity placeholder", () => {
  assert.deepEqual(buildAdminGlobalSearchResults({ lead: [{ id: "1", business_name: "AI" }] }, "a"), []);
  assert.equal(getAdminGlobalSearchPlaceholder(), "Search leads, clients, orders, support...");
});
