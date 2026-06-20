import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * System Observability Metrics — read-only aggregated metrics for admin dashboard
 * No data modifications; monitoring layer only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all required data in parallel
    const [
      allLeads,
      allEvents,
      allJobs,
      deadLetters,
      allQueued,
    ] = await Promise.all([
      base44.asServiceRole.entities.Leads.filter({}, '-created_date', 5000),
      base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 5000),
      base44.asServiceRole.entities.AutomationJob?.filter({}, '-created_date', 5000).catch(() => []),
      base44.asServiceRole.entities.DeadLetterLog?.filter({}, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.EventQueue?.filter({}, '-created_date', 500).catch(() => []),
    ]);

    // === COMPUTE METRICS ===

    // 1. Event counts by type (last 24h)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = allEvents.filter(e => new Date(e.created_date) > oneDayAgo);
    const eventTypeBreakdown = {};
    recentEvents.forEach(e => {
      eventTypeBreakdown[e.event_type] = (eventTypeBreakdown[e.event_type] || 0) + 1;
    });

    // 2. Lead metrics (24h)
    const recentLeads = allLeads.filter(l => new Date(l.created_date) > oneDayAgo);
    const contactedLeads = recentLeads.filter(l => l.outreach_status === 'contacted').length;
    const repliedLeads = recentLeads.filter(l => l.outreach_status === 'replied').length;
    const bookedLeads = recentLeads.filter(l => l.outreach_status === 'booked').length;

    // 3. Automation job metrics
    const jobsByStatus = {
      pending: allJobs.filter(j => j.status === 'pending').length,
      processing: allJobs.filter(j => j.status === 'processing').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      failed: allJobs.filter(j => j.status === 'failed').length,
    };
    const totalJobs = allJobs.length;
    const successfulJobs = jobsByStatus.completed;
    const successRate = totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0;

    // 4. Communication event breakdown
    const eventBreakdown = {
      sms_sent: recentEvents.filter(e => e.event_type === 'sms_sent').length,
      email_sent: recentEvents.filter(e => e.event_type === 'email_sent').length,
      webhook_sent: recentEvents.filter(e => e.event_type === 'webhook_sent').length,
      lead_created: recentEvents.filter(e => e.event_type === 'lead_created').length,
      automation_triggered: recentEvents.filter(e => e.event_type.includes('automation') || e.event_type.includes('triggered')).length,
    };

    // 5. Failure tracking
    const failedEvents = recentEvents.filter(e => e.status === 'failed');
    const recentErrors = failedEvents.slice(0, 20).map(e => ({
      id: e.id,
      event_type: e.event_type,
      error: e.error_message?.substring(0, 100) || 'Unknown error',
      timestamp: e.created_date,
    }));

    // 6. Dead letter and queue status
    const deadLetterCount = deadLetters?.length || 0;
    const queuedCount = allQueued?.length || 0;

    // 7. Performance metrics
    const processingTimes = allJobs
      .filter(j => j.created_date && j.updated_date)
      .map(j => {
        const created = new Date(j.created_date);
        const updated = new Date(j.updated_date);
        return updated.getTime() - created.getTime();
      })
      .filter(t => t > 0);
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / 1000) // seconds
      : 0;

    // 8. Pipeline stage counters
    const pipelineStages = {
      lead_created: recentLeads.length,
      events_generated: recentEvents.length,
      automation_jobs: allJobs.filter(j => new Date(j.created_date) > oneDayAgo).length,
      messages_sent: eventBreakdown.sms_sent + eventBreakdown.email_sent,
      webhooks_sent: eventBreakdown.webhook_sent,
    };

    // === OPTIMIZATION INSIGHTS ===

    // 1. Lead source performance
    const leadsBySource = {};
    recentLeads.forEach(l => {
      const src = l.source || 'unknown';
      if (!leadsBySource[src]) leadsBySource[src] = { total: 0, booked: 0 };
      leadsBySource[src].total++;
      if (l.outreach_status === 'booked') leadsBySource[src].booked++;
    });
    const topLeadSources = Object.entries(leadsBySource)
      .map(([source, data]) => ({
        source,
        total: data.total,
        booked: data.booked,
        conversion_rate: data.total > 0 ? Math.round((data.booked / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 5);

    // 2. Average response time
    const responseTimes = recentLeads
      .filter(l => l.last_contacted_at && l.created_date)
      .map(l => {
        const created = new Date(l.created_date);
        const contacted = new Date(l.last_contacted_at);
        return (contacted.getTime() - created.getTime()) / 1000 / 60; // minutes
      })
      .filter(t => t > 0 && t < 10080); // filter outliers (>7 days)
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // 3. Automation job type performance
    const jobsByType = {};
    allJobs.forEach(j => {
      const type = j.automation_type || 'unknown';
      if (!jobsByType[type]) jobsByType[type] = { total: 0, successful: 0, failed: 0 };
      jobsByType[type].total++;
      if (j.status === 'completed') jobsByType[type].successful++;
      if (j.status === 'failed') jobsByType[type].failed++;
    });
    const topJobTypes = Object.entries(jobsByType)
      .map(([type, data]) => ({
        type,
        count: data.total,
        success_rate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Failure categories
    const failureReasons = {};
    failedEvents.forEach(e => {
      const reason = e.event_type || 'unknown';
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });
    const topFailures = Object.entries(failureReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Most engaged leads
    const leadEngagement = recentLeads
      .map(l => ({
        id: l.id,
        name: l.full_name,
        email: l.email,
        interactions: (l.last_contacted_at ? 1 : 0) + (l.reply_sentiment ? 1 : 0) + (l.booked_at ? 1 : 0),
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 5);

    // 6. Least engaged leads (no contact in 24h)
    const leastEngaged = recentLeads
      .filter(l => !l.last_contacted_at)
      .slice(0, 5);

    // 7. High-intent leads not recently contacted
    const highIntentUncontacted = allLeads
      .filter(l => 
        (l.ai_intent === 'booking_ready' || l.ai_intent === 'pricing_interest') &&
        (!l.last_contacted_at || new Date(l.last_contacted_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      )
      .slice(0, 5);

    // 8. Conversion metrics
    const totalLeads24h = recentLeads.length;
    const bookedLeads24h = recentLeads.filter(l => l.outreach_status === 'booked').length;
    const respondedLeads24h = recentLeads.filter(l => l.outreach_status === 'replied').length;
    const contactedLeads24h = recentLeads.filter(l => l.outreach_status === 'contacted').length;
    const conversionRate = totalLeads24h > 0 ? Math.round((bookedLeads24h / totalLeads24h) * 100) : 0;
    const responseRate = contactedLeads24h > 0 ? Math.round((respondedLeads24h / contactedLeads24h) * 100) : 0;

    // 9. Event distribution
    const totalEventVolume = recentEvents.length;
    const smsPercentage = totalEventVolume > 0 ? Math.round((eventBreakdown.sms_sent / totalEventVolume) * 100) : 0;
    const emailPercentage = totalEventVolume > 0 ? Math.round((eventBreakdown.email_sent / totalEventVolume) * 100) : 0;

    // 10. Daily activity summary
    const dailyActivitySummary = {
      new_leads: recentLeads.length,
      total_events: recentEvents.length,
      jobs_executed: allJobs.filter(j => new Date(j.created_date) > oneDayAgo).length,
      messages_sent: eventBreakdown.sms_sent + eventBreakdown.email_sent,
      system_health: system_status.health_score,
    };

    return Response.json({
      timestamp: new Date().toISOString(),
      observability: {
        // KPI cards
        kpis: {
          total_events_24h: recentEvents.length,
          successful_jobs: successfulJobs,
          failed_jobs: jobsByStatus.failed,
          retry_count: allJobs.filter(j => (j.metadata?.retry_count || 0) > 0).length,
          dedup_events: recentEvents.filter(e => e.dedupe_status === 'deduplicated').length,
          avg_processing_time_sec: avgProcessingTime,
        },

        // Pipeline visualization
        pipeline_stages: pipelineStages,

        // Automation performance
        automation: {
          queued: jobsByStatus.pending,
          processing: jobsByStatus.processing,
          completed: jobsByStatus.completed,
          failed: jobsByStatus.failed,
          success_rate_percent: successRate,
        },

        // Event breakdown
        events_breakdown: eventBreakdown,

        // Lead flow
        lead_flow: {
          new_leads_24h: recentLeads.length,
          contacted: contactedLeads,
          replied: repliedLeads,
          booked: bookedLeads,
        },

        // Error tracking
        recent_errors: recentErrors,
        dead_letter_count: deadLetterCount,
        queued_items: queuedCount,

        // System status
        system_status: {
          healthy: jobsByStatus.failed === 0 && deadLetterCount < 10,
          health_score: Math.round(
            (successRate * 0.6 +
              Math.max(0, 100 - (failedEvents.length / Math.max(1, recentEvents.length) * 100)) * 0.4) / 1
          ),
        },

        // Optimization insights
        optimization_insights: {
          performance_summary: {
            avg_response_time_minutes: avgResponseTime,
            event_volume_24h: totalEventVolume,
            conversion_rate_percent: conversionRate,
            response_rate_percent: responseRate,
          },
          top_lead_sources: topLeadSources,
          top_automation_types: topJobTypes,
          top_failures: topFailures,
          most_engaged_leads: leadEngagement,
          least_engaged_leads: leastEngaged.map(l => ({
            id: l.id,
            name: l.full_name,
            email: l.email,
            created: l.created_date,
          })),
          high_intent_uncontacted: highIntentUncontacted.map(l => ({
            id: l.id,
            name: l.full_name,
            email: l.email,
            intent: l.ai_intent,
          })),
          event_distribution: {
            sms_percentage: smsPercentage,
            email_percentage: emailPercentage,
            webhook_percentage: totalEventVolume > 0 ? Math.round((eventBreakdown.webhook_sent / totalEventVolume) * 100) : 0,
          },
          daily_activity: dailyActivitySummary,
        },
      },
    });
  } catch (error) {
    console.error('[getSystemObservabilityMetrics]', error);
    return Response.json(
      { error: error.message || 'Failed to fetch observability metrics' },
      { status: 500 }
    );
  }
});