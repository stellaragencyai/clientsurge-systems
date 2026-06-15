import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Get Sales Automation Metrics: Dashboard data for outbound funnel
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30d';

    const metrics = {
      total_leads: 0,
      leads_contacted: 0,
      leads_replied: 0,
      leads_converted: 0,
      active_sequences: 0,
      response_rate: 0,
      conversion_rate: 0,
      top_sequences: [],
    };

    // Calculate date range
    const now = new Date();
    let periodMs = 30 * 24 * 3600000; // 30d
    if (period === '7d') periodMs = 7 * 24 * 3600000;
    if (period === '1d') periodMs = 24 * 3600000;

    const periodStart = new Date(now.getTime() - periodMs);

    // Fetch leads in period
    const leads = await base44.asServiceRole.entities.OutboundLead.filter(
      {},
      '-created_date',
      1000
    ).then(l => l?.filter(lead => new Date(lead.created_date) > periodStart) || [])
      .catch(() => []);

    metrics.total_leads = leads.length;
    metrics.leads_contacted = leads.filter(l => ['contacted', 'replied', 'booked', 'converted'].includes(l.outreach_status)).length;
    metrics.leads_replied = leads.filter(l => ['replied', 'booked', 'converted'].includes(l.outreach_status)).length;
    metrics.leads_converted = leads.filter(l => l.outreach_status === 'converted').length;

    if (metrics.total_leads > 0) {
      metrics.response_rate = Math.round((metrics.leads_replied / metrics.leads_contacted) * 100);
      metrics.conversion_rate = Math.round((metrics.leads_converted / metrics.total_leads) * 100);
    }

    // Fetch active sequences
    const sequences = await base44.asServiceRole.entities.OutboundSequence.filter(
      { enabled: true },
      '-total_conversions',
      5
    ).catch(() => []);

    metrics.active_sequences = sequences?.length || 0;
    metrics.top_sequences = sequences?.map(s => ({
      name: s.sequence_name,
      leads_sent: s.total_leads_sent,
      conversions: s.total_conversions,
      conversion_rate: s.conversion_rate_percent,
    })) || [];

    return Response.json({
      success: true,
      metrics,
      period,
    });
  } catch (error) {
    console.error('[getSalesAutomationMetrics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});