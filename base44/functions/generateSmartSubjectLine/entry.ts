/**
 * Generate Smart Subject Line
 * AI-powered subject lines based on lead data + conversation context
 * Optimizes for open rates using behavioral signals
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, campaign_type, intent, message_preview } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[SubjectLine] Generating for lead ${lead_id}`);

    // 1. Get lead data
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get engagement history
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      15
    );

    // 3. Extract behavioral signals
    const totalEmails = events ? events.filter((e) => e.channel === "email").length : 0;
    const openRate = events
      ? events.filter((e) => e.status === "opened").length / 
        events.filter((e) => e.channel === "email").length
      : 0.3;
    const hasReplied = events ? events.some((e) => e.direction === "inbound") : false;
    const lastEmailSubject = events
      ? events.find((e) => e.channel === "email" && e.subject)?.subject
      : null;

    // 4. Determine engagement level
    let engagementLevel = "cold";
    if (openRate > 0.5) engagementLevel = "warm";
    if (hasReplied) engagementLevel = "hot";
    if (totalEmails > 5 && openRate > 0.3) engagementLevel = "engaged";

    // 5. Build context for LLM
    const prompt = `Generate 3 highly personalized email subject lines for:

Business: ${lead.business_name}
Industry: ${lead.business_type}
Lead Intent: ${intent || "general inquiry"}
Engagement Level: ${engagementLevel} (${totalEmails} emails sent, ${Math.round(openRate * 100)}% open rate)
Campaign Type: ${campaign_type || "follow-up"}
Message Preview: "${message_preview || "Service/product inquiry follow-up"}"
Lead Name: ${lead.full_name}

Requirements:
- Each line should be 40-65 characters max
- Use personalization (name, business name, or intent-specific)
- For cold leads: curiosity-driven, benefit-focused
- For warm/hot leads: urgency, specificity, continuation
- Avoid generic phrases like "Quick question" or "Just checking in"
- Consider what would make them open vs. delete
- Previous subject (avoid too similar): ${lastEmailSubject || "N/A"}

Output JSON:
{
  "subject_lines": [
    {"text": "...", "strategy": "...", "estimated_open_rate": 0.XX},
    {"text": "...", "strategy": "...", "estimated_open_rate": 0.XX},
    {"text": "...", "strategy": "...", "estimated_open_rate": 0.XX}
  ],
  "recommended": "text of best option",
  "reasoning": "why this works for this lead"
}`;

    // 6. Call LLM
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subject_lines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                strategy: { type: "string" },
                estimated_open_rate: { type: "number" },
              },
            },
          },
          recommended: { type: "string" },
          reasoning: { type: "string" },
        },
      },
    });

    console.log(`[SubjectLine] Generated for ${lead_id}: "${llmResult.recommended}"`);

    return Response.json({
      success: true,
      lead_id,
      recommended_subject: llmResult.recommended,
      alternatives: llmResult.subject_lines,
      engagement_level: engagementLevel,
      open_rate_history: Math.round(openRate * 100),
      reasoning: llmResult.reasoning,
    });
  } catch (error) {
    console.error("[SubjectLine] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});