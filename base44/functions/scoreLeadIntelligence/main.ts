import { secureJson } from "../_shared/response.ts";
/**
 * AI Function 1: scoreLeadIntelligence
 * Analyzes lead quality, engagement, fit using AI
 * 
 * INPUT: Lead data + all interactions
 * OUTPUT: Score 0-100 + reasoning + tier (Hot/Warm/Cold)
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { shouldApplyLeadScoreResult } from "../_shared/leadScoringGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id } = await req.json();

    if (!lead_id) {
      return secureJson({ error: "lead_id required" }, { status: 400 });
    }

    // Get lead + interactions
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    const project = project_id 
      ? await base44.asServiceRole.entities.ClientProject.get(project_id)
      : null;

    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      50
    );

    console.log(`[ScoreLead] Scoring lead ${lead_id}`);

    // Build context for AI
    const context = {
      lead_name: lead.full_name,
      business: lead.business_name,
      industry: lead.business_type,
      source: lead.source,
      initial_problem: lead.problem,
      response_time_minutes: calculateResponseTime(events),
      engagement_events: events.length,
      has_replied: events.some(e => e.direction === "inbound" && e.channel === "sms"),
      days_since_contact: calculateDaysSinceContact(events),
      interactions: events.slice(0, 5).map(e => ({
        type: e.event_type,
        channel: e.channel,
        time_ago: new Date(e.created_date),
      })),
    };

    // Call AI to score
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Score this lead from 0-100 based on quality, engagement, and fit. 
      
Lead Info:
- Name: ${context.lead_name}
- Business: ${context.business} (${context.industry})
- Source: ${context.source}
- Problem: ${context.initial_problem}
- Response time: ${context.response_time_minutes || "no response"} minutes
- Has replied: ${context.has_replied ? "YES" : "NO"}
- Days since contact: ${context.days_since_contact}
- Total interactions: ${context.engagement_events}

Scoring factors:
- Source quality (direct phone = 5pts, form = 3pts, referral = 4pts)
- Response time (under 5 min = 5pts, under 1hr = 3pts, over 1hr = 1pt)
- Engagement (replied = 10pts, clicked link = 5pts, opened email = 3pts)
- Fit (right industry/size = 5pts, seasonal need = 3pts)
- Activity frequency (multiple touches = 10pts, single = 3pts)

Respond with JSON:
{
  "score": number 0-100,
  "tier": "Hot" | "Warm" | "Cold",
  "reasoning": "why this score",
  "top_signals": ["signal1", "signal2"],
  "next_action": "what to do next",
  "confidence": number 0.0-1.0
}`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          tier: { type: "string", enum: ["Hot", "Warm", "Cold"] },
          reasoning: { type: "string" },
          top_signals: { type: "array", items: { type: "string" } },
          next_action: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["score", "tier", "reasoning", "confidence"],
      },
    });

    const { confidence, shouldApply } = shouldApplyLeadScoreResult(result);
    if (!shouldApply) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        channel: "internal",
        direction: "system",
        event_type: "status_update",
        provider: "internal",
        status: "processed",
        subject: "AI lead score skipped",
        message_body: `AI score confidence ${confidence.toFixed(2)} was below the 0.60 update threshold.`,
        metadata_json: JSON.stringify({
          source: "scoreLeadIntelligence",
          skipped: true,
          confidence,
          proposed_score: result.score,
          proposed_tier: result.tier,
        }),
      });

      return secureJson({
        success: true,
        skipped: true,
        reason: "AI score confidence below 0.60 threshold",
        lead_id,
        confidence,
        proposed_score: result.score,
        proposed_tier: result.tier,
      });
    }

    // Update lead with score
    await base44.asServiceRole.entities.Leads.update(lead_id, {
      lead_score: result.score,
      activation_priority: result.tier,
      ai_last_classification: `Score: ${result.score} - ${result.reasoning}`,
      ai_confidence: confidence,
    });

    console.log(`[ScoreLead] ${lead_id} scored ${result.score} (${result.tier})`);

    return secureJson({
      success: true,
      lead_id,
      score: result.score,
      tier: result.tier,
      reasoning: result.reasoning,
      signals: result.top_signals,
      next_action: result.next_action,
      confidence,
    });
  } catch (error) {
    console.error("[ScoreLead] Error:", error.message);
    return secureJson(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function calculateResponseTime(events) {
  const sentEvent = events.find(e => e.direction === "outbound");
  const replyEvent = events.find(e => e.direction === "inbound");
  if (!sentEvent || !replyEvent) return null;
  return Math.round(
    (new Date(replyEvent.created_date) - new Date(sentEvent.created_date)) / 60000
  );
}

function calculateDaysSinceContact(events) {
  if (!events.length) return null;
  return Math.round(
    (Date.now() - new Date(events[0].created_date)) / (1000 * 60 * 60 * 24)
  );
}
