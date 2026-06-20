import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Conversion Insights — read-only aggregation of funnel, drop-off, source performance, and time-to-convert
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { date_range = '30d', source_filter = null, industry_filter = null } = body;

    // Calculate date range cutoff
    const now = new Date();
    const rangeDays = { '7d': 7, '30d': 30, '90d': 90 }[date_range] || 30;
    const cutoff = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    // Fetch leads (limited for performance)
    let allLeads = await base44.asServiceRole.entities.Leads.filter({}, '-created_date', 5000);

    // Apply date filter
    allLeads = allLeads.filter(l => new Date(l.created_date) >= cutoff);

    // Apply source filter
    if (source_filter) {
      allLeads = allLeads.filter(l => l.source === source_filter);
    }
    // Apply industry filter
    if (industry_filter) {
      allLeads = allLeads.filter(l => l.industry === industry_filter);
    }

    const total = allLeads.length;

    // === FUNNEL STAGES ===
    const contacted = allLeads.filter(l =>
      ['contacted', 'replied', 'booked'].includes(l.outreach_status) ||
      ['Contacted', 'Replied', 'Qualified', 'Booking Prompt Sent', 'Booked', 'Closed'].includes(l.status)
    ).length;

    const responded = allLeads.filter(l =>
      ['replied', 'booked'].includes(l.outreach_status) ||
      ['Replied', 'Qualified', 'Booked', 'Closed'].includes(l.status)
    ).length;

    const booked = allLeads.filter(l =>
      l.outreach_status === 'booked' ||
      l.status === 'Booked' ||
      l.lead_state === 'BOOKED'
    ).length;

    const won = allLeads.filter(l =>
      l.lead_state === 'WON' ||
      l.crm_stage === 'Won' ||
      l.status === 'Closed'
    ).length;

    const rate = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;

    const funnelStages = [
      { stage: 'Created', count: total, rate_from_prev: 100 },
      { stage: 'Contacted', count: contacted, rate_from_prev: rate(contacted, total) },
      { stage: 'Responded', count: responded, rate_from_prev: rate(responded, contacted) },
      { stage: 'Booked', count: booked, rate_from_prev: rate(booked, responded) },
      { stage: 'Won', count: won, rate_from_prev: rate(won, booked) },
    ];

    // === DROP-OFF ANALYSIS ===
    const drops = [
      { from: 'Created → Contacted', count: total - contacted, rate: rate(total - contacted, total) },
      { from: 'Contacted → Responded', count: contacted - responded, rate: rate(contacted - responded, contacted) },
      { from: 'Responded → Booked', count: responded - booked, rate: rate(responded - booked, responded) },
      { from: 'Booked → Won', count: booked - won, rate: rate(booked - won, booked) },
    ];
    const biggestDropOff = drops.reduce((max, d) => d.rate > max.rate ? d : max, drops[0] || { from: 'N/A', rate: 0, count: 0 });

    // === SOURCE PERFORMANCE ===
    const sourceMap = {};
    allLeads.forEach(l => {
      const src = l.source || 'Unknown';
      if (!sourceMap[src]) sourceMap[src] = { total: 0, booked: 0, won: 0 };
      sourceMap[src].total++;
      if (l.outreach_status === 'booked' || l.status === 'Booked' || l.lead_state === 'BOOKED') {
        sourceMap[src].booked++;
      }
      if (l.lead_state === 'WON' || l.crm_stage === 'Won') {
        sourceMap[src].won++;
      }
    });
    const sourcePerformance = Object.entries(sourceMap)
      .map(([source, data]) => ({
        source,
        total: data.total,
        booked: data.booked,
        won: data.won,
        conversion_rate: rate(data.booked, data.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // === TIME TO CONVERT ===
    let timeToBookSamples = [];
    allLeads.forEach(l => {
      if (l.booked_at && l.created_date) {
        const hours = (new Date(l.booked_at) - new Date(l.created_date)) / (1000 * 60 * 60);
        if (hours > 0 && hours < 8760) timeToBookSamples.push(hours);
      }
    });
    const avgTimeToBook = timeToBookSamples.length > 0
      ? Math.round(timeToBookSamples.reduce((a, b) => a + b, 0) / timeToBookSamples.length)
      : null;

    let timeToContactSamples = [];
    allLeads.forEach(l => {
      if (l.last_contacted_at && l.created_date) {
        const hours = (new Date(l.last_contacted_at) - new Date(l.created_date)) / (1000 * 60 * 60);
        if (hours >= 0 && hours < 2160) timeToContactSamples.push(hours);
      }
    });
    const avgTimeToContact = timeToContactSamples.length > 0
      ? Math.round(timeToContactSamples.reduce((a, b) => a + b, 0) / timeToContactSamples.length * 10) / 10
      : null;

    // === INDUSTRY BREAKDOWN ===
    const industryMap = {};
    allLeads.forEach(l => {
      const ind = l.industry || 'Unknown';
      if (!industryMap[ind]) industryMap[ind] = { total: 0, booked: 0 };
      industryMap[ind].total++;
      if (l.outreach_status === 'booked' || l.status === 'Booked') industryMap[ind].booked++;
    });
    const industryBreakdown = Object.entries(industryMap)
      .map(([industry, data]) => ({
        industry,
        total: data.total,
        booked: data.booked,
        conversion_rate: rate(data.booked, data.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Available filters
    const allSources = [...new Set(allLeads.map(l => l.source).filter(Boolean))];
    const allIndustries = [...new Set(allLeads.map(l => l.industry).filter(Boolean))];

    return Response.json({
      meta: { total_leads: total, date_range, generated_at: now.toISOString() },
      funnel_stages: funnelStages,
      drop_off: { stages: drops, biggest: biggestDropOff },
      source_performance: sourcePerformance,
      time_to_convert: { avg_hours_to_book: avgTimeToBook, avg_hours_to_contact: avgTimeToContact },
      industry_breakdown: industryBreakdown,
      filter_options: { sources: allSources, industries: allIndustries },
    });
  } catch (error) {
    console.error('[getConversionInsights]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});