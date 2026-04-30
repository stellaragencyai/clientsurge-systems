/**
 * AI Function 3: generateSmartResponse
 * Generates personalized, context-aware SMS/email responses
 * 
 * INPUT: Lead + intent + previous messages
 * OUTPUT: Personalized response message (SMS or Email)
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, intent, message_type = "sms", project_id } = await req.json();

    if (!lead_id || !intent) {
      return Response.json(
        { error: "lead_id and intent required" },
        { status: 400 }
      );
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    const project = project_id
      ? await base44.asServiceRole.entities.ClientProject.get(project_id)
      : null;

    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      10
    );

    console.log(`[SmartResponse] Generating ${message_type} for intent: ${intent}`);

    const prompt = buildPrompt(lead, project, intent, message_type, events);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          message: { type: "string" },
          reasoning: { type: "string" },
          tone: { type: "string" },
          personalization_used: { type: "array", items: { type: "string" } },
        },
        required: ["message"],
      },
    });

    console.log(`[SmartResponse] Generated for ${lead_id}`);

    return Response.json({
      success: true,
      lead_id,
      message: result.message,
      reasoning: result.reasoning,
      tone: result.tone,
      personalization: result.personalization_used,
    });
  } catch (error) {
    console.error("[SmartResponse] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function buildPrompt(lead, project, intent, messageType, events) {
  const previousMessages = events
    .filter(e => e.direction === "outbound")
    .slice(0, 3)
    .map(e => `- "${e.message_body}"`)
    .join("\n");

  const intents = {
    ready_to_book:
      "Customer is ready to book NOW. Generate urgency and make it easy to schedule.",
    asking_question:
      "Customer has a specific question. Answer thoroughly and build trust.",
    price_concern:
      "Customer concerned about cost. Emphasize value, ROI, payment options.",
    uncertain:
      "Customer interested but hesitant. Address concerns, provide social proof, offer consultation.",
    not_interested:
      "Customer losing interest. Don't be pushy. Acknowledge their concern and offer one last value.",
    objection_timing:
      "Customer says 'not now'. Schedule a future touch point, stay on their radar.",
    objection_fit:
      "Customer unsure if service is right. Show how your service solves their specific problem.",
    requesting_info:
      "Customer wants more info. Send proposal, case study, or testimonial relevant to their need.",
    complaint:
      "Customer unhappy. Acknowledge issue, offer solution, escalate if needed.",
    already_scheduled:
      "Customer already booked elsewhere or with you. Send prep guide or confirmation.",
  };

  return `You are a helpful, personalized business assistant. Generate a ${messageType === "sms" ? "SHORT SMS (max 160 chars)" : "BRIEF EMAIL (max 3 sentences)"} response.

CUSTOMER CONTEXT:
- Name: ${lead.full_name}
- Business Type: ${lead.business_type}
- Original Need: ${lead.problem}
- Business Hours: ${project?.business_hours || "9am-5pm"}

CUSTOMER INTENT: ${intent}
INTENT GUIDANCE: ${intents[intent] || "Be helpful and personalized"}

PREVIOUS MESSAGES WE SENT (avoid repetition):
${previousMessages || "None yet"}

REQUIREMENTS:
1. Use their first name naturally
2. Be genuine and conversational (not robotic)
3. Include ONE specific detail (service, time, price benefit)
4. Make next step crystal clear
5. Use their tone/industry language

${messageType === "sms" ? "KEEP IT SHORT - 160 characters max!" : ""}

Respond with JSON: { "message": "...", "reasoning": "...", "personalization_used": [...] }`;
}