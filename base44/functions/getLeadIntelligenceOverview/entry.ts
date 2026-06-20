import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function getRecommendedAction(score) {
  if (score >= 80) return "Call now";
  if (score >= 70) return "Send SMS";
  if (score >= 50) return "Send nurture email";
  return "Add to drip campaign";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch segment counts and top priority queue in parallel
    const [hotLeads, warmLeads, highIntentLeads, nurture, engaged, dormant, cold, priorityQueue] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "HOT_LEADS" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "WARM" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "HIGH_INTENT" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "NURTURE" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "ENGAGED" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "DORMANT" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({ intelligence_segment: "COLD" }, "-intelligence_score", 50).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({}, "-intelligence_score", 20).catch(() => []),
    ]);

    const hotCount = (hotLeads || []).length;
    const warmCount = (warmLeads || []).length;
    const highIntentCount = (highIntentLeads || []).length;
    const nurtureCount = (nurture || []).length;
    const engagedCount = (engaged || []).length;
    const dormantCount = (dormant || []).length;
    const coldCount = (cold || []).length;
    const totalLeads = hotCount + warmCount + highIntentCount + nurtureCount + engagedCount + dormantCount + coldCount;

    const totalRevenueAtRisk = (priorityQueue || []).reduce((sum, l) => sum + (l.revenue_impact_estimate || 0), 0);

    const formattedQueue = (priorityQueue || []).map((lead) => ({
      id: lead.id,
      full_name: lead.full_name,
      business_name: lead.business_name,
      intelligence_score: lead.intelligence_score || 0,
      intelligence_segment: lead.intelligence_segment || "UNKNOWN",
      revenue_impact: lead.revenue_impact_estimate || 0,
      last_activity_at: lead.last_activity_at,
      status: lead.status,
      crm_stage: lead.crm_stage,
      phone: lead.phone,
      email: lead.email,
      recommended_action: getRecommendedAction(lead.intelligence_score || 0),
    }));

    return Response.json({
      success: true,
      kpis: {
        total_leads: totalLeads,
        hot_leads: hotCount,
        warm_leads: warmCount,
        high_intent_leads: highIntentCount,
        nurture_leads: nurtureCount,
        engaged_leads: engagedCount,
        dormant_leads: dormantCount,
        cold_leads: coldCount,
        total_revenue_at_risk: Math.round(totalRevenueAtRisk * 100) / 100,
      },
      distribution: {
        hot_percent: totalLeads > 0 ? Math.round((hotCount / totalLeads) * 100) : 0,
        warm_percent: totalLeads > 0 ? Math.round(((warmCount + highIntentCount) / totalLeads) * 100) : 0,
        cold_percent: totalLeads > 0 ? Math.round(((coldCount + dormantCount) / totalLeads) * 100) : 0,
        engaged_percent: totalLeads > 0 ? Math.round((engagedCount / totalLeads) * 100) : 0,
        dormant_percent: totalLeads > 0 ? Math.round((dormantCount / totalLeads) * 100) : 0,
      },
      priority_queue: formattedQueue,
    });
  } catch (error) {
    console.error("getLeadIntelligenceOverview error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});