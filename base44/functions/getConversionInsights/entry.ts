import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Conversion Insights - Funnel analysis and drop-off tracking
 * READ-ONLY: Aggregates existing lead data for funnel visibility
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse query params for filters
    const url = new URL(req.url);
    const dateRangeParam = url.searchParams.get('dateRange'); // days
    const sourceFilter = url.searchParams.get('source');
    const industryFilter = url.searchParams.get('industry');

    // Fetch all leads
    const allLeads = await base44.asServiceRole.entities.Leads.filter({}, '-created_date', 5000);

    const now = new Date();
    const daysBack = dateRangeParam ? parseInt(dateRangeParam) : 90;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Apply filters
    let filteredLeads = allLeads.filter(l => new Date(l.created_date) > cutoffDate);
    if (sourceFilter) filteredLeads = filteredLeads.filter(l => l.source === sourceFilter);
    if (industryFilter) filteredLeads = filteredLeads.filter(l => l.industry === industryFilter);

    // === FUNNEL STAGES ===
    const stageCreated = filteredLeads.length;
    const stageContacted = filteredLeads.filter(l => 
      l.outreach_status === 'contacted' || l.outreach_status === 'replied' || l.outreach_status === 'booked'
    ).length;
    const stageResponded = filteredLeads.filter(l => 
      l.outreach_status === 'replied' || l.outreach_status === 'booked'
    ).length;
    const stageBooked = filteredLeads.filter(l => 
      l.outreach_status === 'booked'
    ).length;
    const stageClosed = filteredLeads.filter(l => 
      l.lead_state === 'WON' || (l.outreach_status === 'booked' && l.lead_state === 'BOOKED')
    ).length;

    // === CONVERSION RATES ===
    const conversionRates = {
      created_to_contacted: stageCreated > 0 ? Math.round((stageContacted / stageCreated) * 100) : 0,
      contacted_to_responded: stageContacted > 0 ? Math.round((stageResponded / stageContacted) * 100) : 0,
      responded_to_booked: stageResponded > 0 ? Math.round((stageBooked / stageResponded) * 100) : 0,
      booked_to_closed: stageBooked > 0 ? Math.round((stageClosed / stageBooked) * 100) : 0,
      overall: stageCreated > 0 ? Math.round((stageClosed / stageCreated) * 100) : 0,
    };

    // === DROP-OFF ANALYSIS ===
    const dropOffs = [
      { stage: 'Created → Contacted', leads: stageCreated - stageContacted, rate: 100 - conversionRates.created_to_contacted },
      { stage: 'Contacted → Responded', leads: stageContacted - stageResponded, rate: 100 - conversionRates.contacted_to_responded },
      { stage: 'Responded → Booked', leads: stageResponded - stageBooked, rate: 100 - conversionRates.responded_to_booked },
      { stage: 'Booked → Closed', leads: stageBooked - stageClosed, rate: 100 - conversionRates.booked_to_closed },
    ];
    const topDropOff = dropOffs.sort((a, b) => b.rate - a.rate)[0];

    // === SOURCE PERFORMANCE ===
    const sources = {};
    filteredLeads.forEach(l => {
      const src = l.source || 'Unknown';
      if (!sources[src]) {
        sources[src] = { leads: 0, booked: 0, conversions: 0 };
      }
      sources[src].leads++;
      if (l.outreach_status === 'booked') sources[src].booked++;
      if (l.lead_state === 'WON') sources[src].conversions++;
    });

    const sourcePerformance = Object.entries(sources)
      .map(([source, data]) => ({
        source,
        total_leads: data.leads,
        booked: data.booked,
        conversions: data.conversions,
        booking_rate: data.leads > 0 ? Math.round((data.booked / data.leads) * 100) : 0,
        conversion_rate: data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0,
      }))
      .sort((a, b) => b.total_leads - a.total_leads);

    // === TIME TO CONVERT ===
    const leadsWithConversion = filteredLeads.filter(l => 
      l.last_contacted_at && (l.lead_state === 'WON' || l.outreach_status === 'booked')
    );
    const leadsWithBookingTime = filteredLeads.filter(l => 
      l.created_date && l.booked_at
    );

    const avgTimeToBook = leadsWithBookingTime.length > 0
      ? Math.round(
          leadsWithBookingTime.reduce((sum, l) => {
            const created = new Date(l.created_date);
            const booked = new Date(l.booked_at);
            return sum + (booked - created) / (1000 * 60 * 60 * 24); // days
          }, 0) / leadsWithBookingTime.length
        )
      : 0;

    const avgTimeToConvert = leadsWithConversion.length > 0
      ? Math.round(
          leadsWithConversion.reduce((sum, l) => {
            const contacted = new Date(l.last_contacted_at);
            const converted = new Date(l.lead_state === 'WON' ? l.updated_date : l.booked_at);
            return sum + (converted - contacted) / (1000 * 60 * 60 * 24); // days
          }, 0) / leadsWithConversion.length
        )
      : 0;

    return Response.json({
      timestamp: new Date().toISOString(),
      date_range_days: daysBack,
      funnel_stages: {
        created: stageCreated,
        contacted: stageContacted,
        responded: stageResponded,
        booked: stageBooked,
        closed: stageClosed,
      },
      conversion_rates: conversionRates,
      drop_off_analysis: {
        stages: dropOffs,
        top_drop_off: topDropOff,
      },
      source_performance: sourcePerformance,
      time_to_convert: {
        average_days_to_book: avgTimeToBook,
        average_days_contact_to_conversion: avgTimeToConvert,
        leads_with_booking_time: leadsWithBookingTime.length,
        leads_with_conversion_time: leadsWithConversion.length,
      },
    });
  } catch (error) {
    console.error('[getConversionInsights]', error);
    return Response.json(
      { error: error.message || 'Failed to fetch conversion insights' },
      { status: 500 }
    );
  }
});