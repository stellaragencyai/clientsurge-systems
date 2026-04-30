/**
 * AI Function 7: predictChurnRisk
 * Identifies existing customers at risk of leaving
 * 
 * INPUT: Lead/customer data + booking history + engagement
 * OUTPUT: Churn risk score + re-engagement strategy
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
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      100
    );

    // Only analyze if they've booked before
    const hasBooked = events.some(e => e.event_type === "booking_created");
    if (!hasBooked) {
      return Response.json({
        success: true,
        churn_risk: 0,
        message: "Lead has not booked yet",
      });
    }

    console.log(`[ChurnRisk] Analyzing churn risk for ${lead_id}`);

    const lastBooking = events.find(e => e.event_type === "booking_created");
    const daysSinceLastBooking = Math.round(
      (Date.now() - new Date(lastBooking.created_date)) / (1000 * 60 * 60 * 24)
    );

    const context = {
      last_booking_days_ago: daysSinceLastBooking,
      booking_frequency_days: 45, // avg customer books every 45 days
      engagement_recent: events.filter(
        (e) =>
          (Date.now() - new Date(e.created_date)) / (1000 * 60 * 60 * 24) < 7
      ).length,
      reply_rate: (events.filter(e => e.direction === "inbound").length / Math.max(1, events.filter(e => e.direction === "outbound").length)) * 100,
      total_bookings: events.filter(e => e.event_type === "booking_created").length,
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Predict churn risk for this existing customer.

CUSTOMER PROFILE:
- Name: ${lead.full_name}
- Business: ${lead.business_name}
- Total Bookings: ${context.total_bookings}
- Days Since Last Booking: ${context.last_booking_days_ago}
- Typical Booking Frequency: Every ${context.booking_frequency_days} days
- Recent Engagement (last 7 days): ${context.engagement_recent} interactions
- Reply Rate: ${context.reply_rate.toFixed(0)}%

CHURN RISK ASSESSMENT:
- Days overdue = days since last booking - typical frequency
- If 0-14 days overdue: LOW risk (20%)
- If 15-30 days overdue: MEDIUM risk (50%)
- If 30+ days overdue: HIGH risk (80%)
- Adjust based on recent engagement (+20% if no engagement, -10% if active)
- Adjust based on reply rate (high engagement = lower risk)

Respond with JSON:
{
  "churn_risk_score": number 0-100,
  "churn_risk_level": "Low" | "Medium" | "High" | "Critical",
  "reasoning": "why this risk",
  "reengagement_strategy": "specific action to win them back",
  "offer_suggestion": "what to offer them"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          churn_risk_score: { type: "number", minimum: 0, maximum: 100 },
          churn_risk_level: {
            type: "string",
            enum: ["Low", "Medium", "High", "Critical"],
          },
          reasoning: { type: "string" },
          reengagement_strategy: { type: "string" },
          offer_suggestion: { type: "string" },
        },
        required: ["churn_risk_score", "churn_risk_level"],
      },
    });

    // If high risk, create re-engagement automation job
    if (result.churn_risk_score >= 60) {
      await base44.asServiceRole.entities.AutomationJob.create({
        lead_id,
        job_type: "churn_prevention",
        trigger_event: "high_churn_risk",
        status: "queued",
        scheduled_for: new Date().toISOString(),
        result_metadata: JSON.stringify({
          strategy: result.reengagement_strategy,
          offer: result.offer_suggestion,
        }),
      });
    }

    console.log(`[ChurnRisk] ${lead_id} = ${result.churn_risk_score} (${result.churn_risk_level})`);

    return Response.json({
      success: true,
      lead_id,
      churn_risk_score: result.churn_risk_score,
      churn_risk_level: result.churn_risk_level,
      reasoning: result.reasoning,
      reengagement: result.reengagement_strategy,
      offer: result.offer_suggestion,
    });
  } catch (error) {
    console.error("[ChurnRisk] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});