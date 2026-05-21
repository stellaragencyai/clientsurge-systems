import { secureJson } from "../_shared/response.ts";
/**
 * AI Function 5: decideNextAction
 * Determines the optimal next action for a lead based on AI analysis
 * 
 * INPUT: Lead intent + score + outcome prediction
 * OUTPUT: Recommended action + message content + timing
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, intent, score, booking_probability, project_id } = await req.json();

    if (!lead_id || !intent || score === undefined) {
      return secureJson(
        { error: "lead_id, intent, and score required" },
        { status: 400 }
      );
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    const project = project_id
      ? await base44.asServiceRole.entities.ClientProject.get(project_id)
      : null;

    console.log(`[DecideAction] Deciding action for intent=${intent}, score=${score}`);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Decide the BEST NEXT ACTION for this lead.

CURRENT STATE:
- Intent: ${intent}
- Lead Score: ${score}/100
- Booking Probability: ${booking_probability || "unknown"}%
- Business: ${lead.business_name} (${lead.business_type})

POSSIBLE ACTIONS:
1. "send_sms" - Send SMS with booking link
2. "send_email" - Send email with case study
3. "send_offer" - Send special offer/discount
4. "schedule_call" - Suggest phone consultation
5. "send_testimonial" - Send success story
6. "ask_question" - Ask clarifying question
7. "send_case_study" - Send relevant case study
8. "re_engage" - Win-back message (if dormant)
9. "move_to_nurture" - Add to nurture sequence
10. "assign_to_sales" - Escalate to sales rep

DECISION LOGIC:
- If intent="ready_to_book" → send_sms with booking link
- If intent="price_concern" AND score>60 → send_offer or case study
- If intent="uncertain" → send_testimonial or ask_question
- If intent="not_interested" → re_engage (last attempt)
- If score<30 → move_to_nurture
- If score>80 AND booking_probability>70 → assign_to_sales (human touch)

Respond with JSON:
{
  "action": "one of above",
  "reasoning": "why this action",
  "timing": "send immediately | wait X hours | schedule tomorrow",
  "message_focus": "key talking point",
  "success_metric": "how to measure if this works"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          action: { type: "string" },
          reasoning: { type: "string" },
          timing: { type: "string" },
          message_focus: { type: "string" },
          success_metric: { type: "string" },
        },
        required: ["action", "reasoning"],
      },
    });

    // Queue the action as a job
    await base44.asServiceRole.entities.AutomationJob.create({
      lead_id,
      job_type: "ai_recommended_action",
      trigger_event: "ai_decision",
      status: "queued",
      scheduled_for: new Date().toISOString(),
      result_metadata: JSON.stringify({
        action: result.action,
        reasoning: result.reasoning,
        timing: result.timing,
        message_focus: result.message_focus,
      }),
    });

    console.log(`[DecideAction] ${lead_id} → ${result.action}`);

    return secureJson({
      success: true,
      lead_id,
      action: result.action,
      reasoning: result.reasoning,
      timing: result.timing,
      message_focus: result.message_focus,
      success_metric: result.success_metric,
    });
  } catch (error) {
    console.error("[DecideAction] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});