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

    // ── Idempotency breakdown ──
    const allKeys = idempotencyKeys || [];
    const idemCompleted = allKeys.filter((k) => k.status === 'completed').length;
    const idemProcessing = allKeys.filter((k) => k.status === 'processing').length;
    const idemFailed = allKeys.filter((k) => k.status === 'failed').length;
    const idemSkipped = allKeys.filter((k) => k.status === 'skipped').length;
    const idemPending = allKeys.filter((k) => k.status === 'pending').length;

    // Detect simulation proof — keys with simulation_only in metadata_json
    const simulationKeys = allKeys.filter((k) => {
      try {
        const meta = k.metadata_json || '';
        return meta.includes('simulation_only');
      } catch {
        return false;
      }
    });
    const hasSimulationProof = simulationKeys.length > 0;

    // Latest idempotency key timestamp
    let latestKeyTimestamp = null;
    if (allKeys.length > 0) {
      const sorted = [...allKeys].sort((a, b) => {
        const aTime = a.last_executed_at ? new Date(a.last_executed_at).getTime() : 0;
        const bTime = b.last_executed_at ? new Date(b.last_executed_at).getTime() : 0;
        return bTime - aTime;
      });
      latestKeyTimestamp = sorted[0]?.last_executed_at || sorted[0]?.first_executed_at || null;
    }

    // WebsiteLead field-gap counts
    const wl = websiteLeads || [];
    const missingClientId = wl.filter((l) => !l.client_id);
    const missingClientProjectId = wl.filter((l) => !l.client_project_id);
    const missingDedupKey = wl.filter((l) => !l.dedup_key);
    const missingCrmLeadId = wl.filter((l) => !l.crm_lead_id);

    const counts = {
      rate_limit_config: (rateLimitConfigs || []).length,
      idempotency_key: allKeys.length,
      idempotency_completed: idemCompleted,
      idempotency_processing: idemProcessing,
      idempotency_failed: idemFailed,
      idempotency_skipped: idemSkipped,
      idempotency_pending: idemPending,
      idempotency_simulation_keys: simulationKeys.length,
      idempotency_simulation_proof: hasSimulationProof,
      idempotency_latest_timestamp: latestKeyTimestamp,
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

    // ── Determine status with updated logic ──
    // If RateLimitConfig > 0 AND idempotency simulation proof exists,
    // the "no idempotency keys" and "no rate limit" blockers are resolved.
    const guardrailReady = counts.rate_limit_config > 0 && hasSimulationProof;

    // Check for latest FailureRecoveryResult to see if failures were annotated/resolved
    const failureRecoveryResults = await svc.entities.FailureRecoveryResult.list('-run_at', 3).catch(() => []);
    const latestFailureRecovery = (failureRecoveryResults || [])[0] || null;
    const failureRecoveryApplied = latestFailureRecovery?.mode === 'applied';
    const failureRecoverySafe = latestFailureRecovery?.safe_to_continue_to_next_phase === true;

    const criticalBlockers = [];
    if (counts.rate_limit_config === 0) criticalBlockers.push('No RateLimitConfig records — rate-limit guardrails missing');
    if (counts.idempotency_key === 0) criticalBlockers.push('No IdempotencyKey records — dedup guardrails missing');

    // If failure recovery has been applied and safe, don't count dead letters/jobs as blockers
    const failuresResolved = failureRecoveryApplied && failureRecoverySafe;

    if (counts.pending_dead_letter > 0 && !failuresResolved) {
      criticalBlockers.push(`${counts.pending_dead_letter} pending DeadLetterLog record(s) awaiting review`);
    }
    if (counts.failed_automation_job > 0 && !failuresResolved) {
      criticalBlockers.push(`${counts.failed_automation_job} failed AutomationJob record(s)`);
    }
    if (counts.stale_automation_job > 0 && !failuresResolved) {
      criticalBlockers.push(`${counts.stale_automation_job} stale AutomationJob record(s)`);
    }

    let status;
    if (criticalBlockers.length > 0) {
      if (guardrailReady) {
        // Guardrails in place — upgrade from BLOCKED to PARTIAL.
        // Still must NOT show READY_FOR_LIVE_PROOF while hard blockers
        // (dead letters, failed jobs, stale jobs) or data gaps remain.
        status = 'PARTIAL';
      } else {
        status = 'BLOCKED';
      }
    } else {
      const hasGaps =
        counts.website_lead_missing_client_id > 0 ||
        counts.website_lead_missing_dedup_key > 0 ||
        counts.website_lead_missing_crm_lead_id > 0 ||
        counts.lead_next_best_action === 0;
      // Even if gaps are resolved, READY_FOR_LIVE_PROOF requires:
      // 1. LeadNextBestAction records exist
      // 2. Failure recovery applied and safe
      // 3. No data gaps
      if (hasGaps) {
        status = 'PARTIAL';
      } else if (!failuresResolved) {
        status = 'PARTIAL';
      } else {
        status = 'READY_FOR_LIVE_PROOF';
      }
    }

    // ── Remediation checklist with dynamic text ──
    let remediation_next_step;
    if (!hasSimulationProof) {
      remediation_next_step = 'Run idempotency simulation to prove duplicate suppression before live sends';
    } else if (counts.pending_dead_letter > 0 || counts.failed_automation_job > 0 || counts.stale_automation_job > 0) {
      if (!failureRecoveryApplied) {
        remediation_next_step = 'Run simulateFailureRecoveryPlan → applyFailureRecoverySafe to annotate/resolve failed/stale jobs and dead letters';
      } else if (!failureRecoverySafe) {
        remediation_next_step = 'Failure recovery applied but blockers remain — review manual_review_required records and repair data';
      } else {
        remediation_next_step = 'Failures resolved — next: generate LeadNextBestAction records, then run full non-sending inbound follow-up simulation';
      }
    } else if (counts.lead_next_best_action === 0) {
      remediation_next_step = 'Generate LeadNextBestAction records for all production leads';
    } else if (
      counts.website_lead_missing_client_id > 0 ||
      counts.website_lead_missing_dedup_key > 0 ||
      counts.website_lead_missing_crm_lead_id > 0
    ) {
      remediation_next_step = 'Run lead routing + CRM linkage backfill simulation → apply to close data gaps';
    } else {
      remediation_next_step = 'Run full non-sending inbound follow-up simulation, then controlled live-safe provider proof';
    }

    const live_proof_blocked_reason = 'Live provider proof remains blocked until: (1) failed/stale jobs and dead letters are resolved, (2) LeadNextBestAction records exist, (3) non-sending inbound follow-up simulation passes';

    return Response.json({
      status,
      critical_blockers: criticalBlockers,
      counts,
      guardrail_ready: guardrailReady,
      remediation_next_step,
      live_proof_blocked_reason,
      checked_at: nowIso,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});