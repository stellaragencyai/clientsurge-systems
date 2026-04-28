/**
 * Predict Optimal Closer
 * Routes lead to team member with highest predicted close rate
 * Based on historical conversion data + lead profile
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id } = await req.json();

    if (!lead_id || !project_id) {
      return Response.json(
        { error: "lead_id and project_id required" },
        { status: 400 }
      );
    }

    console.log(`[PredictCloser] Finding optimal closer for ${lead_id}`);

    // 1. Get lead details
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get all leads (for historical analysis)
    const allLeads = await base44.asServiceRole.entities.Leads.filter(
      { assigned_to: { $exists: true } },
      "-created_date",
      500
    );

    // 3. Build team member profiles with conversion rates
    const teamStats = {};
    if (allLeads && allLeads.length > 0) {
      for (const pastLead of allLeads) {
        const rep = pastLead.assigned_to;
        if (!rep) continue;

        if (!teamStats[rep]) {
          teamStats[rep] = {
            email: rep,
            total_leads: 0,
            booked_leads: 0,
            by_industry: {},
            by_source: {},
          };
        }

        teamStats[rep].total_leads++;

        // Track conversion
        if (
          pastLead.status === "Booked" ||
          pastLead.status === "Booking Prompt Sent"
        ) {
          teamStats[rep].booked_leads++;
        }

        // Track by industry
        const industry = pastLead.business_type || "unknown";
        if (!teamStats[rep].by_industry[industry]) {
          teamStats[rep].by_industry[industry] = { total: 0, booked: 0 };
        }
        teamStats[rep].by_industry[industry].total++;
        if (pastLead.status === "Booked") {
          teamStats[rep].by_industry[industry].booked++;
        }

        // Track by source
        const source = pastLead.source || "unknown";
        if (!teamStats[rep].by_source[source]) {
          teamStats[rep].by_source[source] = { total: 0, booked: 0 };
        }
        teamStats[rep].by_source[source].total++;
        if (pastLead.status === "Booked") {
          teamStats[rep].by_source[source].booked++;
        }
      }
    }

    // 4. Calculate predicted close rate for each rep
    const predictions = Object.entries(teamStats).map(([email, stats]) => {
      let baseRate = stats.total_leads > 0 ? stats.booked_leads / stats.total_leads : 0;

      // Boost if specialist in this industry
      const industryStats =
        stats.by_industry[lead.business_type || "unknown"];
      let industryBoost = 0;
      if (industryStats && industryStats.total > 3) {
        industryBoost =
          (industryStats.booked / industryStats.total - baseRate) * 0.3;
      }

      // Boost if specialist in this source
      const sourceStats = stats.by_source[lead.source || "unknown"];
      let sourceBoost = 0;
      if (sourceStats && sourceStats.total > 2) {
        sourceBoost = (sourceStats.booked / sourceStats.total - baseRate) * 0.2;
      }

      const predictedRate = Math.max(0, baseRate + industryBoost + sourceBoost);

      return {
        email,
        predicted_close_rate: Math.round(predictedRate * 100),
        base_rate: Math.round(baseRate * 100),
        industry_specialty: lead.business_type,
        industry_rate: industryStats
          ? Math.round((industryStats.booked / industryStats.total) * 100)
          : null,
        total_past_leads: stats.total_leads,
      };
    });

    // 5. Sort by predicted rate
    predictions.sort((a, b) => b.predicted_close_rate - a.predicted_close_rate);

    const topCloser = predictions[0];

    console.log(
      `[PredictCloser] Top closer: ${topCloser?.email} (${topCloser?.predicted_close_rate}%)`
    );

    return Response.json({
      success: true,
      lead_id,
      recommended_closer: topCloser?.email,
      predicted_close_rate: topCloser?.predicted_close_rate,
      reasoning: topCloser?.industry_specialty
        ? `Specialist in ${topCloser.industry_specialty} (${topCloser.industry_rate}% close rate)`
        : `Highest overall closer (${topCloser?.base_rate}% close rate)`,
      all_predictions: predictions,
    });
  } catch (error) {
    console.error("[PredictCloser] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});