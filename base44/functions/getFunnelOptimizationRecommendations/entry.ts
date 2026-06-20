import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Funnel Optimization Recommendations
 * Analyzes existing lead, funnel, and event data to surface actionable insights.
 * READ-ONLY: No data modifications.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch data in parallel — limited for performance
    const [leads, events, funnels] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({}, '-created_date', 3000),
      base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 500),
      base44.asServiceRole.entities.ConversionFunnel.filter({}, '-created_date', 50).catch(() => []),
    ]);

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // === FUNNEL STAGE COUNTS ===
    const stageCounts = {
      created:   leads.length,
      contacted: leads.filter(l => ['contacted', 'replied', 'booked'].includes(l.outreach_status)).length,
      replied:   leads.filter(l => ['replied', 'booked'].includes(l.outreach_status)).length,
      booked:    leads.filter(l => l.outreach_status === 'booked' || l.lead_state === 'BOOKED').length,
      won:       leads.filter(l => l.lead_state === 'WON').length,
    };

    // === DROP-OFF RATES ===
    const dropOffs = [
      {
        stage: 'Created → Contacted',
        from: stageCounts.created,
        to: stageCounts.contacted,
        dropoff_rate: stageCounts.created > 0 ? Math.round(((stageCounts.created - stageCounts.contacted) / stageCounts.created) * 100) : 0,
      },
      {
        stage: 'Contacted → Replied',
        from: stageCounts.contacted,
        to: stageCounts.replied,
        dropoff_rate: stageCounts.contacted > 0 ? Math.round(((stageCounts.contacted - stageCounts.replied) / stageCounts.contacted) * 100) : 0,
      },
      {
        stage: 'Replied → Booked',
        from: stageCounts.replied,
        to: stageCounts.booked,
        dropoff_rate: stageCounts.replied > 0 ? Math.round(((stageCounts.replied - stageCounts.booked) / stageCounts.replied) * 100) : 0,
      },
      {
        stage: 'Booked → Won',
        from: stageCounts.booked,
        to: stageCounts.won,
        dropoff_rate: stageCounts.booked > 0 ? Math.round(((stageCounts.booked - stageCounts.won) / stageCounts.booked) * 100) : 0,
      },
    ];

    const worstDropOff = dropOffs.reduce((worst, cur) => cur.dropoff_rate > worst.dropoff_rate ? cur : worst, dropOffs[0]);

    // === SOURCE ANALYSIS ===
    const sourceCounts = {};
    leads.forEach(l => {
      const src = l.source || 'unknown';
      if (!sourceCounts[src]) sourceCounts[src] = { total: 0, converted: 0 };
      sourceCounts[src].total++;
      if (l.outreach_status === 'booked' || l.lead_state === 'WON') sourceCounts[src].converted++;
    });
    const sourceStats = Object.entries(sourceCounts)
      .map(([source, data]) => ({
        source,
        total: data.total,
        converted: data.converted,
        conversion_rate: Math.round((data.converted / data.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const highVolumeUnderperformers = sourceStats.filter(s => s.total >= 20 && s.conversion_rate < 5);
    const topPerformers = sourceStats.filter(s => s.conversion_rate >= 15 && s.total >= 5);

    // === RESPONSE TIME ANALYSIS ===
    const slowLeads = leads.filter(l => {
      if (l.outreach_status !== 'not_contacted') return false;
      const created = new Date(l.created_date);
      return (now - created) > 48 * 60 * 60 * 1000; // > 48h no contact
    });
    const slowResponseRate = leads.length > 0 ? Math.round((slowLeads.length / leads.length) * 100) : 0;

    // === STALE HIGH-VALUE LEADS ===
    const staleHighValue = leads.filter(l => {
      const score = l.intelligence_score || l.lead_score || 0;
      const lastActivity = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_date);
      return score >= 60 && lastActivity < sevenDaysAgo;
    });

    // === MESSAGING FAILURE ANALYSIS ===
    const failedEvents = events.filter(e => e.status === 'failed');
    const smsFailed = failedEvents.filter(e => e.event_type === 'sms_sent').length;
    const emailFailed = failedEvents.filter(e => e.event_type === 'email_sent').length;
    const totalSent = events.filter(e => ['sms_sent', 'email_sent'].includes(e.event_type)).length;
    const failureRate = totalSent > 0 ? Math.round(((smsFailed + emailFailed) / totalSent) * 100) : 0;

    // === BUILD RECOMMENDATIONS ===
    const recommendations = [];

    // A. FUNNEL DROP-OFF
    if (worstDropOff.dropoff_rate > 60) {
      recommendations.push({
        id: 'dropoff-1',
        category: 'Funnel Drop-off',
        title: `High Drop-off at "${worstDropOff.stage}"`,
        problem: `${worstDropOff.dropoff_rate}% of leads are lost at the ${worstDropOff.stage} stage (${worstDropOff.from} → ${worstDropOff.to}).`,
        action: `Audit messaging quality and timing at this stage. Consider A/B testing follow-up copy or reducing delay between touchpoints.`,
        impact: worstDropOff.dropoff_rate > 80 ? 'high' : 'medium',
      });
    }

    dropOffs.filter(d => d.dropoff_rate > 70 && d !== worstDropOff).forEach(d => {
      recommendations.push({
        id: `dropoff-${d.stage}`,
        category: 'Funnel Drop-off',
        title: `Drop-off Alert: ${d.stage}`,
        problem: `${d.dropoff_rate}% loss at this stage.`,
        action: `Review communication cadence and messaging for this transition. Consider a targeted follow-up sequence.`,
        impact: 'medium',
      });
    });

    // B. LEAD RESPONSE IMPROVEMENTS
    if (slowResponseRate > 20) {
      recommendations.push({
        id: 'response-1',
        category: 'Lead Response',
        title: 'Slow Initial Contact Rate',
        problem: `${slowLeads.length} leads (${slowResponseRate}%) have not been contacted within 48 hours.`,
        action: `Enable instant lead response automation for new leads. Reducing response time from hours to minutes significantly improves booking rates.`,
        impact: slowResponseRate > 40 ? 'high' : 'medium',
      });
    }

    if (staleHighValue.length > 0) {
      recommendations.push({
        id: 'response-2',
        category: 'Lead Response',
        title: 'High-Value Leads Going Stale',
        problem: `${staleHighValue.length} leads with score ≥ 60 have had no activity in the last 7 days.`,
        action: `Create a re-engagement sequence targeting these leads. A simple check-in message can restart stalled conversations.`,
        impact: 'high',
      });
    }

    // C. SOURCE OPTIMIZATION
    highVolumeUnderperformers.forEach(src => {
      recommendations.push({
        id: `source-${src.source}`,
        category: 'Source Optimization',
        title: `Low Conversion from "${src.source}"`,
        problem: `${src.total} leads from this source but only ${src.conversion_rate}% conversion rate.`,
        action: `Review lead quality filters for this source. Consider adjusting targeting criteria or qualifying leads more aggressively at intake.`,
        impact: src.total > 100 ? 'high' : 'medium',
      });
    });

    if (topPerformers.length > 0) {
      const top = topPerformers[0];
      recommendations.push({
        id: `source-top`,
        category: 'Source Optimization',
        title: `Expand Top-Performing Source: "${top.source}"`,
        problem: `"${top.source}" is converting at ${top.conversion_rate}% — significantly above average.`,
        action: `Increase lead volume from this source. Allocate more budget or outreach effort here.`,
        impact: 'medium',
      });
    }

    // D. STAGE CONVERSION IMPROVEMENTS
    const repliedToBooked = dropOffs.find(d => d.stage === 'Replied → Booked');
    if (repliedToBooked && repliedToBooked.dropoff_rate > 50) {
      recommendations.push({
        id: 'stage-1',
        category: 'Stage Conversion',
        title: 'Replied Leads Not Converting to Bookings',
        problem: `${repliedToBooked.dropoff_rate}% of leads that replied did not book. These are warm leads being lost.`,
        action: `Add a booking prompt message immediately after a reply is detected. Consider an AI booking agent to capture intent while it's fresh.`,
        impact: 'high',
      });
    }

    // E. MESSAGING FAILURES
    if (failureRate > 10) {
      recommendations.push({
        id: 'messaging-1',
        category: 'Messaging Health',
        title: 'Elevated Messaging Failure Rate',
        problem: `${failureRate}% of sent messages are failing (${smsFailed} SMS, ${emailFailed} email failures).`,
        action: `Review Twilio and Resend configuration. Check for invalid numbers, unsubscribes, or rate limiting issues.`,
        impact: failureRate > 20 ? 'high' : 'medium',
      });
    }

    // Sort: high → medium → low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => (priorityOrder[a.impact] || 2) - (priorityOrder[b.impact] || 2));

    return Response.json({
      generated_at: now.toISOString(),
      funnel_stages: stageCounts,
      drop_offs: dropOffs,
      source_stats: sourceStats,
      recommendations: recommendations.slice(0, 12),
      summary: {
        total_recommendations: recommendations.length,
        high_impact: recommendations.filter(r => r.impact === 'high').length,
        medium_impact: recommendations.filter(r => r.impact === 'medium').length,
        low_impact: recommendations.filter(r => r.impact === 'low').length,
        worst_dropoff_stage: worstDropOff.stage,
        worst_dropoff_rate: worstDropOff.dropoff_rate,
      },
    });
  } catch (error) {
    console.error('[getFunnelOptimizationRecommendations]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});