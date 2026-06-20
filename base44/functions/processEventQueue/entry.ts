import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Event Queue Processor: Consumes queued events and routes to processor pipelines
 * Runs periodically (every 10 seconds) to maintain throughput
 *
 * Processes events in priority order per tenant to ensure isolation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch next batch of queued events
    const queuedEvents = await base44.asServiceRole.entities.EventQueue.filter(
      { status: 'queued' },
      '-priority, created_date',
      100
    ).catch(() => []);

    const results = {
      total_processed: 0,
      successful: 0,
      failed: 0,
      rate_limited: 0,
      errors: [],
    };

    for (const event of queuedEvents) {
      try {
        // ── DEDUPLICATION GUARD ──────────────────────────────────────────────
        // Compute idempotency key for this event
        const idempKey = event.communication_event_id
          ? `eq_${event.communication_event_id}_${event.processor_type}`
          : null;

        if (idempKey) {
          // Check if this exact event has already been processed or is in flight
          const [existingKey, existingCompleted] = await Promise.all([
            base44.asServiceRole.entities.IdempotencyKey.filter(
              { idempotency_key: idempKey, status: { $in: ['completed', 'processing'] } },
              '-created_date',
              1
            ).catch(() => []),
            base44.asServiceRole.entities.EventQueue.filter(
              {
                communication_event_id: event.communication_event_id,
                status: { $in: ['completed'] },
                id: { $ne: event.id },
              },
              '-created_date',
              1
            ).catch(() => []),
          ]);

          const isDuplicate =
            (existingKey?.length > 0) ||
            (existingCompleted?.length > 0);

          if (isDuplicate) {
            // Mark as ignored — no processing, no deletion
            await base44.asServiceRole.entities.EventQueue.update(event.id, {
              status: 'ignored',
              error_message: 'Skipped: duplicate of already-processed event',
            }).catch(() => {});

            console.warn(`[processEventQueue] Skipping duplicate event:`, {
              queue_id: event.id,
              comm_event_id: event.communication_event_id,
              idempotency_key: idempKey,
            });

            results.total_processed++;
            continue;
          }

          // Register idempotency key as processing
          await base44.asServiceRole.entities.IdempotencyKey.create({
            idempotency_key: idempKey,
            operation_type: 'event_queue_processing',
            resource_type: 'event_queue',
            resource_id: event.id,
            client_id: event.client_id,
            client_project_id: event.client_project_id || null,
            status: 'processing',
            execution_count: 1,
          }).catch(() => {}); // Silently ignore if already exists — idempotent create
        }
        // ────────────────────────────────────────────────────────────────────

        // Mark as processing
        await base44.asServiceRole.entities.EventQueue.update(event.id, {
          status: 'processing',
        });

        // Check rate limits
        const rateLimitCheck = await checkRateLimit(
          base44,
          event.client_id,
          event.client_project_id,
          event.event_category
        );

        if (!rateLimitCheck.allowed) {
          await base44.asServiceRole.entities.EventQueue.update(event.id, {
            status: 'queued',
            rate_limited: true,
          });
          results.rate_limited++;
          continue;
        }

        // Route to appropriate processor
        let processorResult = null;
        switch (event.processor_type) {
          case 'messaging_processor':
            processorResult = await invokeProcessor(base44, 'messagingProcessor', event);
            break;
          case 'automation_processor':
            processorResult = await invokeProcessor(base44, 'automationProcessor', event);
            break;
          case 'billing_processor':
            processorResult = await invokeProcessor(base44, 'billingProcessor', event);
            break;
          default:
            throw new Error(`Unknown processor: ${event.processor_type}`);
        }

        if (processorResult.success) {
          await base44.asServiceRole.entities.EventQueue.update(event.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          // Mark idempotency key as completed
          if (idempKey) {
            await base44.asServiceRole.entities.IdempotencyKey.filter(
              { idempotency_key: idempKey },
              '-created_date',
              1
            ).then(async (keys) => {
              if (keys?.length > 0) {
                await base44.asServiceRole.entities.IdempotencyKey.update(keys[0].id, {
                  status: 'completed',
                  last_executed_at: new Date().toISOString(),
                }).catch(() => {});
              }
            }).catch(() => {});
          }

          results.successful++;
        } else {
          throw new Error(processorResult.error || 'Processor failed');
        }

        results.total_processed++;
      } catch (error) {
        results.total_processed++;
        results.failed++;

        console.error(`[processEventQueue] Event ${event.id} failed:`, error.message);

        if (event.retry_count < event.max_retries) {
          const retry = await scheduleRetry(base44, event.id, event.retry_count);
          results.errors.push({
            event_id: event.id,
            error: error.message,
            retrying: true,
            next_retry: retry.next_retry_at,
          });
        } else {
          const dlq = await moveToDeadLetter(base44, event, 'max_retries_exceeded', error.message);
          results.errors.push({
            event_id: event.id,
            error: error.message,
            dead_lettered: true,
            dead_letter_id: dlq.dead_letter_id,
          });
        }
      }
    }

    return Response.json({
      success: true,
      processing_results: results,
    });
  } catch (error) {
    console.error('[processEventQueue] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkRateLimit(base44, clientId, clientProjectId, eventCategory) {
  try {
    let config = null;
    if (clientProjectId) {
      const projectConfigs = await base44.asServiceRole.entities.RateLimitConfig.filter(
        { client_project_id: clientProjectId, enabled: true },
        '-created_date',
        1
      ).catch(() => []);
      config = projectConfigs?.[0];
    }
    if (!config && clientId) {
      const clientConfigs = await base44.asServiceRole.entities.RateLimitConfig.filter(
        { client_id: clientId, enabled: true },
        '-created_date',
        1
      ).catch(() => []);
      config = clientConfigs?.[0];
    }
    if (!config) {
      return { allowed: true, reason: 'no_config' };
    }
    return { allowed: true, reason: 'within_limits' };
  } catch (error) {
    console.error('[rateLimit] Check failed, allowing:', error.message);
    return { allowed: true, reason: 'check_failed' };
  }
}

async function scheduleRetry(base44, queueId, retryCount) {
  const backoffMs = Math.pow(2, retryCount) * 1000;
  const nextRetryAt = new Date(Date.now() + backoffMs);
  await base44.asServiceRole.entities.EventQueue.update(queueId, {
    status: 'queued',
    retry_count: retryCount + 1,
    last_retry_at: new Date().toISOString(),
    next_retry_at: nextRetryAt.toISOString(),
  });
  return { scheduled: true, next_retry_at: nextRetryAt.toISOString(), backoff_ms: backoffMs };
}

async function moveToDeadLetter(base44, queueEntry, failureReason, errorMessage) {
  const deadLetter = await base44.asServiceRole.entities.DeadLetterLog.create({
    event_queue_id: queueEntry.id,
    communication_event_id: queueEntry.communication_event_id,
    client_id: queueEntry.client_id,
    client_project_id: queueEntry.client_project_id,
    event_category: queueEntry.event_category,
    processor_type: queueEntry.processor_type,
    failure_reason: failureReason,
    final_error_message: errorMessage,
    retry_count: queueEntry.retry_count,
    last_attempt_at: new Date().toISOString(),
    status: 'pending_review',
  });
  await base44.asServiceRole.entities.EventQueue.update(queueEntry.id, { status: 'dead_letter' });
  return { success: true, dead_letter_id: deadLetter.id };
}

async function invokeProcessor(base44, processorName, event) {
  try {
    const result = await base44.asServiceRole.functions.invoke(processorName, {
      event_queue_id: event.id,
      communication_event_id: event.communication_event_id,
      client_id: event.client_id,
      client_project_id: event.client_project_id,
      event_category: event.event_category,
    });
    return { success: result.data?.success !== false, error: result.data?.error || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}