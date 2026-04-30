/**
 * AI Function 4: predictLeadOutcome
 * Predicts if/when lead will book using AI analysis
 * 
 * INPUT: Lead data + all interactions + project context
 * OUTPUT: Probability of booking + predicted timeline + confidence
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    const project = project_id
      ? await base44.asServiceRole.entities.ClientProject.get(project_id)
      : null;

    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      50
    );

    console.log(`[PredictOutcome] Predicting booking for ${lead_id}`);

    const context = {
      lead_score: lead.lead_score || 50,
      days_in_pipeline: calculateDaysSinceCreation(lead),
      reply_rate: (events.filter(e => e.direction === "inbound").length / Math.max(1, events.filter(e => e.direction === "outbound").length)) * 100,
      has_viewed_booking: events.some(e => e.event_type === "booking_page_viewed"),
      has_requested_quote: events.some(e => e.event_type === "quote_requested"),
      reply_sentiment: lead.reply_sentiment || "Unknown",
      interaction_count: events.length,
      source: lead.source,
      industry_booking_avg_days: 5, // industry avg
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Predict if this lead will book an appointment.

LEAD PROFILE:
- Lead Score: ${context.lead_score}/100
- Industry: ${lead.business_type}
- Source: ${context.source}
- Days in Pipeline: ${context.days_in_pipeline}
- Total Interactions: ${context.interaction_count}
- Reply Rate: ${context.reply_rate.toFixed(0)}%
- Viewed Booking Page: ${context.has_viewed_booking ? "YES" : "NO"}
- Requested Quote: ${context.has_requested_quote ? "YES" : "NO"}
- Reply Sentiment: ${context.reply_sentiment}

BOOKING PROBABILITY FACTORS:
- Score 80+: 70% base probability
- Score 50-79: 40% base probability  
- Score <50: 15% base probability
- Multiple interactions: +15%
- Viewed booking page: +25%
- Requested quote: +20%
- Positive sentiment: +15%
- Source (direct phone): +10%, (form): +5%, (referral): +15%

Predict:
1. Probability they WILL book (0-100%)
2. Timeline (days until booking, or "unlikely")
3. Confidence level (0-100%)
4. Risk factors (what could stop them)
5. Acceleration strategy (how to speed it up)

Respond with JSON:
{
  "booking_probability": number 0-100,
  "predicted_days_to_booking": number or null,
  "confidence": number 0-100,
  "risk_factors": ["risk1", "risk2"],
  "acceleration_strategy": "what to do to speed up booking"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          booking_probability: { type: "number", minimum: 0, maximum: 100 },
          predicted_days_to_booking: { type: ["number", "null"] },
          confidence: { type: "number", minimum: 0, maximum: 100 },
          risk_factors: { type: "array", items: { type: "string" } },
          acceleration_strategy: { type: "string" },
        },
        required: ["booking_probability"],
      },
    });

    console.log(`[PredictOutcome] ${lead_id} = ${result.booking_probability.toFixed(0)}% booking prob`);

    return Response.json({
      success: true,
      lead_id,
      booking_probability: result.booking_probability,
      predicted_days: result.predicted_days_to_booking,
      confidence: result.confidence,
      risks: result.risk_factors,
      acceleration: result.acceleration_strategy,
    });
  } catch (error) {
    console.error("[PredictOutcome] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});

function calculateDaysSinceCreation(lead) {
  return Math.round(
    (Date.now() - new Date(lead.created_date)) / (1000 * 60 * 60 * 24)
  );
}