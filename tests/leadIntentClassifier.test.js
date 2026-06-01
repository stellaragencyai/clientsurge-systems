import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyLeadIntentFallback,
  buildIntentResponse,
} from "../base44/functions/_shared/leadIntentClassifier.js";

test("classifyLeadIntent fallback maps pricing interest into canonical and legacy intents", () => {
  const result = buildIntentResponse(
    classifyLeadIntentFallback("How much does this cost?"),
  );

  assert.equal(result.canonical_intent, "pricing_interest");
  assert.equal(result.intent, "price_concern");
  assert.equal(result.recommended_next_action, "answer_question");
});

test("classifyLeadIntent fallback maps booking interest into booking link action", () => {
  const result = buildIntentResponse(
    classifyLeadIntentFallback("Yes let's do it, when can we schedule?"),
  );

  assert.equal(result.canonical_intent, "booking_ready");
  assert.equal(result.intent, "ready_to_book");
  assert.equal(result.should_send_booking_link, true);
});
