import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * RUN ADMIN RECONCILIATION — Admin-Only Observability Alignment Tool
 *
 * Scans AutomationJob records and ensures:
 *   1. Every job has a matching EventQueue record (creates if missing)
 *   2. DashboardTruthCheck records reflect real pipeline state
 *
 * Does NOT send SMS, email, or trigger any external provider.
 * Strictly data alignment and visibility. Safe to run multiple times (idempotent).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const results = {
      jobsScanned: 0,
      eventQueuesCreated: 0,
      eventQueuesAlreadyExisted: 0,
      dashboardTruthChecksUpserted: 0,
      errors: [],
    };

    // ── PHASE 1: Scan AutomationJob records ───────────────────────────────────
    const jobs = await base44.asServiceRole.entities.AutomationJob.list('-created_date', 500)
      .catch(() => []);
    results.jobsScanned = (jobs || []).length;

    if (!jobs || jobs.length === 0) {
      return Response.json({
        success: true,
        message: 'No AutomationJob records found. Nothing to reconcile.',
        results,
      });
    }

    // Build a lookup of existing EventQueue records by job_id stored in metadata_json
    // to avoid N+1 filter calls — fetch all automation_event EventQueues at once
    const existingEQs = await base44.asServiceRole.entities.EventQueue.filter(
      { event_category: 'automation_event' },
      '-created_date',
      1000
    ).catch(() => []);

    // Build a Set of job_ids that already have an EventQueue
    const coveredJobIds = new Set();
    for (const eq of existingEQs || []) {
      try {
        const meta = JSON.parse(eq.metadata_json || '{}');
        if (meta.job_id) coveredJobIds.add(meta.job_id);
      } catch {
        // malformed metadata — skip
      }
    }

    // ── PHASE 2: Ensure EventQueue exists for each job ────────────────────────
    for (const job of jobs) {
      if (!job.id) continue;

      if (coveredJobIds.has(job.id)) {
        results.eventQueuesAlreadyExisted++;
        continue;
      }

      // Map job status → EventQueue status
      const eqStatus = job.status === 'completed'
        ? 'completed'
        : job.status === 'failed'
          ? 'dead_letter'
          : job.status === 'processing'
            ? 'processing'
            : 'queued';

      const created = await base44.asServiceRole.entities.EventQueue.create({
        event_category: 'automation_event',
        processor_type: 'messaging_processor',
        client_id: job.client_id || null,
        client_project_id: job.client_project_id || null,
        status: eqStatus,
        retry_count: job.retry_count || 0,
        max_retries: job.max_retries || 3,
        priority: 1,
        error_message: job.final_error || job.last_error || null,
        metadata_json: JSON.stringify({
          job_id: job.id,
          job_type: job.job_type,
          lead_id: job.lead_id,
          channel: job.channel,
          source: 'admin_reconciliation',
          reconciled_at: now,
        }),
      }).catch((err) => {
        results.errors.push(`EventQueue create failed for job ${job.id}: ${err.message}`);
        return null;
      });

      if (created) {
        results.eventQueuesCreated++;
        coveredJobIds.add(job.id); // prevent duplicate if job appears twice
      }
    }

    // ── PHASE 3: Build DashboardTruthCheck records ────────────────────────────
    // Count job states
    const jobCounts = { queued: 0, processing: 0, completed: 0, failed: 0, other: 0 };
    for (const job of jobs) {
      const s = job.status;
      if (s === 'queued') jobCounts.queued++;
      else if (s === 'processing') jobCounts.processing++;
      else if (s === 'completed') jobCounts.completed++;
      else if (s === 'failed') jobCounts.failed++;
      else jobCounts.other++;
    }

    // Check for provider_send_succeeded events as success proof
    const successEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { event_type: 'provider_send_succeeded' },
      '-created_date',
      100
    ).catch(() => []);
    const hasSuccessProof = (successEvents || []).length > 0;

    // Determine truth status
    let truthStatus = 'trusted';
    const blockers = [];
    const warnings = [];

    if (jobCounts.failed > 0) {
      truthStatus = 'blocked';
      blockers.push({
        code: 'failed_jobs_exist',
        severity: 'launch_blocker',
        message: `${jobCounts.failed} AutomationJob record(s) have status=failed. Review DeadLetterLog for details.`,
        entity_name: 'AutomationJob',
        fix_action: 'Investigate failed jobs and create DeadLetterLog entries via runPipelineProofAudit.',
      });
    } else if (!hasSuccessProof && jobCounts.completed > 0) {
      truthStatus = 'warning';
      warnings.push({
        code: 'no_success_proof_events',
        severity: 'advisory',
        message: `${jobCounts.completed} completed job(s) exist but no provider_send_succeeded CommunicationEvent found. Proof may be missing.`,
        entity_name: 'CommunicationEvent',
        fix_action: 'Run runPipelineProofAudit to backfill proof records.',
      });
    } else if (jobCounts.completed === 0 && results.jobsScanned > 0) {
      truthStatus = 'warning';
      warnings.push({
        code: 'no_completed_jobs',
        severity: 'advisory',
        message: 'No completed AutomationJob records found. Pipeline may not have executed yet.',
        entity_name: 'AutomationJob',
        fix_action: 'Check processAutomationJobsQueue and verify jobs are being dispatched.',
      });
    }

    const evidenceSummary = [
      `Admin Reconciliation (${now}).`,
      `Jobs scanned: ${results.jobsScanned} (queued=${jobCounts.queued}, processing=${jobCounts.processing}, completed=${jobCounts.completed}, failed=${jobCounts.failed}).`,
      `EventQueues: ${results.eventQueuesCreated} created, ${results.eventQueuesAlreadyExisted} already existed.`,
      `Success proof events: ${(successEvents || []).length}.`,
      `Truth status: ${truthStatus}.`,
    ].join(' ');

    // Upsert DashboardTruthCheck for admin_dashboard scope
    const truthPayload = {
      scope: 'admin_dashboard',
      client_id: 'platform',
      environment: 'production',
      truth_status: truthStatus,
      safe_to_show_admin: true,
      safe_to_show_client: false,
      safe_to_launch: truthStatus === 'trusted',
      blocker_count: blockers.length,
      warning_count: warnings.length,
      blockers,
      warnings,
      evidence_summary: evidenceSummary,
      source_records: {
        job_counts: jobCounts,
        event_queues_created: results.eventQueuesCreated,
        event_queues_existing: results.eventQueuesAlreadyExisted,
        success_proof_events: (successEvents || []).length,
      },
      last_checked_at: now,
      updated_at: now,
    };

    const existingTruth = await base44.asServiceRole.entities.DashboardTruthCheck.filter(
      { scope: 'admin_dashboard', client_id: 'platform' },
      '-created_date',
      1
    ).catch(() => []);

    if (existingTruth?.[0]?.id) {
      await base44.asServiceRole.entities.DashboardTruthCheck.update(
        existingTruth[0].id,
        truthPayload
      ).catch((err) => results.errors.push(`DashboardTruthCheck update failed: ${err.message}`));
    } else {
      await base44.asServiceRole.entities.DashboardTruthCheck.create({
        ...truthPayload,
        created_at: now,
      }).catch((err) => results.errors.push(`DashboardTruthCheck create failed: ${err.message}`));
    }
    results.dashboardTruthChecksUpserted++;

    return Response.json({
      success: true,
      reconciled_at: now,
      truth_status: truthStatus,
      evidence_summary: evidenceSummary,
      results,
    });
  } catch (error) {
    console.error('[runAdminReconciliation]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});