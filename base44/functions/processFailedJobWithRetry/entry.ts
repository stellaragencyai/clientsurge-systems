/**
 * Handle failed AutomationJob with retry logic
 * 
 * Called when an AutomationJob fails during processing.
 * - Retries up to 5 times with exponential backoff
 * - Moves to dead letter on final failure
 * - Logs all attempts for visibility
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { scheduleRetry, isRetryable } from './_shared/retryManager.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { job_id, error_message, context } = await req.json();

    if (!job_id) {
      return Response.json({ error: 'job_id required' }, { status: 400 });
    }

    // Fetch the job
    const job = await base44.asServiceRole.entities.AutomationJob.filter({ id: job_id }, 'id', 1);
    if (!job || job.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const currentJob = job[0];
    const currentAttempt = currentJob.retry_count || 0;
    const error = new Error(error_message || 'Job failed');

    // Check if retryable
    const canRetry = await isRetryable(error);
    if (!canRetry) {
      const result = await scheduleRetry(base44, {
        entityName: 'AutomationJob',
        entityId: job_id,
        currentAttempt: 5, // Force final failure
        error,
        context,
      });
      return Response.json({
        status: 'non_retryable',
        ...result,
      });
    }

    // Schedule retry
    const result = await scheduleRetry(base44, {
      entityName: 'AutomationJob',
      entityId: job_id,
      currentAttempt,
      error,
      context,
    });

    return Response.json(result);
  } catch (error) {
    console.error('[processFailedJobWithRetry]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});