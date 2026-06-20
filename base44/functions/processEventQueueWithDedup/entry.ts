import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * processEventQueueWithDedup — Process EventQueue with strict deduplication
 * 
 * Enforces:
 * - Only one AutomationJob per canonical event
 * - Duplicates marked as ignored, not reprocessed
 * - Idempotency key prevents re-execution
 * - Dead letter queue for unrecoverable events
 */

function generateIdempotencyKey(event) {
  // Use provider_message_id if available (most reliable)
  if (event.provider_message_id && event.provider) {
    return `${event.provider}_${event.provider_message_id}`;
  }
  // Fallback: composite key with event type and timestamp
  if (event.communication_event_id && event.event_type) {
    const timestamp = new Date(event.created_date || Date.now()).getTime();
    return `${event.communication_event_id}_${event.event_type}_${timestamp}`;
  }
  // Last resort: event ID alone
  return event.communication_event_id;
}

async function checkEventAlreadyProcessed(base44, eventId, idempotencyKey, clientId, clientProjectId) {
  try {
    // Check if an AutomationJob already exists for this event
    const existingJob = await base44.asServiceRole.entities.AutomationJob.filter(
      { communication_event_id: eventId, status: { $in: ['completed', 'processing'] } },
      '-created_date',
      1
    ).catch(() => []);

    if (existingJob?.length > 0) {
      return {
        is_duplicate: true,
        reason: 'automation_job_exists',
        job_id: existingJob[0].id,
      };
    }

    // Check IdempotencyKey table
    const existingKey = await base44.asServiceRole.entities.IdempotencyKey.filter(
      { idempotency_key: idempotencyKey },
      '-created_date',
      1
    ).catch(() => []);

    if (existingKey?.length > 0) {
      const keyEntry = existingKey[0];
      if (keyEntry.status === 'completed' || keyEntry.status === 'processing') {
        return {
          is_duplicate: true,
          reason: keyEntry.status === 'completed' ? 'already_executed' : 'currently_processing',
          key_id: keyEntry.id,
        };
      }
    }

    return {
      is_duplicate: false,
      reason: 'new_event',
    };
  } catch (error) {
    console.error('[dedup] Check failed:', error.message);
    // Fail-open: process if we can't verify
    return { is_duplicate: false, reason: 'check_error', error: error.message };
  }
}

async function markEventQueueIgnored(base44, queueId, reason) {
  try {
    await base44.asServiceRole.entities.EventQueue.update(queueId, {
      status: 'ignored',
      processing_notes: reason,
    }).catch(() => {});
  } catch (e) {
    console.error('[dedup] Failed to mark ignored:', e.message);
  }
}

async function markEventQueueProcessing(base44, queueId, idempotencyKeyId) {
  try {
    await base44.asServiceRole.entities.EventQueue.update(queueId, {
      status: 'processing',
      idempotency_key_id: idempotencyKeyId,
    }).catch(() => {});
  } catch (e) {
    console.error('[dedup] Failed to mark processing:', e.message);
  }
}

async function markEventQueueCompleted(base44, queueId) {
  try {
    await base44.asServiceRole.entities.EventQueue.update(queueId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).catch(() => {});
  } catch (e) {
    console.error('[dedup] Failed to mark completed:', e.message);
  }
}

async function createAutomationJobIdempotent(base44, queueItem, idempotencyKey) {
  try {
    // Create AutomationJob with strict idempotency
    const job = await base44.asServiceRole.entities.AutomationJob.create({
      communication_event_id: queueItem.communication_event_id,
      event_type: queueItem.event_type,
      channel: queueItem.channel,
      status: 'pending',
      client_id: queueItem.client_id,
      client_project_id: queueItem.client_project_id || null,
      idempotency_key: idempotencyKey,
      attempt_count: 0,
      max_retries: 3,
      processor_type: queueItem.processor_type,
      metadata_json: queueItem.metadata_json,
    });

    return {
      success: true,
      job_id: job.id,
    };
  } catch (error) {
    console.error('[dedup] Failed to create AutomationJob:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { 
      queue_item_id,
      limit = 10,
    } = await req.json().catch(() => ({}));

    // Fetch unprocessed events from queue
    const filter = queue_item_id 
      ? { id: queue_item_id }
      : { status: 'queued' };

    const queueItems = await base44.asServiceRole.entities.EventQueue.filter(
      filter,
      'created_at',
      limit
    ).catch(() => []);

    if (!queueItems || queueItems.length === 0) {
      return Response.json({
        success: true,
        processed: 0,
        ignored: 0,
        failed: 0,
      });
    }

    let processed = 0;
    let ignored = 0;
    let failed = 0;
    const results = [];

    for (const item of queueItems) {
      try {
        const idempotencyKey = generateIdempotencyKey({
          provider_message_id: item.provider_message_id,
          provider: item.provider,
          communication_event_id: item.communication_event_id,
          event_type: item.event_type,
          created_date: item.created_date,
        });

        // Step 1: Check if already processed
        const dupCheck = await checkEventAlreadyProcessed(
          base44,
          item.communication_event_id,
          idempotencyKey,
          item.client_id,
          item.client_project_id
        );

        if (dupCheck.is_duplicate) {
          // Mark as ignored instead of reprocessing
          await markEventQueueIgnored(base44, item.id, `Duplicate: ${dupCheck.reason}`);
          ignored++;
          console.log(`[processEventQueueWithDedup] Event ignored (duplicate):`, {
            queue_id: item.id,
            event_id: item.communication_event_id,
            reason: dupCheck.reason,
          });
          results.push({
            queue_id: item.id,
            status: 'ignored',
            reason: dupCheck.reason,
          });
          continue;
        }

        // Step 2: Create or verify IdempotencyKey entry
        const keyEntry = await base44.asServiceRole.entities.IdempotencyKey.filter(
          { idempotency_key: idempotencyKey },
          '-created_date',
          1
        ).catch(() => []);

        let keyId;
        if (keyEntry?.length > 0) {
          keyId = keyEntry[0].id;
        } else {
          const newKey = await base44.asServiceRole.entities.IdempotencyKey.create({
            idempotency_key: idempotencyKey,
            operation_type: 'event_processing',
            resource_type: 'communication_event',
            resource_id: item.communication_event_id,
            client_id: item.client_id,
            client_project_id: item.client_project_id || null,
            status: 'pending',
            execution_count: 0,
          });
          keyId = newKey.id;
        }

        // Step 3: Mark queue item as processing
        await markEventQueueProcessing(base44, item.id, keyId);

        // Step 4: Create AutomationJob (idempotent)
        const jobResult = await createAutomationJobIdempotent(base44, item, idempotencyKey);

        if (!jobResult.success) {
          throw new Error(jobResult.error);
        }

        // Step 5: Update IdempotencyKey to completed
        await base44.asServiceRole.entities.IdempotencyKey.update(keyId, {
          status: 'completed',
          execution_count: 1,
        }).catch(() => {});

        // Step 6: Mark queue item as completed
        await markEventQueueCompleted(base44, item.id);

        processed++;
        console.log(`[processEventQueueWithDedup] Event processed successfully:`, {
          queue_id: item.id,
          job_id: jobResult.job_id,
          idempotency_key: idempotencyKey,
        });

        results.push({
          queue_id: item.id,
          status: 'processed',
          job_id: jobResult.job_id,
        });
      } catch (error) {
        failed++;
        console.error(`[processEventQueueWithDedup] Event processing failed:`, {
          queue_id: item.id,
          error: error.message,
        });

        // Move to dead letter queue for manual review
        await base44.asServiceRole.entities.EventQueue.update(item.id, {
          status: 'dead_letter',
          error_message: error.message,
          retry_count: (item.retry_count || 0) + 1,
        }).catch(() => {});

        results.push({
          queue_id: item.id,
          status: 'dead_letter',
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      processed,
      ignored,
      failed,
      total: queueItems.length,
      results,
    });
  } catch (error) {
    console.error('[processEventQueueWithDedup] Handler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});