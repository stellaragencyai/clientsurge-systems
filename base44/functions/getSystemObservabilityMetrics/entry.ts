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