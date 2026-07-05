import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const svc = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();

    // Parallel fetches — all read-only, no external providers touched
    const [
      rateLimitConfigs,
      idempotencyKeys,
      leadNextBestActions,
      pendingDeadLetters,
      failedJobs,
      queuedJobs,
      websiteLeads,
    ] = await Promise.all([
      svc.entities.RateLimitConfig.list('', 500).catch(() => []),
      svc.entities.IdempotencyKey.list('', 500).catch(() => []),
      svc.entities.LeadNextBestAction.list('', 500).catch(() => []),
      svc.entities.DeadLetterLog.filter({ status: 'pending_review' }, '-created_date', 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: 'failed' }, '-created_date', 500).catch(() => []),
      svc.entities.AutomationJob.filter({ status: 'queued' }, '-created_date', 500).catch(() => []),
      svc.entities.WebsiteLead.list('', 500).catch(() => []),
    ]);

    // Stale jobs: queued but scheduled_for is in the past, OR queued with no
    // scheduled_for and created_date older than 1 hour
    const oneHourAgo = now.getTime() - 60 * 60 * 1000;
    const staleJobs = (queuedJobs || []).filter((job) => {
      if (job.scheduled_for) {
        return new Date(job.scheduled_for).getTime() < now.getTime();
      }
      if (job.created_date) {
        return new Date(job.created_date).getTime() < oneHourAgo;
      }
      return false;
    });

    // WebsiteLead field-gap counts
    const wl = websiteLeads || [];
    const missingClientId = wl.filter((l) => !l.client_id);
    const missingClientProjectId = wl.filter((l) => !l.client_project_id);
    const missingDedupKey = wl.filter((l) => !l.dedup_key);
    const missingCrmLeadId = wl.filter((l) => !l.crm_lead_id);

    const counts = {
      rate_limit_config: (rateLimitConfigs || []).length,
      idempotency_key: (idempotencyKeys || []).length,
      lead_next_best_action: (leadNextBestActions || []).length,
      pending_dead_letter: (pendingDeadLetters || []).length,
      failed_automation_job: (failedJobs || []).length,
      stale_automation_job: staleJobs.length,
      website_lead_total: wl.length,
      website_lead_missing_client_id: missingClientId.length,
      website_lead_missing_client_project_id: missingClientProjectId.length,
      website_lead_missing_dedup_key: missingDedupKey.length,
      website_lead_missing_crm_lead_id: missingCrmLeadId.length,
    };

    // Determine status
    const criticalBlockers = [];
    if (counts.rate_limit_config === 0) criticalBlockers.push('No RateLimitConfig records — rate-limit guardrails missing');
    if (counts.idempotency_key === 0) criticalBlockers.push('No IdempotencyKey records — dedup guardrails missing');
    if (counts.pending_dead_letter > 0) criticalBlockers.push(`${counts.pending_dead_letter} pending DeadLetterLog record(s) awaiting review`);
    if (counts.failed_automation_job > 0) criticalBlockers.push(`${counts.failed_automation_job} failed AutomationJob record(s)`);
    if (counts.stale_automation_job > 0) criticalBlockers.push(`${counts.stale_automation_job} stale AutomationJob record(s)`);

    let status;
    if (criticalBlockers.length > 0) {
      status = 'BLOCKED';
    } else {
      const hasGaps =
        counts.website_lead_missing_client_id > 0 ||
        counts.website_lead_missing_dedup_key > 0 ||
        counts.website_lead_missing_crm_lead_id > 0 ||
        counts.lead_next_best_action === 0;
      status = hasGaps ? 'PARTIAL' : 'READY_FOR_LIVE_PROOF';
    }

    return Response.json({
      status,
      critical_blockers: criticalBlockers,
      counts,
      checked_at: nowIso,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});