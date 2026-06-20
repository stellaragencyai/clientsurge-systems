import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * DEPLOYMENT HARDENING METRICS
 * Production-grade health snapshot focusing on:
 * - Queue throughput and backlog
 * - Automation fail-safe status
 * - Rate limit indicators
 * - Error recovery visibility
 * - System readiness signals
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    // Parallel data fetch — scoped and paginated, no full-table scans
    const [
      recentEvents,
      failedEvents,
      recentJobs,
      failedJobs,
      highRetryJobs,
      queuedItems,
      recentLeads,
    ] = await Promise.all([
      base44.asServiceRole.entities.CommunicationEvent.filter({}, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.filter({ status: 'failed' }, '-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.AutomationJob.filter({}, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.AutomationJob.filter({ status: 'failed' }, '-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.AutomationJob.filter({}, '-created_date', 200).catch(() => []),
      base44.asServiceRole.entities.EventQueue.filter({}, '-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.Leads.filter({}, '-created_date', 100).catch(() => []),
    ]);

    const safe = (arr) => arr || [];

    // === QUEUE HEALTH ===
    const queuePending = safe(queuedItems).filter(q => q.status === 'pending' || q.status === 'queued');
    const queueProcessing = safe(queuedItems).filter(q => q.status === 'processing');
    const queueFailed = safe(queuedItems).filter(q => q.status === 'failed');
    const queueBacklogSize = queuePending.length + queueProcessing.length;
    const queueHealthStatus = queueBacklogSize < 20 ? 'healthy' : queueBacklogSize < 100 ? 'degraded' : 'critical';

    // === AUTOMATION HEALTH ===
    const totalJobs = safe(recentJobs).length || 1;
    const completedJobs = safe(recentJobs).filter(j => j.status === 'completed').length;
    const failedJobsCount = safe(failedJobs).length;
    const highRetryCount = safe(highRetryJobs).filter(j => (j.retry_count || 0) >= 3).length;
    const automationSuccessRate = Math.round((completedJobs / totalJobs) * 100);
    const automationHealthStatus = automationSuccessRate >= 90 ? 'healthy' : automationSuccessRate >= 70 ? 'degraded' : 'critical';

    // === MESSAGING HEALTH ===
    const totalEvents = safe(recentEvents).length || 1;
    const failedEventsCount = safe(failedEvents).length;
    const eventFailureRate = Math.round((failedEventsCount / totalEvents) * 100);
    const smsFailed = safe(failedEvents).filter(e => e.channel === 'sms').length;
    const emailFailed = safe(failedEvents).filter(e => e.channel === 'email').length;
    const messagingHealthStatus = eventFailureRate < 5 ? 'healthy' : eventFailureRate < 15 ? 'degraded' : 'critical';

    // === LEAD INGESTION ===
    const recentLeadCount = safe(recentLeads).filter(l => l.created_date && l.created_date >= twentyFourHoursAgo).length;
    const leadIngestionStatus = recentLeadCount > 0 ? 'healthy' : 'degraded';

    // === PRODUCTION SAFETY SIGNALS ===
    const criticalSignals = [];
    const warnings = [];

    if (queueHealthStatus === 'critical') {
      criticalSignals.push({ signal: 'queue_overload', message: `Queue backlog is ${queueBacklogSize} items — exceeds safe threshold`, severity: 'critical' });
    } else if (queueHealthStatus === 'degraded') {
      warnings.push({ signal: 'queue_elevated', message: `Queue backlog elevated: ${queueBacklogSize} items`, severity: 'warning' });
    }

    if (automationHealthStatus === 'critical') {
      criticalSignals.push({ signal: 'automation_critical', message: `Automation success rate is ${automationSuccessRate}% — critical threshold breached`, severity: 'critical' });
    } else if (automationHealthStatus === 'degraded') {
      warnings.push({ signal: 'automation_degraded', message: `Automation success rate degraded: ${automationSuccessRate}%`, severity: 'warning' });
    }

    if (messagingHealthStatus === 'critical') {
      criticalSignals.push({ signal: 'messaging_critical', message: `Messaging failure rate is ${eventFailureRate}% — delivery health critical`, severity: 'critical' });
    } else if (messagingHealthStatus === 'degraded') {
      warnings.push({ signal: 'messaging_degraded', message: `Messaging failure rate elevated: ${eventFailureRate}%`, severity: 'warning' });
    }

    if (highRetryCount > 10) {
      warnings.push({ signal: 'high_retry_volume', message: `${highRetryCount} jobs retried 3+ times — investigate failure patterns`, severity: 'warning' });
    }

    if (failedJobsCount > 20) {
      warnings.push({ signal: 'failed_job_accumulation', message: `${failedJobsCount} failed jobs in queue — manual review recommended`, severity: 'warning' });
    }

    // === OVERALL SYSTEM STATUS ===
    const overallStatus = criticalSignals.length > 0 ? 'critical' : warnings.length > 0 ? 'degraded' : 'healthy';

    // === RATE LIMIT INDICATORS ===
    const smsLast24h = safe(recentEvents).filter(e => e.channel === 'sms' && e.created_date >= twentyFourHoursAgo).length;
    const emailLast24h = safe(recentEvents).filter(e => e.channel === 'email' && e.created_date >= twentyFourHoursAgo).length;
    const smsLastHour = safe(recentEvents).filter(e => e.channel === 'sms' && e.created_date >= oneHourAgo).length;

    // Twilio: ~1000/day recommended safe limit, Resend: 100/hour recommended safe
    const smsRateLimitWarning = smsLast24h > 800 || smsLastHour > 60;
    const emailRateLimitWarning = emailLast24h > 500;

    // === FAIL-SAFE INDICATORS ===
    const idempotencyViolations = safe(recentJobs).filter(j => j.duplicate_of_job_id).length;
    const cascadeRisk = failedJobsCount > 15 && highRetryCount > 5;

    // === TOP FAILURE REASONS (structured) ===
    const failureReasonMap = {};
    safe(failedJobs).forEach(j => {
      const reason = (j.error_message || j.failure_reason || 'unknown').substring(0, 100);
      failureReasonMap[reason] = (failureReasonMap[reason] || 0) + 1;
    });
    const topFailureReasons = Object.entries(failureReasonMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));

    return Response.json({
      generated_at: new Date().toISOString(),
      overall_status: overallStatus,
      is_production_safe: overallStatus !== 'critical',
      is_degraded_mode: overallStatus === 'degraded',

      queue_health: {
        status: queueHealthStatus,
        backlog_size: queueBacklogSize,
        pending: queuePending.length,
        processing: queueProcessing.length,
        failed: queueFailed.length,
        backpressure_active: queueBacklogSize > 50,
      },

      automation_health: {
        status: automationHealthStatus,
        success_rate: automationSuccessRate,
        completed: completedJobs,
        failed: failedJobsCount,
        high_retry_count: highRetryCount,
        idempotency_violations: idempotencyViolations,
        cascade_risk: cascadeRisk,
      },

      messaging_health: {
        status: messagingHealthStatus,
        failure_rate_percent: eventFailureRate,
        sms_failed_24h: smsFailed,
        email_failed_24h: emailFailed,
        sms_sent_24h: smsLast24h,
        email_sent_24h: emailLast24h,
        sms_rate_limit_warning: smsRateLimitWarning,
        email_rate_limit_warning: emailRateLimitWarning,
      },

      lead_ingestion: {
        status: leadIngestionStatus,
        new_leads_24h: recentLeadCount,
      },

      critical_signals: criticalSignals,
      warnings,
      top_failure_reasons: topFailureReasons,

      summary_kpis: {
        total_events_24h: safe(recentEvents).filter(e => e.created_date >= twentyFourHoursAgo).length,
        total_jobs_24h: safe(recentJobs).filter(j => j.created_date >= twentyFourHoursAgo).length,
        overall_success_rate: automationSuccessRate,
        queue_backlog: queueBacklogSize,
      },
    });
  } catch (error) {
    console.error('[getDeploymentHardeningMetrics]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});