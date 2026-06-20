/**
 * Handle failed CommunicationEvent or EventQueue with retry logic
 * - Retries with exponential backoff
 * - Moves to dead letter on final failure
 * - Does NOT delete the original event (immutable audit trail)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function isRetryableError(error) {
  const message = String(error).toLowerCase();
  const nonRetryable = ['invalid token', 'unauthorized', 'forbidden', 'authentication', 'permission denied', 'invalid config', 'not found'];
  return !nonRetryable.some(p => message.includes(p));
}

async function scheduleRetry(base44, { entityName, entityId, currentAttempt, error, context }) {
  const maxAttempts = 5;
  const nextAttempt = currentAttempt + 1;

  if (nextAttempt > maxAttempts) {
    try {
      await base44.asServiceRole.entities.DeadLetterLog.create({
        entity_name: entityName,
        entity_id: entityId,
        final_attempt: currentAttempt,
        error_message: error?.message || String(error),
        error_stack: error?.stack || null,
        context_json: context ? JSON.stringify(context) : null,
        moved_at: new Date().toISOString(),
        status: 'pending_review',
      });
    } catch (dlErr) {
      console.error('[retry] Failed to create DeadLetterLog:', dlErr.message);
    }
    return { status: 'dead_letter', attempt: currentAttempt };
  }

  const backoffSeconds = Math.pow(2, nextAttempt) * 60;
  const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

  try {
    await base44.asServiceRole.entities[entityName].update(entityId, {
      retry_count: nextAttempt,
      last_error_message: error?.message || String(error),
      next_retry_at: nextRetryAt.toISOString(),
      last_retry_at: new Date().toISOString(),
    });
  } catch (updateErr) {
    console.warn('[retry] Failed to update metadata:', updateErr.message);
  }

  return {
    status: 'scheduled_retry',
    attempt: nextAttempt,
    nextRetryAt: nextRetryAt.toISOString(),
    backoffSeconds,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { entity_name, entity_id, error_message, context } = await req.json();

    if (!entity_name || !entity_id) {
      return Response.json({ error: 'entity_name and entity_id required' }, { status: 400 });
    }

    let item;
    try {
      const items = await base44.asServiceRole.entities[entity_name].filter({ id: entity_id }, 'id', 1);
      item = items?.[0];
    } catch {
      return Response.json({ error: `${entity_name} not found` }, { status: 404 });
    }

    if (!item) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const error = new Error(error_message || 'Event processing failed');

    if (!isRetryableError(error)) {
      const result = await scheduleRetry(base44, {
        entityName: entity_name,
        entityId: entity_id,
        currentAttempt: 5,
        error,
        context,
      });
      return Response.json({ status: 'non_retryable', ...result });
    }

    const result = await scheduleRetry(base44, {
      entityName: entity_name,
      entityId: entity_id,
      currentAttempt: item.retry_count || 0,
      error,
      context,
    });

    return Response.json(result);
  } catch (error) {
    console.error('[processFailedEventWithRetry]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});