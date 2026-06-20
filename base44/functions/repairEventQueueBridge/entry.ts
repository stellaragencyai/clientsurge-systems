import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * REPAIR EVENT QUEUE BRIDGE — Idempotent Data Reconciliation
 *
 * For each AutomationJob, ensures a matching EventQueue record exists.
 * Creates internal CommunicationEvent if needed.
 * Updates DashboardTruthCheck with final metrics.
 *
 * Admin-only. Idempotent — safe to run multiple times.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized — admin only' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const stats = {
      jobs_processed: 0,
      event_queues_created: 0,
      event_queues_updated: 0,
      communication_events_created: 0,
      errors: [],
    };

    // ── FETCH ALL AUTOMATION JOBS ──────────────────────────────────────────────
    const jobs = await base44.asServiceRole.entities.AutomationJob.list('-created_date', 1000).catch((err) => {
      stats.errors.push(`Failed to fetch AutomationJob: ${err.message}`);
      return [];
    });

    if (!jobs || jobs.length === 0) {
      return Response.json({
        success: true,
        message: 'No AutomationJob records found.',
        stats,
      });
    }

    // ── PROCESS EACH JOB ──────────────────────────────────────────────────────
    for (const job of jobs) {
      try {
        stats.jobs_processed++;

        // Fall back to "system" when no client can be resolved — never skip
        const clientId = job.client_id || 'system';

        // Check if EventQueue already exists for this job (idempotent)
        const existingQueue = await base44.asServiceRole.entities.EventQueue.filter(
          { context_id: job.id, context_type: 'AutomationJob' },
          '-created_date',
          1
        ).catch(() => []);

        let commEventId = null;

        // If no EventQueue exists, create/link a CommunicationEvent first
        if (!existingQueue || existingQueue.length === 0) {
          // Check if a CommunicationEvent already exists for this job
          const existingCommEvent = await base44.asServiceRole.entities.CommunicationEvent.filter(
            { context_id: job.id, context_type: 'AutomationJob', event_type: 'workflow_triggered' },
            '-created_date',
            1
          ).catch(() => []);

          if (existingCommEvent && existingCommEvent.length > 0) {
            commEventId = existingCommEvent[0].id;
          } else {
            // Create internal CommunicationEvent
            const commEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
              lead_id: job.lead_id,
              order_id: job.order_id,
              context_type: 'AutomationJob',
              context_id: job.id,
              channel: 'internal',
              direction: 'system',
              event_type: 'workflow_triggered',
              provider: 'internal',
              status: 'processed',
              subject: `Automation Job: ${job.job_type}`,
              message_body: `Triggered: ${job.trigger_event || 'unknown'}`,
              metadata_json: JSON.stringify({
                job_id: job.id,
                job_type: job.job_type,
                trigger_event: job.trigger_event,
              }),
            }).catch((err) => {
              stats.errors.push(`Failed to create CommunicationEvent for job ${job.id}: ${err.message}`);
              return null;
            });

            if (commEvent) {
              commEventId = commEvent.id;
              stats.communication_events_created++;
            }
          }
        } else {
          // EventQueue exists — link to its CommunicationEvent if not already linked
          commEventId = existingQueue[0].communication_event_id;
        }

        // Create or update EventQueue record
        if (!existingQueue || existingQueue.length === 0) {
          const metadata = {
            job_id: job.id,
            job_type: job.job_type,
            trigger_event: job.trigger_event,
            result_metadata: (() => { try { return job.result_metadata ? JSON.parse(job.result_metadata) : {}; } catch { return {}; } })(),
          };

          const queueRecord = await base44.asServiceRole.entities.EventQueue.create({
            client_id: clientId,
            event_category: 'automation_event',
            processor_type: 'messaging_processor',
            context_type: 'AutomationJob',
            context_id: job.id,
            communication_event_id: commEventId,
            status: job.status,
            retry_count: job.attempts || 0,
            max_retries: 3,
            error_message: job.last_error,
            metadata_json: JSON.stringify(metadata),
          }).catch((err) => {
            stats.errors.push(`Failed to create EventQueue for job ${job.id}: ${err.message}`);
            return null;
          });

          if (queueRecord) {
            stats.event_queues_created++;
          }
        } else {
          // Update existing EventQueue with latest job status
          const metadata = {
            job_id: job.id,
            job_type: job.job_type,
            trigger_event: job.trigger_event,
            result_metadata: (() => { try { return job.result_metadata ? JSON.parse(job.result_metadata) : {}; } catch { return {}; } })(),
          };

          await base44.asServiceRole.entities.EventQueue.update(existingQueue[0].id, {
            status: job.status,
            retry_count: job.attempts || 0,
            error_message: job.last_error,
            metadata_json: JSON.stringify(metadata),
          }).catch((err) => {
            stats.errors.push(`Failed to update EventQueue for job ${job.id}: ${err.message}`);
          });

          stats.event_queues_updated++;
        }
      } catch (err) {
        stats.errors.push(`Error processing job ${job.id}: ${err.message}`);
      }
    }

    // ── UPDATE DASHBOARD TRUTH CHECK ───────────────────────────────────────────
    const allEventQueues = await base44.asServiceRole.entities.EventQueue.list('-created_date', 2000).catch(() => []);
    const allCommEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { event_type: 'provider_send_succeeded' },
      '-created_date',
      2000
    ).catch(() => []);

    const queueStats = {
      total_automation_jobs: stats.jobs_processed,
      total_event_queues: allEventQueues.length,
      processing_job_count: allEventQueues.filter((q) => q.status === 'pending' || q.status === 'processing').length,
      failed_job_count: allEventQueues.filter((q) => q.status === 'failed').length,
      completed_job_count: allEventQueues.filter((q) => q.status === 'completed').length,
      provider_send_succeeded: allCommEvents.length,
      safe_to_launch: allCommEvents.length > 0,
    };

    // Update all relevant DashboardTruthCheck records
    // scope enum values: 'admin_dashboard' | 'mission_control' | 'customer_dashboard'
    const dashboardNames = ['admin_dashboard', 'mission_control', 'customer_dashboard'];

    const evidenceSummary = `EventQueue bridge repair ${now}: ${queueStats.total_automation_jobs} jobs → ${stats.event_queues_created} queues created, ${stats.event_queues_updated} updated, ${stats.communication_events_created} comm events created. Total EventQueues: ${queueStats.total_event_queues}. Failed: ${queueStats.failed_job_count}. Provider succeeded: ${queueStats.provider_send_succeeded}.`;

    for (const scope of dashboardNames) {
      const existingCheck = await base44.asServiceRole.entities.DashboardTruthCheck.filter(
        { scope },
        '-created_date',
        1
      ).catch(() => []);

      if (existingCheck && existingCheck.length > 0) {
        await base44.asServiceRole.entities.DashboardTruthCheck.update(
          existingCheck[0].id,
          {
            safe_to_launch: queueStats.safe_to_launch,
            evidence_summary: evidenceSummary,
            last_checked_at: now,
          }
        ).catch((err) => {
          stats.errors.push(`Failed to update DashboardTruthCheck for ${scope}: ${err.message}`);
        });
      } else {
        await base44.asServiceRole.entities.DashboardTruthCheck.create({
          scope,
          truth_status: 'warning',
          safe_to_launch: queueStats.safe_to_launch,
          evidence_summary: evidenceSummary,
          last_checked_at: now,
        }).catch((err) => {
          stats.errors.push(`Failed to create DashboardTruthCheck for ${scope}: ${err.message}`);
        });
      }
    }

    return Response.json({
      success: true,
      message: 'EventQueue bridge repair completed.',
      stats: {
        ...stats,
        ...queueStats,
      },
    });
  } catch (error) {
    console.error('[repairEventQueueBridge]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});