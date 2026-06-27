import { createClientFromRequest } from 'npm:@base44/sdk@0.8.34';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messageText, lead } = await req.json();

    if (!messageText || !lead) {
      return secureJson(
        { error: 'messageText and lead required' },
        { status: 400 }
      );
    }

    // Try LLM classification first for higher accuracy
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a sales intent classifier for a lead automation agency. Classify the following inbound message from a business owner lead.

Lead context:
- Business: ${lead.business_name || "Unknown"}
- Status: ${lead.status || "Unknown"}

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

Respond with JSON only: { "intent": "...", "confidence": 0.0-1.0, "recommended_next_action": "send_booking_link" | "answer_question" | "ask_clarifying_question" | "stop_follow_up" | "escalate_to_admin" }`,
        response_json_schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            confidence: { type: "number" },
            recommended_next_action: { type: "string" }
          }
        }
      });

      if (result?.intent) {
        return secureJson(result);
      }
    } catch (llmErr) {
      console.warn("[classifyLeadReply] classifyLeadReply LLM failed, falling back to keyword match:", llmErr.message);
    }

    // Fallback: keyword-based classification
    const text = messageText.toLowerCase().trim();

    // Stop/unsubscribe keywords
    if (
      text.includes('stop') ||
      text.includes('unsubscribe') ||
      text.includes('no thanks') ||
      text.includes('not interested')
    ) {
      return secureJson({
        intent: 'stop',
        confidence: 0.95,
        recommended_next_action: 'stop_follow_up',
      });
    }

    // Not interested
    if (
      text.includes('not interested') ||
      text.includes('not for me') ||
      text.includes('wrong number')
    ) {
      return secureJson({
        intent: 'not_interested',
        confidence: 0.9,
        recommended_next_action: 'stop_follow_up',
      });
    }

    // Booking ready
    if (
      text.includes('yes') ||
      text.includes('ready') ||
      text.includes('let\'s do it') ||
      text.includes('perfect') ||
      text.includes('confirmed') ||
      text.includes('book me') ||
      text.includes('schedule')
    ) {
      return secureJson({
        intent: 'booking_ready',
        confidence: 0.9,
        recommended_next_action: 'send_booking_link',
      });
    }

    // Availability interest
    if (
      text.includes('when') ||
      text.includes('what time') ||
      text.includes('available') ||
      text.includes('schedule') ||
      text.includes('appointment')
    ) {
      return secureJson({
        intent: 'availability_interest',
        confidence: 0.85,
        recommended_next_action: 'send_booking_link',
      });
    }

    // Pricing interest
    if (
      text.includes('price') ||
      text.includes('cost') ||
      text.includes('how much') ||
      text.includes('rates') ||
      text.includes('pricing')
    ) {
      return secureJson({
        intent: 'pricing_interest',
        confidence: 0.85,
        recommended_next_action: 'answer_question',
      });
    }

    // Question
    if (text.includes('?')) {
      return secureJson({
        intent: 'question',
        confidence: 0.8,
        recommended_next_action: 'answer_question',
      });
    }

    // Unsure / needs clarification
    if (
      text.includes('maybe') ||
      text.includes('not sure') ||
      text.includes('depends') ||
      text.includes('tell me more')
    ) {
      return secureJson({
        intent: 'unsure',
        confidence: 0.8,
        recommended_next_action: 'ask_clarifying_question',
      });
    }

    // Default to other
    return secureJson({
      intent: 'other',
      confidence: 0.5,
      recommended_next_action: 'escalate_to_admin',
    });
  } catch (error) {
    return secureJson({ error: error.message }, { status: 500 });
  }
});