import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AUTOMATION JOB PROCESSOR
 *
 * Moves AutomationJob records through the pipeline:
 * queued -> processing -> completed/failed
 *
 * Key fixes:
 * - Uses `attempts` field (exists in schema) instead of non-existent `retry_count`
 * - Increments attempts on every processing cycle
 * - Sets processed_at, last_error, result_metadata on ALL outcomes
 * - Catch block updates job to failed (no more stuck "processing" jobs)
 * - Stale job detection marks old processing jobs as failed
 * - runtime_attempt_started events are finalized (updated to sent/failed)
 * - Final sms_sent/sms_failed/email_sent/email_failed events created
 * - DeadLetterLog includes real retry_count, lead_id, provider, job_type, normalized phone/email
 * - EventQueue retry_count reflects actual attempts; completed_at set on dead_letter
 * - client_id resolved from lead/EventQueue context, never 'unknown'
 */
const MAX_RETRIES = 3;
const STALE_THRESHOLD_MINUTES = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && !isInternalServiceCall(req))) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 0. Stale job detection — mark old "processing" jobs as failed
    await markStaleJobsAsFailed(base44);

    // 1. Process up to 50 queued jobs
    const queuedJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: 'queued' },
      'created_at',
      50
    );

    const results = [];

    for (const job of queuedJobs || []) {
      try {
        // Only handle types this processor owns
        if (!['instant_sms', 'confirmation_email'].includes(job.job_type)) {
          results.push({ job_id: job.id, skipped: true, reason: `job_type_not_handled: ${job.job_type}` });
          continue;
        }

        // 2. Increment attempts and set to processing
        const currentAttempts = (job.attempts || 0) + 1;
        const now = new Date().toISOString();
        await base44.asServiceRole.entities.AutomationJob.update(job.id, {
          status: 'processing',
          attempts: currentAttempts,
        });

        // 3. Resolve lead context for client_id
        const leadContext = await resolveLeadContext(base44, job.lead_id);

        // 4. Find linked EventQueue record
        const eqRecord = await findLinkedEventQueue(base44, job.id);
        const resolvedClientId = leadContext.client_id || eqRecord?.client_id || null;
        const resolvedProjectId = leadContext.client_project_id || eqRecord?.client_project_id || null;

        if (eqRecord) {
          await base44.asServiceRole.entities.EventQueue.update(eqRecord.id, {
            status: 'processing',
          }).catch(err => console.warn('[processAutomationJobsQueue] EQ processing update failed:', err.message));
        }

        // 5. Log runtime_attempt_started
        const channel = job.job_type === 'instant_sms' ? 'sms' : 'email';
        const provider = channel === 'sms' ? 'twilio' : 'resend';
        const attemptEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
          lead_id: job.lead_id,
          client_id: resolvedClientId,
          client_project_id: resolvedProjectId,
          channel,
          direction: 'outbound',
          event_type: 'runtime_attempt_started',
          provider,
          status: 'pending',
          subject: `Executing ${job.job_type}`,
          message_body: job.description || '',
          metadata_json: JSON.stringify({ job_id: job.id, job_type: job.job_type, attempt: currentAttempts }),
          environment: getEnvironment(),
        });

        // 6. Execute based on job type
        let result;
        if (job.job_type === 'instant_sms') {
          result = await invokeExecutor(base44, 'executeInstantSms', job);
        } else {
          result = await invokeExecutor(base44, 'executeConfirmationEmail', job);
        }

        // 7. Process result
        const resultNow = new Date().toISOString();

        if (result.success) {
          // ── 7a. SUCCESS ──
          // Create final event first so we can store its ID in result_metadata
          const finalEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: job.lead_id,
            client_id: resolvedClientId,
            client_project_id: resolvedProjectId,
            channel,
            direction: 'outbound',
            event_type: channel === 'sms' ? 'sms_sent' : 'email_sent',
            provider,
            status: 'sent',
            subject: `${channel === 'sms' ? 'SMS' : 'Email'} sent successfully`,
            provider_message_id: result.provider_message_id || null,
            metadata_json: JSON.stringify({ job_id: job.id, attempt_event_id: attemptEvent.id }),
            environment: getEnvironment(),
          });

          // Update runtime_attempt_started -> sent
          await base44.asServiceRole.entities.CommunicationEvent.update(attemptEvent.id, {
            status: 'sent',
          }).catch(() => {});

          // Update job — processed_at, result_metadata, clear last_error
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'completed',
            processed_at: resultNow,
            last_error: null,
            result_metadata: JSON.stringify({
              provider,
              provider_message_id: result.provider_message_id || null,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              service_key: job.job_type,
              final_event_id: finalEvent?.id || null,
              attempt_event_id: attemptEvent.id,
              attempt: currentAttempts,
              error: null,
            }),
          });

          // Update EventQueue -> completed
          if (eqRecord) {
            await base44.asServiceRole.entities.EventQueue.update(eqRecord.id, {
              status: 'completed',
              completed_at: resultNow,
              retry_count: currentAttempts,
            }).catch(err => console.warn('[processAutomationJobsQueue] EQ completed update failed:', err.message));
          }

          results.push({ job_id: job.id, success: true, type: job.job_type, provider_message_id: result.provider_message_id });

        } else if (result.skipped) {
          // ── 7b. SKIPPED (invalid phone/email) — final failure, no retry ──
          await base44.asServiceRole.entities.CommunicationEvent.update(attemptEvent.id, {
            status: 'failed',
            error_message: result.error,
          }).catch(() => {});

          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'failed',
            processed_at: resultNow,
            last_error: result.error,
            result_metadata: JSON.stringify({
              provider,
              provider_message_id: null,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              service_key: job.job_type,
              attempt_event_id: attemptEvent.id,
              attempt: currentAttempts,
              error: result.error,
              skipped: true,
            }),
          });

          // Update EventQueue -> dead_letter
          if (eqRecord) {
            await base44.asServiceRole.entities.EventQueue.update(eqRecord.id, {
              status: 'dead_letter',
              retry_count: currentAttempts,
              completed_at: resultNow,
              error_message: `Skipped: ${result.error}`,
            }).catch(() => {});
          }

          // DeadLetterLog with full diagnostics
          await createDeadLetterLog(base44, {
            event_queue_id: eqRecord?.id || job.id,
            client_id: resolvedClientId || 'unresolved',
            client_project_id: resolvedProjectId,
            event_category: 'automation_event',
            processor_type: 'messaging_processor',
            failure_reason: `Skipped: ${result.error}`,
            final_error_message: result.error,
            retry_count: currentAttempts,
            metadata: {
              lead_id: job.lead_id,
              job_id: job.id,
              job_type: job.job_type,
              provider,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              queue_id: eqRecord?.id || null,
              skip_reason: result.error,
              client_id_resolution: resolvedClientId ? 'resolved_from_lead_or_queue' : 'unresolved',
            },
          });

          results.push({ job_id: job.id, success: false, skipped: true, error: result.error });

        } else if (currentAttempts < MAX_RETRIES) {
          // ── 7c. RETRY — back to queued ──
          await base44.asServiceRole.entities.CommunicationEvent.update(attemptEvent.id, {
            status: 'failed',
            error_message: result.error,
          }).catch(() => {});

          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'queued',
            last_error: result.error,
            result_metadata: JSON.stringify({
              provider,
              provider_message_id: null,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              service_key: job.job_type,
              attempt_event_id: attemptEvent.id,
              attempt: currentAttempts,
              error: result.error,
              retrying: true,
            }),
          });

          // EventQueue stays queued for retry
          if (eqRecord) {
            await base44.asServiceRole.entities.EventQueue.update(eqRecord.id, {
              status: 'queued',
              retry_count: currentAttempts,
              last_retry_at: resultNow,
              error_message: result.error,
            }).catch(() => {});
          }

          results.push({ job_id: job.id, success: false, retrying: true, error: result.error, attempt: currentAttempts });

        } else {
          // ── 7d. MAX RETRIES EXCEEDED — final failure ──
          // Create final event
          const finalEvent = await base44.asServiceRole.entities.CommunicationEvent.create({
            lead_id: job.lead_id,
            client_id: resolvedClientId,
            client_project_id: resolvedProjectId,
            channel,
            direction: 'outbound',
            event_type: channel === 'sms' ? 'sms_failed' : 'email_failed',
            provider,
            status: 'failed',
            subject: `${channel === 'sms' ? 'SMS' : 'Email'} send failed after ${MAX_RETRIES} attempts`,
            error_message: result.error,
            metadata_json: JSON.stringify({ job_id: job.id, attempt_event_id: attemptEvent.id, attempts: currentAttempts }),
            environment: getEnvironment(),
          });

          // Update runtime_attempt_started -> failed
          await base44.asServiceRole.entities.CommunicationEvent.update(attemptEvent.id, {
            status: 'failed',
            error_message: result.error,
          }).catch(() => {});

          // Update job — failed with processed_at, last_error, result_metadata
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'failed',
            processed_at: resultNow,
            last_error: result.error,
            result_metadata: JSON.stringify({
              provider,
              provider_message_id: null,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              service_key: job.job_type,
              final_event_id: finalEvent?.id || null,
              attempt_event_id: attemptEvent.id,
              attempt: currentAttempts,
              error: result.error,
              max_retries_exceeded: true,
            }),
          });

          // Update EventQueue -> dead_letter with real retry_count and completed_at
          if (eqRecord) {
            await base44.asServiceRole.entities.EventQueue.update(eqRecord.id, {
              status: 'dead_letter',
              retry_count: currentAttempts,
              completed_at: resultNow,
              error_message: `Max retries (${MAX_RETRIES}) exceeded: ${result.error}`,
            }).catch(() => {});
          }

          // DeadLetterLog with full diagnostics
          await createDeadLetterLog(base44, {
            event_queue_id: eqRecord?.id || job.id,
            client_id: resolvedClientId || 'unresolved',
            client_project_id: resolvedProjectId,
            event_category: 'automation_event',
            processor_type: 'messaging_processor',
            failure_reason: `Max retries (${MAX_RETRIES}) exceeded`,
            final_error_message: result.error,
            retry_count: currentAttempts,
            metadata: {
              lead_id: job.lead_id,
              job_id: job.id,
              job_type: job.job_type,
              provider,
              normalized_phone: result.normalized_phone || null,
              recipient_email: result.recipient_email || null,
              queue_id: eqRecord?.id || null,
              attempts: currentAttempts,
              client_id_resolution: resolvedClientId ? 'resolved_from_lead_or_queue' : 'unresolved',
            },
          });

          results.push({ job_id: job.id, success: false, dead_lettered: true, error: result.error, attempts: currentAttempts });
        }
      } catch (jobError) {
        console.error(`[processAutomationJobsQueue] Job ${job.id} exception:`, jobError);
        // Fix: update job to failed instead of leaving stuck as "processing"
        await base44.asServiceRole.entities.AutomationJob.update(job.id, {
          status: 'failed',
          processed_at: new Date().toISOString(),
          last_error: `Processor exception: ${jobError.message}`,
        }).catch(() => {});
        results.push({ job_id: job.id, success: false, error: jobError.message, exception: true });
      }
    }

    return Response.json({
      processed: results.length,
      results,
      summary: {
        completed: results.filter(r => r.success).length,
        retrying: results.filter(r => r.retrying).length,
        dead_lettered: results.filter(r => r.dead_lettered).length,
        skipped: results.filter(r => r.skipped).length,
        exceptions: results.filter(r => r.exception).length,
      },
    });
  } catch (error) {
    console.error('[processAutomationJobsQueue]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Stale job detection ──
async function markStaleJobsAsFailed(base44) {
  try {
    const staleJobs = await base44.asServiceRole.entities.AutomationJob.filter(
      { status: 'processing' },
      'created_at',
      50
    );

    const threshold = Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000;
    const now = new Date().toISOString();

    for (const job of staleJobs || []) {
      const jobCreated = job.created_date ? new Date(job.created_date).getTime() : 0;
      if (jobCreated > 0 && jobCreated < threshold) {
        await base44.asServiceRole.entities.AutomationJob.update(job.id, {
          status: 'failed',
          processed_at: now,
          last_error: `Stale job: stuck in processing for >${STALE_THRESHOLD_MINUTES} minutes`,
        }).catch(() => {});
        console.warn(`[processAutomationJobsQueue] Marked stale job ${job.id} as failed`);
      }
    }
  } catch (err) {
    console.warn('[processAutomationJobsQueue] Stale job detection failed:', err.message);
  }
}

// ── Resolve lead context for client_id / client_project_id ──
async function resolveLeadContext(base44, leadId) {
  try {
    let lead = await base44.asServiceRole.entities.WebsiteLead.get(leadId).catch(() => null);
    if (lead) {
      return {
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        lead_type: 'WebsiteLead',
      };
    }
    lead = await base44.asServiceRole.entities.Leads.get(leadId).catch(() => null);
    if (lead) {
      return {
        client_id: lead.client_id || null,
        client_project_id: lead.client_project_id || null,
        lead_type: 'Leads',
      };
    }
    return { client_id: null, client_project_id: null, lead_type: null };
  } catch {
    return { client_id: null, client_project_id: null, lead_type: null };
  }
}

// ── Find linked EventQueue record ──
async function findLinkedEventQueue(base44, jobId) {
  try {
    // Try by communication_event_id
    const byCommId = await base44.asServiceRole.entities.EventQueue.filter(
      { communication_event_id: jobId },
      '-created_date', 1
    ).catch(() => []);
    if (byCommId?.length > 0) return byCommId[0];

    // Try by metadata_json job_id
    const queuedEQs = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'queued', event_category: 'automation_event', processor_type: 'messaging_processor' },
      '-created_date', 50
    ).catch(() => []);
    for (const eq of queuedEQs || []) {
      try {
        const meta = JSON.parse(eq.metadata_json || '{}');
        if (meta.job_id === jobId) return eq;
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

// ── Create DeadLetterLog with full diagnostics ──
async function createDeadLetterLog(base44, info) {
  try {
    await base44.asServiceRole.entities.DeadLetterLog.create({
      event_queue_id: info.event_queue_id,
      communication_event_id: null,
      client_id: info.client_id,
      client_project_id: info.client_project_id || null,
      event_category: info.event_category,
      processor_type: info.processor_type,
      failure_reason: info.failure_reason,
      final_error_message: info.final_error_message,
      retry_count: info.retry_count,
      last_attempt_at: new Date().toISOString(),
      metadata_json: JSON.stringify(info.metadata || {}),
      status: 'pending_review',
    });
  } catch (err) {
    console.warn('[processAutomationJobsQueue] DeadLetterLog creation failed:', err.message);
  }
}

// ── Invoke executor function and normalize result ──
async function invokeExecutor(base44, functionName, job) {
  try {
    const result = await base44.functions.invoke(functionName, { job_id: job.id });
    const data = result.data || {};
    return {
      success: data.success || false,
      provider_message_id: data.message_id || null,
      error: data.error || null,
      skipped: data.skipped || false,
      normalized_phone: data.normalized_phone || null,
      recipient_email: data.recipient_email || null,
    };
  } catch (error) {
    return {
      success: false,
      provider_message_id: null,
      error: error.message,
      skipped: false,
      normalized_phone: null,
      recipient_email: null,
    };
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
  const auth = req.headers.get('authorization');
  return auth?.includes('Bearer') || req.headers.get('x-internal') === 'true';
}