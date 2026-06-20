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
        if (result.success) {
          await base44.asServiceRole.entities.AutomationJob.update(job.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            provider_message_id: result.provider_message_id,
          });
          results.push({ job_id: job.id, success: true, type: job.job_type });
        } else {
          // Retry logic
          if (job.retry_count < (job.max_retries || 3)) {
            await base44.asServiceRole.entities.AutomationJob.update(job.id, {
              status: 'queued',
              retry_count: (job.retry_count || 0) + 1,
              last_error: result.error,
              last_attempt_at: new Date().toISOString(),
            });
            results.push({ job_id: job.id, success: false, retrying: true, error: result.error });
          } else {
            // Max retries exceeded
            await base44.asServiceRole.entities.AutomationJob.update(job.id, {
              status: 'failed',
              failed_at: new Date().toISOString(),
              final_error: result.error,
            });

            // Create DeadLetterLog — client_id is required; fall back to 'unknown'
            await base44.asServiceRole.entities.DeadLetterLog.create({
              event_queue_id: job.id,
              communication_event_id: null,
              client_id: job.client_id || 'unknown',
              client_project_id: job.client_project_id,
              event_category: 'automation_event',
              processor_type: job.job_type,
              failure_reason: `Max retries (${job.max_retries || 3}) exceeded`,
              final_error_message: result.error,
              retry_count: job.retry_count || 0,
              last_attempt_at: new Date().toISOString(),
              metadata_json: JSON.stringify(job),
              status: 'pending_review',
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