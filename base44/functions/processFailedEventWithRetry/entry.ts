/**
 * Handle failed CommunicationEvent or EventQueue with retry logic
 * 
 * Called when an event fails to process.
 * - Retries with exponential backoff
 * - Moves to dead letter on final failure
 * - Does NOT delete the original event (immutable audit trail)
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

    const { entity_name, entity_id, error_message, context } = await req.json();

    if (!entity_name || !entity_id) {
      return Response.json({ error: 'entity_name and entity_id required' }, { status: 400 });
    }

    // Fetch the event/queue item
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

    const currentAttempt = item.retry_count || 0;
    const error = new Error(error_message || 'Event processing failed');

    // Check if retryable
    const canRetry = await isRetryable(error);
    if (!canRetry) {
      const result = await scheduleRetry(base44, {
        entityName: entity_name,
        entityId: entity_id,
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
      entityName: entity_name,
      entityId: entity_id,
      currentAttempt,
      error,
      context,
    });

    return Response.json(result);
  } catch (error) {
    console.error('[processFailedEventWithRetry]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});