/**
 * Optimize Followup Sequence
 * AI adjusts follow-up timing & messaging based on lead response patterns
 * Dynamic, not template-based
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, current_step } = await req.json();

    if (!lead_id) {
      return Response.json({ error: "lead_id required" }, { status: 400 });
    }

    console.log(`[FollowupOptimizer] Optimizing sequence for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get all events for this lead
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      50
    );

    // 3. Analyze response patterns
    const avgResponseTime = events && events.length > 1
      ? events.reduce((sum, e, i, arr) => {
          if (i === 0) return 0;
          const prev = new Date(arr[i - 1].created_date);
          const curr = new Date(e.created_date);
          return sum + (curr - prev) / (1000 * 60 * 60);
        }, 0) / (events.length - 1)
      : 24;

    const openRate = events
      ? events.filter((e) => e.status === "opened").length / events.length
      : 0.5;

    const clickRate = events
      ? events.filter((e) => e.status === "clicked").length / events.length
      : 0.2;

    // 4. Determine next action timing
    let recommendedDelay = 24; // hours

    if (openRate > 0.7 && clickRate > 0.4) {
      // Highly engaged - follow up faster
      recommendedDelay = 12;
    } else if (openRate > 0.4) {
      // Moderately engaged
      recommendedDelay = 24;
    } else {
      // Low engagement - wait longer
      recommendedDelay = 48;
    }

    // 5. Determine message approach
    let messageApproach = "standard";
    if (openRate < 0.3) {
      messageApproach = "subject_line_test"; // Try different subject
    } else if (clickRate < openRate * 0.3) {
      messageApproach = "value_focus"; // CTA not compelling
    } else {
      messageApproach = "progress_focus"; // They're engaged
    }

    // 6. Calculate optimal # of remaining touches
    const daysSinceFirst = events && events.length > 0
      ? Math.floor(
          (new Date() - new Date(events[events.length - 1].created_date)) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const remainingTouches = Math.max(1, 4 - Math.ceil(daysSinceFirst / 7));

    console.log(
      `[FollowupOptimizer] Recommended delay: ${recommendedDelay}h, approach: ${messageApproach}`
    );

    return Response.json({
      success: true,
      lead_id,
      recommended_delay_hours: recommendedDelay,
      message_approach: messageApproach,
      open_rate: Math.round(openRate * 100),
      click_rate: Math.round(clickRate * 100),
      remaining_touches: remainingTouches,
      avg_response_time_hours: Math.round(avgResponseTime),
      optimization_details: {
        should_shorten_sequence: clickRate < 0.15,
        should_extend_sequence: openRate > 0.6 && clickRate > 0.3,
        should_personalize_further: openRate > 0.5 && clickRate < 0.25,
      },
    });
  } catch (error) {
    console.error("[FollowupOptimizer] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});