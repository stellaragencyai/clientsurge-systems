import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STALL_THRESHOLDS = {
  instant_sms: 60 * 60 * 1000,
  confirmation_email: 3 * 60 * 60 * 1000,
  admin_notification: 2 * 60 * 60 * 1000,
  nurture_sequence: 6 * 60 * 60 * 1000,
  webhook_dispatch: 4 * 60 * 60 * 1000,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = Date.now();
    const alerts = [];

    // 1. Stalled queued automation jobs
    const stalledJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: 'queued' }, '-scheduled_for', 50
    );
    for (const job of stalledJobs) {
      const scheduledAt = job.scheduled_for
        ? new Date(job.scheduled_for).getTime()
        : new Date(job.created_date).getTime();
      const threshold = STALL_THRESHOLDS[job.job_type] || 4 * 60 * 60 * 1000;
      const age = now - scheduledAt;
      if (age > threshold) {
        const ageHours = Math.round((age / (60 * 60 * 1000)) * 10) / 10;
        alerts.push({
          id: `stalled_job_${job.id}`,
          type: 'stalled_automation',
          severity: age > threshold * 3 ? 'critical' : 'warning',
          title: `Stalled: ${job.job_type.replace(/_/g, ' ')}`,
          description: `Job queued ${ageHours}h ago has not processed. Lead flow may be interrupted.`,
          lead_id: job.lead_id || null,
          entity_id: job.id,
          entity_type: 'AutomationJob',
          fix_action: 'retry_job',
          fix_label: 'Retry Job',
          created_at: job.scheduled_for || job.created_date,
          metadata: { job_type: job.job_type, attempts: job.attempts || 0 },
        });
      }
    }

    // 2. Provider/webhook failures in last 6 hours
    const recentEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { status: 'failed' }, '-created_date', 100
    );
    const failuresByProvider = {};
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;
    for (const evt of recentEvents) {
      if (new Date(evt.created_date).getTime() < sixHoursAgo) continue;
      const key = evt.provider || 'unknown';
      if (!failuresByProvider[key]) failuresByProvider[key] = [];
      failuresByProvider[key].push(evt);
    }
    for (const [provider, failures] of Object.entries(failuresByProvider)) {
      const count = failures.length;
      const latest = failures[0];
      const errorMsg = (latest.error_message || 'No error details available').slice(0, 160);
      alerts.push({
        id: `webhook_error_${provider}`,
        type: 'webhook_error',
        severity: count >= 5 ? 'critical' : 'warning',
        title: `${count} ${provider} failure${count > 1 ? 's' : ''} (last 6h)`,
        description: `Latest: ${errorMsg}`,
        entity_id: latest.id,
        entity_type: 'CommunicationEvent',
        fix_action: 'check_integration',
        fix_label: 'Check Integration',
        created_at: latest.created_date,
        metadata: { provider, failure_count: count },
      });
    }

    // 3. New website leads with no initial response after 1 hour
    const newLeads = await base44.asServiceRole.entities.WebsiteLead.filter(
      { lead_status: 'new' }, '-created_date', 30
    );
    const oneHourAgo = now - 60 * 60 * 1000;
    const stalledLeads = newLeads.filter(l =>
      new Date(l.created_date).getTime() < oneHourAgo &&
      !l.initial_response_sent_at &&
      l.automation_enabled !== false
    );
    if (stalledLeads.length > 0) {
      alerts.push({
        id: 'stalled_new_leads',
        type: 'lead_flow_blocked',
        severity: stalledLeads.length >= 3 ? 'critical' : 'warning',
        title: `${stalledLeads.length} lead${stalledLeads.length > 1 ? 's' : ''} with no auto-response`,
        description: `New leads submitted 1+ hour ago haven't received an automated response. Check Twilio/Resend config.`,
        entity_id: stalledLeads[0]?.id,
        entity_type: 'WebsiteLead',
        fix_action: 'check_integration',
        fix_label: 'Check Integrations',
        created_at: stalledLeads[0]?.created_date,
        metadata: { count: stalledLeads.length },
      });
    }

    // 4. Recently failed jobs (error state, last 4 hours)
    const failedJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: 'failed' }, '-updated_date', 20
    );
    const fourHoursAgo = now - 4 * 60 * 60 * 1000;
    const recentlyFailed = failedJobs.filter(j =>
      new Date(j.updated_date || j.created_date).getTime() > fourHoursAgo
    );
    if (recentlyFailed.length > 0) {
      const types = [...new Set(recentlyFailed.map(j => j.job_type.replace(/_/g, ' ')))];
      alerts.push({
        id: 'failed_automation_jobs',
        type: 'stalled_automation',
        severity: recentlyFailed.length >= 3 ? 'critical' : 'warning',
        title: `${recentlyFailed.length} automation job${recentlyFailed.length > 1 ? 's' : ''} failed`,
        description: `Types: ${types.join(', ')}. Last error: ${(recentlyFailed[0]?.last_error || 'Unknown').slice(0, 100)}`,
        entity_id: recentlyFailed[0]?.id,
        entity_type: 'AutomationJob',
        fix_action: 'retry_all_failed',
        fix_label: 'Retry All Failed',
        created_at: recentlyFailed[0]?.updated_date,
        metadata: { failed_ids: recentlyFailed.map(j => j.id), count: recentlyFailed.length },
      });
    }

    alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return Response.json({
      alerts,
      total: alerts.length,
      critical_count: alerts.filter(a => a.severity === 'critical').length,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('getAutomationAlerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});