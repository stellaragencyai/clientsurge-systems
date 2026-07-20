import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AI_WORKER_STATES,
  COMMUNICATION_CHANNELS,
  COMMUNICATION_STATES,
  PHASE_C_ACCESSIBILITY_CONTRACTS,
  PHASE_C_ROUTES,
  PHASE_C_SOURCE_ISSUES,
  PHASE_C_VALIDATION_TARGETS,
  TIMELINE_EVENT_TYPES,
  WORKER_REQUIRED_FIELDS,
  phaseCCommunications,
  phaseCCustomerSuccess,
  phaseCTimeline,
  phaseCWorkforce,
} from "../src/data/phaseCReviewFixtures.js";

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const routeMetadataSource = readFileSync(new URL("../src/lib/publicRouteMetadata.js", import.meta.url), "utf8");

function assertNoKeyMatching(value, matcher, path = "root") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoKeyMatching(item, matcher, `${path}[${index}]`));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert.equal(matcher.test(key), false, `${path}.${key} should not exist`);
    assertNoKeyMatching(child, matcher, `${path}.${key}`);
  }
}

test("Phase C review route map is mounted and review routes are internal noindex surfaces", () => {
  const expectedRoutes = [
    "/review/phase-c/workforce",
    "/review/phase-c/timeline",
    "/review/phase-c/communications",
    "/review/phase-c/customer-success",
  ];

  assert.deepEqual(PHASE_C_ROUTES.map((route) => route.path), expectedRoutes);
  for (const route of expectedRoutes) {
    assert.match(appSource, new RegExp(`path="${route.replace(/\//g, "\\/")}"`));
  }
  assert.match(appSource, /\/review\/phase-c" element={<Navigate to="\/review\/phase-c\/workforce"/);
  assert.match(routeMetadataSource, /"\/review"/);
});

test("Phase C source issues are represented in the fixture contract", () => {
  assert.deepEqual(PHASE_C_SOURCE_ISSUES.map((issue) => issue.number), [1381, 1371, 1372, 1359]);
  for (const issue of PHASE_C_SOURCE_ISSUES) {
    assert.match(issue.url, new RegExp(`/issues/${issue.number}$`));
    assert.ok(issue.role);
  }
});

test("AI Workforce fixtures support every required state and field", () => {
  assert.deepEqual(new Set(phaseCWorkforce.workers.map((worker) => worker.currentState)), new Set(AI_WORKER_STATES));

  for (const worker of phaseCWorkforce.workers) {
    for (const field of WORKER_REQUIRED_FIELDS) {
      assert.ok(worker[field] !== undefined, `${worker.id} missing ${field}`);
    }
    assert.ok(worker.identity.name);
    assert.ok(worker.identity.workerId);
    assert.ok(worker.role);
    assert.ok(worker.responsibilities.length > 0);
    assert.ok(worker.todaysWork.length > 0);
    assert.ok(worker.completedWork.length > 0);
    assert.ok(worker.businessResult.summary);
    assert.ok(worker.blockedWork.summary);
    assert.ok(worker.evidence.length > 0);
    assert.ok(worker.confidence.level);
    assert.ok(worker.confidence.reason);
    assert.ok(worker.recommendation.title);
    assert.ok(worker.recommendation.reason);
    assert.ok(worker.recommendation.evidence !== "");
    assert.ok(worker.recommendation.destination.startsWith("/"));
    assert.ok(worker.humanEscalation.reason);
    assert.ok(worker.configuration.safeguards.length > 0);
  }
});

test("Client Timeline fixtures cover every event type without flattening provenance", () => {
  assert.deepEqual(new Set(phaseCTimeline.events.map((event) => event.type)), new Set(TIMELINE_EVENT_TYPES));

  for (const event of phaseCTimeline.events) {
    assert.ok(event.actor, `${event.id} missing actor`);
    assert.ok(event.timestamp, `${event.id} missing timestamp`);
    assert.equal(typeof event.source, "object", `${event.id} source should stay structured`);
    assert.ok(event.source.id);
    assert.ok(event.source.name);
    assert.ok(event.source.verification);
    assert.ok(event.verification);
    assert.ok(event.summary);
    assert.ok(event.relatedObject.id);
    assert.ok(event.relatedObject.type);
    assert.ok(event.deepLink.startsWith("/"));
    assert.ok(event.provenance.rawReference);
    assert.ok(event.provenance.ingestionTimestamp);
    assert.ok(event.provenance.transformedBy);
    assert.notEqual(event.source.id, event.provenance.rawReference);
  }
});

test("Communication Center fixtures support all channels and keep sent, delivered, and read distinct", () => {
  assert.deepEqual(new Set(phaseCCommunications.conversations.map((conversation) => conversation.channel)), new Set(COMMUNICATION_CHANNELS));
  assert.deepEqual(
    new Set(phaseCCommunications.conversations.flatMap((conversation) => conversation.messages.map((message) => message.state))),
    new Set(COMMUNICATION_STATES)
  );

  for (const conversation of phaseCCommunications.conversations) {
    assert.ok(conversation.participants.length >= 2);
    assert.ok(conversation.owner);
    assert.ok(conversation.assignment);
    assert.equal(typeof conversation.unread, "boolean");
    assert.ok(conversation.priority);
    assert.ok(conversation.aiInvolvement.summary);
    assert.ok(conversation.humanEscalation.reason);

    for (const message of conversation.messages) {
      if (message.state === "sent") {
        assert.ok(message.sentAt);
        assert.equal(message.deliveredAt, null);
        assert.equal(message.readAt, null);
      }
      if (message.state === "delivered") {
        assert.ok(message.sentAt);
        assert.ok(message.deliveredAt);
        assert.equal(message.readAt, null);
      }
      if (message.state === "read") {
        assert.ok(message.sentAt);
        assert.ok(message.deliveredAt);
        assert.ok(message.readAt);
      }
      if (["queued", "sending", "failed", "blocked", "unknown"].includes(message.state)) {
        assert.equal(message.deliveredAt, null);
        assert.equal(message.readAt, null);
      }
    }
  }
});

test("Customer Success fixtures track required dimensions and do not create health scores", () => {
  assertNoKeyMatching(phaseCCustomerSuccess, /health/i);

  for (const account of phaseCCustomerSuccess.accounts) {
    assert.ok(account.installation.summary);
    assert.ok(account.adoption.summary);
    assert.ok(account.aiUsage.summary);
    assert.ok(account.automationCoverage.summary);
    assert.ok(account.successPlan.objective);
    assert.ok(account.owner);
    assert.ok(account.renewal.summary);
    assert.ok(account.currentPosture);
  }

  for (const risk of phaseCCustomerSuccess.risks) {
    assert.ok(risk.evidence.length > 0);
    assert.ok(risk.reason);
    assert.ok(risk.impact);
    assert.ok(risk.owner);
    assert.ok(risk.nextAction);
  }
});

test("Validation contract includes required viewports and accessibility categories", () => {
  assert.deepEqual(PHASE_C_VALIDATION_TARGETS.map((target) => target.width), [1440, 1280, 1024, 768, 390, 375]);
  const accessibilityText = PHASE_C_ACCESSIBILITY_CONTRACTS.join(" ").toLowerCase();
  for (const word of ["keyboard", "focus", "screen-reader", "touch", "reduced motion"]) {
    assert.match(accessibilityText, new RegExp(word));
  }
});

test("Phase C review implementation does not import live adapters", () => {
  const reviewFiles = [
    ...readdirSync(new URL("../src/pages/review", import.meta.url)).map((file) => new URL(`../src/pages/review/${file}`, import.meta.url)),
    ...readdirSync(new URL("../src/components/review/phase-c", import.meta.url)).map((file) => new URL(`../src/components/review/phase-c/${file}`, import.meta.url)),
  ];

  for (const file of reviewFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /base44|asServiceRole|functions\.invoke|fetch\(/, `${join(file.pathname)} should remain fixture-backed`);
  }
});
