import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminGlobalSearchResponse,
  buildAdminGlobalSearchResults,
  getAdminGlobalSearchAdapterPlan,
  getAdminGlobalSearchPlaceholder,
  loadAdminGlobalSearchRecords,
} from "../src/lib/adminGlobalSearch.js";
import { PLATFORM_SEARCH_RESULT_FIELDS } from "../src/lib/platformIntegrationFoundation.js";

test("admin global search includes all Phase F platform source types", () => {
  const results = buildAdminGlobalSearchResults({
    customers: [{ id: "client_1", business_name: "Phoenix Roofing", client_email: "owner@example.com" }],
    leads: [{ id: "lead_1", business_name: "Phoenix Med Spa", email: "lead@example.com" }],
    opportunities: [{ id: "opp_1", business_name: "Phoenix Restoration", activation_priority: "High" }],
    appointments: [{ id: "booking_1", business_name: "Phoenix Dental", scheduled_date: "2026-07-21" }],
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
    "opportunity",
    "appointment",
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
    "priority",
    "demo-bookings",
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
  assert.equal(getAdminGlobalSearchPlaceholder(), "Search customers, leads, appointments, opportunities, AI workers, settings...");
});

test("admin global search adapter plan binds Worker 2 source families to Base44 entities", () => {
  const plan = getAdminGlobalSearchAdapterPlan();
  const bySource = Object.fromEntries(plan.map((item) => [item.sourceId, item]));

  assert.deepEqual(bySource["ai-workers"].entities, ["AIWorker", "AutomationAgent", "AutomationJob", "Agent"]);
  assert.deepEqual(bySource.appointments.entities, ["Appointment", "DemoBooking", "Booking", "CalendarEvent"]);
  assert.deepEqual(bySource.opportunities.entities, ["Opportunity", "LeadOpportunity", "LeadPriorityQueue", "Leads", "Lead"]);
  assert.deepEqual(bySource["timeline-events"].entities, ["ClientTimelineEvent", "AuditLog", "CommunicationEvent", "AutomationProofLog"]);
  assert.deepEqual(bySource.settings.entities, ["AdminSettings"]);
  assert.deepEqual(bySource.documents.entities, ["Document", "Resource", "KnowledgeBaseArticle"]);
  assert.equal(bySource.settings.limit, 50);
});

test("admin global search adapter loader degrades missing sources without hiding status", async () => {
  const fakeBase44 = {
    entities: {
      ClientProject: { list: async () => [{ id: "client_1", business_name: "Phoenix Roofing" }] },
      AIWorker: { list: async () => [{ id: "worker_1", name: "Phoenix responder" }] },
      Document: { list: async () => [{ id: "doc_1", title: "Phoenix launch plan" }] },
      Resource: { list: async () => [] },
      KnowledgeBaseArticle: { list: async () => [] },
      AdminSettings: { list: async () => [{ id: "security", title: "Phoenix security" }] },
    },
  };

  const { recordsBySource, sourceStatuses } = await loadAdminGlobalSearchRecords(fakeBase44, {
    sourceIds: ["customers", "ai-workers", "documents", "settings", "billing"],
  });

  assert.deepEqual(recordsBySource.customers.map((record) => record.id), ["client_1"]);
  assert.deepEqual(recordsBySource["ai-workers"].map((record) => record.id), ["worker_1"]);
  assert.deepEqual(recordsBySource.documents.map((record) => record.id), ["doc_1"]);
  assert.equal(sourceStatuses.customers.status, "Partial");
  assert.equal(sourceStatuses["ai-workers"].status, "Partial");
  assert.equal(sourceStatuses.documents.status, "Current");
  assert.equal(sourceStatuses.settings.status, "Current");
  assert.equal(sourceStatuses.billing.status, "Unavailable");
  assert.deepEqual(sourceStatuses["ai-workers"].unavailableEntities, ["AutomationAgent", "AutomationJob", "Agent"]);

  const results = buildAdminGlobalSearchResults(recordsBySource, "phoenix", 10, { sourceStatuses });
  const aiResult = results.find((result) => result.type === "ai_worker");
  assert.equal(aiResult.metadata.adapterStatus, "Partial");
  assert.deepEqual(aiResult.metadata.adapterUnavailableEntities, ["AutomationAgent", "AutomationJob", "Agent"]);
});

test("admin global search response enforces platform permissions", () => {
  const response = buildAdminGlobalSearchResponse({
    settings: [{ id: "roles", title: "Phoenix role settings", scope: "Organization" }],
  }, "phoenix", 10, { user: { role: "client" } });

  assert.equal(response.status, "Permission Restricted");
  assert.equal(response.results.length, 0);
  assert.equal(response.restrictedCount, 1);
});
