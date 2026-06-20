import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTOMATION EDGE CASE REPORT
 * Read-only admin endpoint — returns metrics on:
 * - Recent duplicate detections
 * - Blocked retries
 * - Skipped executions
 * - High retry count items
 * - Race condition incidents
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch data in parallel
    const [dedupLogs, automationJobs, idempotencyKeys, commEvents] = await Promise.all([
      base44.asServiceRole.entities.EventDedupLog
        ?.filter({}, '-created_date', 500)
        .catch(() => []),
      base44.asServiceRole.entities.AutomationJob
        ?.filter({}, '-created_date', 1000)
        .catch(() => []),
      base44.asServiceRole.entities.IdempotencyKey
        ?.filter({}, '-created_date', 500)
        .catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent
        ?.filter({}, '-created_date', 1000)
        .catch(() => []),
    ]);

    const safeDedup = dedupLogs || [];
    const safeJobs = automationJobs || [];
    const safeKeys = idempotencyKeys || [];
    const safeEvents = commEvents || [];

    // === DEDUP ANALYSIS ===
    const recentDedup24h = safeDedup.filter(d => d.created_date >= oneDayAgo);
    const skippedDedup = safeDedup.filter(d => d.outcome === 'skipped' || d.outcome === 'duplicate_blocked');
    const processedDedup = safeDedup.filter(d => d.outcome === 'processed');

    // === AUTOMATION JOB ANALYSIS ===
    const failedJobs = safeJobs.filter(j => j.status === 'failed');
    const highRetryJobs = safeJobs.filter(j => (j.retry_count || 0) >= 3);
    const blockedRetries = safeJobs.filter(j => j.status === 'retry_blocked');
    const completedJobs = safeJobs.filter(j => j.status === 'completed');
    const pendingJobs = safeJobs.filter(j => ['pending', 'queued', 'processing'].includes(j.status));

    // Job type distribution
    const jobTypeMap = {};
    safeJobs.forEach(j => {
      const t = j.automation_type || j.job_type || 'unknown';
      jobTypeMap[t] = (jobTypeMap[t] || 0) + 1;
    });
    const topJobTypes = Object.entries(jobTypeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // === IDEMPOTENCY ANALYSIS ===
    const duplicateIdempotencyKeys = safeKeys.filter(k => k.status === 'duplicate');
    const expiredKeys = safeKeys.filter(k => k.status === 'expired');
    const processedKeys = safeKeys.filter(k => k.status === 'processed');

    // === COMMUNICATION EVENT SAFETY FLAGS ===
    const flaggedEvents = safeEvents.filter(e => e.duplicate_detected || e.execution_skipped || e.retry_blocked);
    const duplicateDetectedEvents = safeEvents.filter(e => e.duplicate_detected);
    const skippedEvents = safeEvents.filter(e => e.execution_skipped);
    const retryBlockedEvents = safeEvents.filter(e => e.retry_blocked);

    // === FAILURE PATTERN ANALYSIS ===
    const failureReasons = {};
    failedJobs.forEach(j => {
      const reason = j.error_message || j.failure_reason || 'unknown';
      const shortReason = reason.substring(0, 80);
      failureReasons[shortReason] = (failureReasons[shortReason] || 0) + 1;
    });
    const topFailureReasons = Object.entries(failureReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    // === SYSTEM HEALTH SCORE ===
    const totalJobs = safeJobs.length || 1;
    const successRate = Math.round((completedJobs.length / totalJobs) * 100);
    const deduplicationEffectiveness = safeDedup.length > 0
      ? Math.round((skippedDedup.length / safeDedup.length) * 100)
      : 0;

    // === RECENT EDGE CASE INCIDENTS ===
    const recentIncidents = [
      ...highRetryJobs.slice(0, 3).map(j => ({
        type: 'high_retry',
        entity: 'AutomationJob',
        description: `Job ${j.id} retried ${j.retry_count} times`,
        severity: j.retry_count >= 5 ? 'critical' : 'high',
        timestamp: j.updated_date || j.created_date,
      })),
      ...skippedDedup.slice(0, 3).map(d => ({
        type: 'duplicate_blocked',
        entity: 'EventDedupLog',
        description: `Duplicate ${d.event_type} blocked for lead ${d.lead_id}`,
        severity: 'info',
        timestamp: d.created_date,
      })),
      ...failedJobs.slice(0, 3).map(j => ({
        type: 'job_failure',
        entity: 'AutomationJob',
        description: `${j.automation_type} failed — ${(j.error_message || '').substring(0, 60)}`,
        severity: 'high',
        timestamp: j.updated_date || j.created_date,
      })),
    ]
    .filter(i => i.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    return Response.json({
      timestamp: new Date().toISOString(),
      summary: {
        success_rate: successRate,
        deduplication_effectiveness_percent: deduplicationEffectiveness,
        total_jobs: safeJobs.length,
        pending_jobs: pendingJobs.length,
        failed_jobs: failedJobs.length,
        high_retry_count: highRetryJobs.length,
        total_dedup_events: safeDedup.length,
        blocked_duplicates: skippedDedup.length,
        flagged_communication_events: flaggedEvents.length,
      },
      dedup_analysis: {
        total: safeDedup.length,
        recent_24h: recentDedup24h.length,
        skipped: skippedDedup.length,
        processed: processedDedup.length,
      },
      job_analysis: {
        completed: completedJobs.length,
        failed: failedJobs.length,
        high_retry: highRetryJobs.length,
        blocked_retries: blockedRetries.length,
        top_job_types: topJobTypes,
        top_failure_reasons: topFailureReasons,
      },
      idempotency_analysis: {
        total_keys: safeKeys.length,
        duplicates_prevented: duplicateIdempotencyKeys.length,
        expired: expiredKeys.length,
        processed: processedKeys.length,
      },
      communication_event_flags: {
        duplicate_detected: duplicateDetectedEvents.length,
        execution_skipped: skippedEvents.length,
        retry_blocked: retryBlockedEvents.length,
        total_flagged: flaggedEvents.length,
      },
      recent_incidents: recentIncidents,
    });
  } catch (error) {
    console.error('[getAutomationEdgeCaseReport]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});