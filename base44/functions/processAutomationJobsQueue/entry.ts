import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTOMATION JOB PROCESSOR
 * Moves AutomationJob records through the pipeline:
 * queued → processing → completed/failed
 * Executes the actual SMS/email sends.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only or internal service role call
    if (!user || (user.role !== 'admin' && !isInternalServiceCall(req))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process up to 50 queued jobs
    const queuedJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: 'queued' },
      'created_at',
      50
    );

    const results = [];

    for (const job of queuedJobs || []) {
      try {
        // 1. Update to processing
        await base44.asServiceRole.entities.AutomationJob.update(job.id, {
          status: 'processing',
          processing_at: new Date().toISOString(),
        });

        // Derive channel safely (older queued jobs may not have it stored)
        const channel = job.channel || (job.job_type === 'instant_sms' ? 'sms' : 'email');

        // 1b. Update linked EventQueue record to 'processing'
        const linkedEQs = await base44.asServiceRole.entities.EventQueue.filter(
          { communication_event_id: job.id },
          '-created_date', 1
        ).catch(() => []);
        // Also try matching by metadata_json job_id
        const allEQs = linkedEQs?.length > 0 ? linkedEQs : await base44.asServiceRole.entities.EventQueue.filter(
          { status: 'queued', event_category: 'automation_event' },
          '-created_date', 20
        ).then(rows => (rows || []).filter(r => {
          try { return JSON.parse(r.metadata_json || '{}').job_id === job.id; } catch { return false; }
        })).catch(() => []);

        const eqToUpdate = allEQs?.[0];
        if (eqToUpdate) {
          await base44.asServiceRole.entities.EventQueue.update(eqToUpdate.id, {
            status: 'processing',
          }).catch(err => console.warn('[processAutomationJobsQueue] EventQueue processing update failed:', err.message));
        }

        // 2. Log runtime_attempt_started
        await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: job.lead_id,
          client_id: job.client_id,
          client_project_id: job.client_project_id,
          channel,
          direction: 'outbound',
          event_type: 'runtime_attempt_started',
          provider: channel === 'sms' ? 'twilio' : 'resend',
          status: 'pending',
          subject: `Executing ${job.job_type}`,
          message_body: job.context_json || '',
          environment: getEnvironment(),
        });

        // 3. Execute based on job type — only handle types this processor owns
        if (!['instant_sms', 'confirmation_email'].includes(job.job_type)) {
          // Skip legacy/other job types silently — they belong to other processors
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'queued', // leave in queue for other processors
          });
          results.push({ job_id: job.id, skipped: true, reason: `job_type_not_handled: ${job.job_type}` });
          continue;
        }

        let result;
        if (job.job_type === 'instant_sms') {
          result = await executeInstantSms(base44, job);
        } else if (job.job_type === 'confirmation_email') {
          result = await executeConfirmationEmail(base44, job);
        }

        // 4. Update job status
        const now = new Date().toISOString();
        if (result.success) {
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'completed',
            completed_at: now,
            provider_message_id: result.provider_message_id,
          });

          // Update EventQueue → completed
          if (eqToUpdate) {
            await base44.asServiceRole.entities.EventQueue.update(eqToUpdate.id, {
              status: 'completed',
              completed_at: now,
            }).catch(err => console.warn('[processAutomationJobsQueue] EventQueue completed update failed:', err.message));
          }

          // DashboardTruthCheck — provider success proof exists → safe_to_launch eligible
          await upsertDashboardTruth(base44, job, {
            truth_status: 'trusted',
            safe_to_launch: true,
            safe_to_show_admin: true,
            safe_to_show_client: true,
            blocker_count: 0,
            warning_count: 0,
            blockers: [],
            warnings: [],
            evidence_summary: `provider_send_succeeded for job ${job.id} (${job.job_type}). Provider message id: ${result.provider_message_id}. Delivery proof exists.`,
          });

          results.push({ job_id: job.id, success: true, type: job.job_type });
        } else {
          // Retry logic
          if (job.retry_count < (job.max_retries || 3)) {
            await base44.asServiceRole.entities.AutomationJob.update(job.id, {
              status: 'queued',
              retry_count: (job.retry_count || 0) + 1,
              last_error: result.error,
              last_attempt_at: now,
            });

            // EventQueue stays in processing — update retry metadata
            if (eqToUpdate) {
              await base44.asServiceRole.entities.EventQueue.update(eqToUpdate.id, {
                status: 'queued',
                retry_count: (job.retry_count || 0) + 1,
                last_retry_at: now,
                error_message: result.error,
              }).catch(() => {});
            }

            results.push({ job_id: job.id, success: false, retrying: true, error: result.error });
          } else {
            // Max retries exceeded
            await base44.asServiceRole.entities.AutomationJob.update(job.id, {
              status: 'failed',
              failed_at: now,
              final_error: result.error,
            });

            // Update EventQueue → dead_letter
            if (eqToUpdate) {
              await base44.asServiceRole.entities.EventQueue.update(eqToUpdate.id, {
                status: 'dead_letter',
                error_message: `Max retries exceeded: ${result.error}`,
              }).catch(() => {});
            }

            // Create DeadLetterLog — client_id is required; fall back to 'unknown'
            await base44.asServiceRole.entities.DeadLetterLog.create({
              event_queue_id: eqToUpdate?.id || job.id,
              communication_event_id: null,
              client_id: job.client_id || 'unknown',
              client_project_id: job.client_project_id,
              event_category: 'automation_event',
              processor_type: 'messaging_processor',
              failure_reason: `Max retries (${job.max_retries || 3}) exceeded`,
              final_error_message: result.error,
              retry_count: job.retry_count || 0,
              last_attempt_at: now,
              metadata_json: JSON.stringify(job),
              status: 'pending_review',
            });

            // DashboardTruthCheck — dead lettered, no proof
            await upsertDashboardTruth(base44, job, {
              truth_status: 'blocked',
              safe_to_launch: false,
              safe_to_show_admin: true,
              safe_to_show_client: false,
              blocker_count: 1,
              warning_count: 0,
              blockers: [{
                code: 'job_dead_lettered',
                severity: 'critical_blocker',
                message: `Job ${job.id} (${job.job_type}) dead-lettered after ${job.max_retries || 3} retries. Last error: ${result.error}`,
                entity_name: 'AutomationJob',
                record_id: job.id,
                fix_action: 'Check AdminSettings provider config (Twilio/Resend). Review DeadLetterLog.',
              }],
              warnings: [],
              evidence_summary: `Job ${job.id} (${job.job_type}) failed all retries. No provider_send_succeeded event. safe_to_launch=false.`,
            });

            results.push({ job_id: job.id, success: false, dead_lettered: true });
          }
        }
      } catch (jobError) {
        console.error(`[processAutomationJobsQueue] Job ${job.id} failed:`, jobError);
        results.push({ job_id: job.id, success: false, error: jobError.message });
      }
    }

    return Response.json({
      processed: results.length,
      results,
      summary: {
        completed: results.filter(r => r.success).length,
        retrying: results.filter(r => r.retrying).length,
        dead_lettered: results.filter(r => r.dead_lettered).length,
      },
    });
  } catch (error) {
    console.error('[processAutomationJobsQueue]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeInstantSms(base44, job) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    
    if (!settings?.twilio_enabled || !settings?.twilio_from_number) {
      return { success: false, error: 'Twilio not configured' };
    }

    // Invoke the actual SMS sending function
    const result = await base44.functions.invoke('executeInstantSms', {
      job_id: job.id,
      recipient_phone: job.recipient_phone,
      template_key: job.template_key,
      context: JSON.parse(job.context_json || '{}'),
    });

    return result.data?.success
      ? { success: true, provider_message_id: result.data?.message_id }
      : { success: false, error: result.data?.error || 'SMS send failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function executeConfirmationEmail(base44, job) {
  try {
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]);
    
    if (!settings?.resend_enabled || !settings?.resend_from_email) {
      return { success: false, error: 'Resend not configured' };
    }

    // Invoke the actual email sending function
    const result = await base44.functions.invoke('executeConfirmationEmail', {
      job_id: job.id,
      recipient_email: job.recipient_email,
      template_key: job.template_key,
      context: JSON.parse(job.context_json || '{}'),
    });

    return result.data?.success
      ? { success: true, provider_message_id: result.data?.message_id }
      : { success: false, error: result.data?.error || 'Email send failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function upsertDashboardTruth(base44, job, fields) {
  try {
    const env = getEnvironment();
    // Skip QA/smoke/internal records from production truth
    if (env !== 'production') return;

    const now = new Date().toISOString();
    const existing = await base44.asServiceRole.entities.DashboardTruthCheck.filter(
      { scope: 'admin_dashboard', client_id: job.client_id || 'platform' },
      '-created_date', 1
    ).catch(() => []);

    const payload = {
      scope: 'admin_dashboard',
      client_id: job.client_id || 'platform',
      client_project_id: job.client_project_id,
      environment: env,
      last_checked_at: now,
      updated_at: now,
      source_records: { job_id: job.id, job_type: job.job_type, lead_id: job.lead_id },
      ...fields,
    };

    if (existing?.[0]?.id) {
      await base44.asServiceRole.entities.DashboardTruthCheck.update(existing[0].id, payload);
    } else {
      await base44.asServiceRole.entities.DashboardTruthCheck.create({ ...payload, created_at: now });
    }
  } catch (err) {
    console.warn('[processAutomationJobsQueue] upsertDashboardTruth failed:', err.message);
  }
}

function getEnvironment() {
  try {
    const hostname = Deno.env.get('APP_URL') || '';
    if (hostname?.includes('smoke') || hostname?.includes('test')) return 'smoke';
    if (hostname?.includes('staging')) return 'qa';
  } catch {}
  return 'production';
}

function isInternalServiceCall(req) {
  // Check for internal service token or authorization header
  const auth = req.headers.get('authorization');
  return auth?.includes('Bearer') || req.headers.get('x-internal') === 'true';
}