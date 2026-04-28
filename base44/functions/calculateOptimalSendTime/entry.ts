/**
 * Calculate Optimal Send Time
 * Predicts best time to send email/SMS based on lead behavior & industry
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, message_type = "email" } = await req.json();

    console.log(`[OptimalTime] Calculating for lead ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get communication history
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      10
    );

    // 3. Analyze engagement times
    let engagementHours = [];
    if (events && events.length > 0) {
      for (const event of events) {
        if (event.status === "opened" || event.status === "clicked") {
          const date = new Date(event.created_date || event.metadata_json);
          engagementHours.push(date.getHours());
        }
      }
    }

    // 4. Get average engagement hour
    const avgEngagementHour =
      engagementHours.length > 0
        ? Math.round(
            engagementHours.reduce((a, b) => a + b, 0) / engagementHours.length
          )
        : null;

    // 5. Industry-based defaults
    const industryOptimalHours = {
      hvac: 7, // Early morning for HVAC
      roofing: 8,
      contractors: 7,
      med_spa: 14, // Afternoon for spas
      dental: 10,
      chiropractic: 10,
    };

    const industryHour = industryOptimalHours[
      lead.business_type?.toLowerCase().replace(/ /g, "_") || "default"
    ] || 10;

    // 6. Determine final send time
    const optimalHour = avgEngagementHour || industryHour;

    // 7. Adjust for message type
    const delayMinutes = message_type === "sms" ? 0 : 30; // Email benefits from slight delay

    // 8. Calculate next occurrence
    const now = new Date();
    let sendTime = new Date();
    sendTime.setHours(optimalHour, delayMinutes, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (sendTime <= now) {
      sendTime.setDate(sendTime.getDate() + 1);
    }

    console.log(
      `[OptimalTime] Lead ${lead_id} optimal hour: ${optimalHour}, scheduled: ${sendTime}`
    );

    return Response.json({
      success: true,
      lead_id,
      optimal_hour: optimalHour,
      optimal_send_time: sendTime.toISOString(),
      confidence: avgEngagementHour ? "high" : "medium",
      reasoning: avgEngagementHour
        ? `Based on past engagement (avg hour: ${avgEngagementHour})`
        : `Based on ${lead.business_type} industry pattern (hour: ${industryHour})`,
    });
  } catch (error) {
    console.error("[OptimalTime] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});