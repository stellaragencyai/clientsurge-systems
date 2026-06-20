/**
 * Get failure metrics for admin monitoring
 * 
 * Returns:
 * - Failed jobs (with retry count)
 * - Recently retried jobs
 * - Dead letter queue status
 * - Failed communication events
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch failed and retried jobs
    const [failedJobs, retriedJobs, deadLetters, failedEvents] = await Promise.all([
      base44.asServiceRole.entities.AutomationJob.filter({ status: 'failed' }, '-updated_date', 20).catch(() => []),
      base44.asServiceRole.entities.AutomationJob.filter({ retry_count: { $gt: 0 }, status: 'in_progress' }, '-last_retry_at', 20).catch(() => []),
      base44.asServiceRole.entities.DeadLetterLog.filter({ status: 'pending_review' }, '-moved_at', 50).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.filter({ status: 'failed' }, '-updated_date', 50).catch(() => []),
    ]);

    // Compute metrics
    const totalFailed = failedJobs.length;
    const totalRetried = retriedJobs.length;
    const totalDeadLetter = deadLetters.length;
    const totalFailedEvents = failedEvents.length;

    // Group failed events by channel
    const failedByChannel = {};
    (failedEvents || []).forEach(event => {
      const ch = event.channel || 'unknown';
      failedByChannel[ch] = (failedByChannel[ch] || 0) + 1;
    });

    return Response.json({
      summary: {
        failed_jobs: totalFailed,
        retried_jobs: totalRetried,
        dead_letter_count: totalDeadLetter,
        failed_communication_events: totalFailedEvents,
      },
      failed_jobs: failedJobs,
      recently_retried: retriedJobs,
      dead_letter_queue: deadLetters,
      failed_events_by_channel: failedByChannel,
      health_status: totalFailed === 0 && totalDeadLetter < 10 ? 'healthy' : 'degraded',
    });
  } catch (error) {
    console.error('[getFailureMetrics]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});