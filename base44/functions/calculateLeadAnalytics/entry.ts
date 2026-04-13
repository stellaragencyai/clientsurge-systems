import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leads
    const allLeads = await base44.entities.Lead.list();

    // Calculate metrics
    const totalLeads = allLeads.length;
    const highQuality = allLeads.filter(l => l.lead_quality_label === 'High').length;
    const mediumQuality = allLeads.filter(l => l.lead_quality_label === 'Medium').length;
    const lowQuality = allLeads.filter(l => l.lead_quality_label === 'Low').length;
    const avgScore = allLeads.length > 0 ? allLeads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / allLeads.length : 0;

    // Pipeline distribution
    const stageDistribution = {
      new: allLeads.filter(l => l.status === 'New').length,
      qualified: allLeads.filter(l => l.status === 'Qualified').length,
      contacted: allLeads.filter(l => l.status === 'Contacted').length,
      responded: allLeads.filter(l => l.status === 'Responded').length,
      booked: allLeads.filter(l => l.status === 'Booked').length,
      closed: allLeads.filter(l => l.status === 'Closed').length,
    };

    // Today's date
    const today = new Date().toISOString().split('T')[0];

    // Update or create analytics record
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

    return Response.json({
      success: true,
      analytics: analyticsData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});