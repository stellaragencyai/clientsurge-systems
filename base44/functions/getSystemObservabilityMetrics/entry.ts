import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * System Observability Dashboard Metrics
 * Returns aggregated system health and activity data for real-time monitoring
 * READ-ONLY: No data modifications
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only access
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all required data in parallel
    const [
      allLeads,
      allEvents,
      allJobs,
      eventQueue,
    ] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({}, '-created_date', 5000),
      base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 1000),
      base44.asServiceRole.entities.AutomationJob?.filter({}, '-created_date', 1000).catch(() => []),
      base44.asServiceRole.entities.EventQueue?.filter({}, '-created_date', 500).catch(() => []),
    ]);

    // Compute time ranges
    const now = new Date();
    const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // === CORE METRICS ===
    const totalLeads = allLeads.length;
    const totalEvents = allEvents.length;
    const totalJobs = allJobs.length;
    const successfulJobs = allJobs.filter(j => j.status === 'completed').length;
    const failedJobs = allJobs.filter(j => j.status === 'failed').length;
    const successRate = totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0;
    const failedEvents = allEvents.filter(e => e.status === 'failed').length;

    // === LEAD FLOW (24H) ===
    const leadsLast24h = allLeads.filter(l => new Date(l.created_date) > oneDay);
    const contactedLeads = leadsLast24h.filter(l => l.outreach_status === 'contacted').length;
    const respondedLeads = leadsLast24h.filter(l => l.outreach_status === 'replied').length;
    const bookedLeads = leadsLast24h.filter(l => l.outreach_status === 'booked').length;

    // === HEALTH INDICATORS ===
    const smsEvents = allEvents.filter(e => e.event_type === 'sms_sent');
    const smsFailed = smsEvents.filter(e => e.status === 'failed').length;
    const smsHealth = smsEvents.length > 0 
      ? Math.round((smsFailed / smsEvents.length) * 100) 
      : 0;

    const emailEvents = allEvents.filter(e => e.event_type === 'email_sent');
    const emailFailed = emailEvents.filter(e => e.status === 'failed').length;
    const emailHealth = emailEvents.length > 0 
      ? Math.round((emailFailed / emailEvents.length) * 100) 
      : 0;

    const queuedItems = eventQueue?.filter(q => q.status === 'pending').length || 0;
    const processedQueue = eventQueue?.filter(q => q.status === 'processed').length || 0;

    // === ACTIVITY FEED ===
    const activityFeed = [
      ...allEvents.slice(0, 10).map(e => ({
        type: 'event',
        timestamp: e.created_date,
        event_type: e.event_type,
        status: e.status,
        channel: e.channel,
        provider: e.provider,
        lead_id: e.lead_id,
      })),
      ...allJobs.slice(0, 10).map(j => ({
        type: 'job',
        timestamp: j.created_date,
        job_type: j.automation_type,
        status: j.status,
        lead_id: j.lead_id,
      })),
      ...leadsLast24h.slice(0, 5).map(l => ({
        type: 'lead',
        timestamp: l.created_date,
        business_name: l.business_name,
        status: l.outreach_status,
        lead_id: l.id,
      })),
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

    // === SUGGESTIONS ===
    const suggestions = [];

    // 1. High-activity leads not yet contacted
    const highActivityNotContacted = allLeads.filter(l => {
      const score = l.intelligence_score || l.lead_score || 0;
      const contacted = l.outreach_status === 'contacted' || l.outreach_status === 'replied';
      return score >= 70 && !contacted;
    });
    if (highActivityNotContacted.length > 0) {
      suggestions.push({
        title: 'High-Activity Leads Waiting for Contact',
        description: `${highActivityNotContacted.length} high-score leads haven't been contacted yet. Prioritize outreach.`,
        priority: 'high',
        category: 'Leads',
      });
    }

    // 2. Recent activity spike
    const recentLeadCount = leadsLast24h.length;
    const avgDaily = allLeads.length > 30 ? allLeads.length / 30 : allLeads.length;
    if (recentLeadCount > avgDaily * 1.5) {
      suggestions.push({
        title: 'Lead Volume Spike Detected',
        description: `Unusual high volume in last 24h (${recentLeadCount} leads). Consider capacity review.`,
        priority: 'medium',
        category: 'System',
      });
    }

    // 3. Messaging health issues
    if (smsHealth > 15 || emailHealth > 15) {
      const worstChannel = smsHealth > emailHealth ? `SMS (${smsHealth}%)` : `Email (${emailHealth}%)`;
      suggestions.push({
        title: 'High Failure Rate in Messaging',
        description: `${worstChannel} showing elevated failure rates. Check provider health.`,
        priority: 'high',
        category: 'Messaging',
      });
    }

    // 4. Automation queue backlog
    if (queuedItems > 50) {
      suggestions.push({
        title: 'Automation Queue Building Up',
        description: `${queuedItems} jobs queued. Processing may be slower than usual.`,
        priority: 'medium',
        category: 'Automation',
      });
    }

    // 5. Success rate trend
    if (successRate < 70 && totalJobs > 20) {
      suggestions.push({
        title: 'Low Automation Success Rate',
        description: `Only ${successRate}% of jobs succeeded. Review error patterns.`,
        priority: 'high',
        category: 'Automation',
      });
    }

    return Response.json({
      timestamp: new Date().toISOString(),
      core_metrics: {
        total_leads: totalLeads,
        total_events: totalEvents,
        total_jobs: totalJobs,
        success_rate: successRate,
        failed_events: failedEvents,
        successful_jobs: successfulJobs,
        failed_jobs: failedJobs,
      },
      lead_flow_24h: {
        new_leads: leadsLast24h.length,
        contacted: contactedLeads,
        responded: respondedLeads,
        booked: bookedLeads,
      },
      health_indicators: {
        messaging_health: {
          sms_failure_rate: smsHealth,
          email_failure_rate: emailHealth,
          status: Math.max(smsHealth, emailHealth) > 20 ? 'Degraded' : 'Healthy',
        },
        automation_health: {
          success_rate: successRate,
          failed_count: failedJobs,
          status: successRate > 80 ? 'Healthy' : successRate > 60 ? 'Degraded' : 'Issue',
        },
        event_queue_health: {
          queued: queuedItems,
          processed: processedQueue,
          status: queuedItems > 100 ? 'Degraded' : 'Healthy',
        },
      },
      activity_feed: activityFeed,
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error) {
    console.error('[getSystemObservabilityMetrics]', error);
    return Response.json(
      { error: error.message || 'Failed to fetch observability metrics' },
      { status: 500 }
    );
  }
});