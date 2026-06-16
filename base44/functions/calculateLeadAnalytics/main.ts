import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { AuthGuardError, requireAdminUser } from "../_shared/authGuards.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await requireAdminUser(base44);

    const allLeads = await base44.entities.Lead.list();

    const totalLeads = allLeads.length;
    const highQuality = allLeads.filter((lead) => lead.lead_quality_label === "High").length;
    const mediumQuality = allLeads.filter((lead) => lead.lead_quality_label === "Medium").length;
    const lowQuality = allLeads.filter((lead) => lead.lead_quality_label === "Low").length;
    const avgScore =
      allLeads.length > 0
        ? allLeads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / allLeads.length
        : 0;

    const stageDistribution = {
      new: allLeads.filter((lead) => lead.status === "New").length,
      qualified: allLeads.filter((lead) => lead.status === "Qualified").length,
      contacted: allLeads.filter((lead) => lead.status === "Contacted").length,
      responded: allLeads.filter((lead) => lead.status === "Responded").length,
      booked: allLeads.filter((lead) => lead.status === "Booked").length,
      closed: allLeads.filter((lead) => lead.status === "Closed").length,
    };

    const today = new Date().toISOString().split("T")[0];
    const existing = await base44.entities.LeadAnalytics.filter({ date: today });

    const analyticsData = {
      total_leads: totalLeads,
      high_quality_count: highQuality,
      medium_quality_count: mediumQuality,
      low_quality_count: lowQuality,
      avg_lead_score: Math.round(avgScore * 10) / 10,
      stage_new: stageDistribution.new,
      stage_qualified: stageDistribution.qualified,
      stage_contacted: stageDistribution.contacted,
      stage_responded: stageDistribution.responded,
      stage_booked: stageDistribution.booked,
      stage_closed: stageDistribution.closed,
    };

    if (existing.length > 0) {
      await base44.entities.LeadAnalytics.update(existing[0].id, analyticsData);
    } else {
      await base44.entities.LeadAnalytics.create({
        date: today,
        ...analyticsData,
      });
    }

    return secureJson({
      success: true,
      analytics: analyticsData,
    });
  } catch (error) {
    const status = error instanceof AuthGuardError ? error.status : 500;
    const code = error instanceof AuthGuardError ? error.code : undefined;
    const message =
      error instanceof Error ? error.message : "Failed to calculate lead analytics";

    return secureJson({ error: message, code }, { status });
  }
});
