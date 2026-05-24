const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "end", "quit"];
const NOT_INTERESTED_KEYWORDS = [
  "not interested",
  "not for me",
  "wrong number",
  "no thanks",
];
const BOOKING_KEYWORDS = [
  "yes",
  "ready",
  "let's do it",
  "lets do it",
  "perfect",
  "confirmed",
  "book me",
  "schedule",
];
const AVAILABILITY_KEYWORDS = [
  "when",
  "what time",
  "available",
  "schedule",
  "appointment",
];
const PRICING_KEYWORDS = [
  "price",
  "cost",
  "how much",
  "rates",
  "pricing",
];
const UNSURE_KEYWORDS = [
  "maybe",
  "not sure",
  "depends",
  "tell me more",
];

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function classifyLeadIntentFallback(messageText) {
  const text = String(messageText || "").toLowerCase().trim();

  if (!text) {
    return {
      canonical_intent: "other",
      confidence: 0.25,
      recommended_next_action: "escalate_to_admin",
    };
  }

  if (includesAny(text, STOP_KEYWORDS)) {
    return {
      canonical_intent: "stop",
      confidence: 0.95,
      recommended_next_action: "stop_follow_up",
    };
  }

  if (includesAny(text, NOT_INTERESTED_KEYWORDS)) {
    return {
      canonical_intent: "not_interested",
      confidence: 0.9,
      recommended_next_action: "stop_follow_up",
    };
  }

  if (includesAny(text, BOOKING_KEYWORDS)) {
    return {
      canonical_intent: "booking_ready",
      confidence: 0.9,
      recommended_next_action: "send_booking_link",
    };
  }

  if (includesAny(text, AVAILABILITY_KEYWORDS)) {
    return {
      canonical_intent: "availability_interest",
      confidence: 0.85,
      recommended_next_action: "send_booking_link",
    };
  }

  if (includesAny(text, PRICING_KEYWORDS)) {
    return {
      canonical_intent: "pricing_interest",
      confidence: 0.85,
      recommended_next_action: "answer_question",
    };
  }

  if (text.includes("?")) {
    return {
      canonical_intent: "question",
      confidence: 0.8,
      recommended_next_action: "answer_question",
    };
  }

  if (includesAny(text, UNSURE_KEYWORDS)) {
    return {
      canonical_intent: "unsure",
      confidence: 0.8,
      recommended_next_action: "ask_clarifying_question",
    };
  }

  return {
    canonical_intent: "other",
    confidence: 0.5,
    recommended_next_action: "escalate_to_admin",
  };
}

export function mapCanonicalToLegacyIntent(canonicalIntent) {
  switch (canonicalIntent) {
    case "booking_ready":
    case "availability_interest":
      return "ready_to_book";
    case "pricing_interest":
      return "price_concern";
    case "question":
      return "asking_question";
    case "unsure":
      return "uncertain";
    case "not_interested":
    case "stop":
      return "not_interested";
    default:
      return "general";
  }
}

export function buildIntentResponse(classification) {
  const canonicalIntent = classification?.canonical_intent || "other";
  const recommendedAction =
    classification?.recommended_next_action || "escalate_to_admin";

  return {
    intent: mapCanonicalToLegacyIntent(canonicalIntent),
    canonical_intent: canonicalIntent,
    confidence: classification?.confidence ?? 0.5,
    recommended_next_action: recommendedAction,
    action: recommendedAction,
    should_stop_sequences:
      canonicalIntent === "stop" || canonicalIntent === "not_interested",
    should_send_booking_link:
      canonicalIntent === "booking_ready" ||
      canonicalIntent === "availability_interest",
  };
}

export async function classifyLeadIntent({
  base44,
  messageText,
  lead,
}) {
  if (!messageText) {
    return buildIntentResponse(
      classifyLeadIntentFallback(messageText),
    );
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a sales intent classifier for a lead automation agency. Classify the following inbound message from a business owner lead.

Lead context:
- Business: ${lead?.business_name || "Unknown"}
- Status: ${lead?.status || "Unknown"}

Message: "${messageText}"

Classify intent as exactly ONE of:
- "booking_ready": They want to book, schedule, or confirm they're ready to move forward
- "availability_interest": Asking about when/how to connect or schedule
- "pricing_interest": Asking about price, cost, or what's included
- "question": Asking a specific question (not pricing/scheduling)
- "unsure": Vague, non-committal, or "maybe" type response
- "not_interested": Declined or not interested
- "stop": Explicitly asking to stop contact
- "other": Doesn't fit any category

Respond with JSON only: { "canonical_intent": "...", "confidence": 0.0-1.0, "recommended_next_action": "send_booking_link" | "answer_question" | "ask_clarifying_question" | "stop_follow_up" | "escalate_to_admin" }`,
      response_json_schema: {
        type: "object",
        properties: {
          canonical_intent: { type: "string" },
          confidence: { type: "number" },
          recommended_next_action: { type: "string" },
        },
      },
    });

    if (result?.canonical_intent) {
      return buildIntentResponse(result);
    }
  } catch (error) {
    console.warn(
      "classifyLeadIntent LLM failed, falling back to keyword match:",
      error.message,
    );
  }

  return buildIntentResponse(classifyLeadIntentFallback(messageText));
}
