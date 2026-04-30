/**
 * AI Function 2: classifyLeadIntent
 * Analyzes lead messages to detect intent
 * 
 * INPUT: Lead message/reply text
 * OUTPUT: Intent type + confidence + recommended action
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message_text } = await req.json();

    if (!lead_id || !message_text) {
      return Response.json(
        { error: "lead_id and message_text required" },
        { status: 400 }
      );
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);

    console.log(`[ClassifyIntent] Analyzing: "${message_text.substring(0, 50)}..."`);

    // Call AI to classify intent
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this customer message and detect their intent.

Customer Message: "${message_text}"

Lead Context:
- Lead: ${lead.full_name}
- Business: ${lead.business_name}
- Original Problem: ${lead.problem}

Possible intents:
1. "ready_to_book" - Customer ready to schedule/book now
2. "asking_question" - Asking about details (hours, price, services)
3. "price_concern" - Mentioning cost/budget concerns
4. "uncertain" - Interested but hesitant or needs more info
5. "not_interested" - Rejecting or losing interest
6. "objection_timing" - "Not right now, maybe later"
7. "objection_fit" - "Not sure if you're right for us"
8. "requesting_info" - Wants proposal, quote, case study
9. "complaint" - Unhappy about something
10. "already_scheduled" - Already booked elsewhere or with you

Respond with JSON:
{
  "intent": "one of above",
  "confidence": number 0-1,
  "reasoning": "why this intent",
  "customer_objection": "if applicable",
  "recommended_action": "what to say/do next"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          intent: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" },
          customer_objection: { type: "string" },
          recommended_action: { type: "string" },
        },
        required: ["intent", "confidence", "reasoning"],
      },
    });

    // Update lead intent
    await base44.asServiceRole.entities.Leads.update(lead_id, {
      ai_intent: result.intent,
      ai_confidence: Math.round(result.confidence * 100),
      ai_last_classification: `Intent: ${result.intent} (${result.reasoning})`,
    });

    console.log(`[ClassifyIntent] ${lead_id} = ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);

    return Response.json({
      success: true,
      lead_id,
      intent: result.intent,
      confidence: result.confidence,
      reasoning: result.reasoning,
      objection: result.customer_objection,
      recommended_action: result.recommended_action,
    });
  } catch (error) {
    console.error("[ClassifyIntent] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});