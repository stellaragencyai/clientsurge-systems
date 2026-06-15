/**
 * Task 24 — Email retry mechanism
 * Queues a retry AutomationJob when email send fails
 */

export async function queueEmailRetry(base44, { leadId, email, subject, body, failureReason, retryDelayMinutes = 5 }) {
  try {
    const scheduledFor = new Date(Date.now() + retryDelayMinutes * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.AutomationJob.create({
      lead_id: leadId,
      job_type: 'email_retry',
      trigger_event: 'email_failed',
      status: 'queued',
      scheduled_for: scheduledFor,
      last_error: failureReason || 'Unknown failure',
      attempts: 0,
      metadata_json: JSON.stringify({ email, subject, body }),
    });
    return true;
  } catch (err) {
    console.error('Failed to queue email retry:', err.message);
    return false;
  }
}

Deno.serve(() => new Response('shared module', { status: 200 }));