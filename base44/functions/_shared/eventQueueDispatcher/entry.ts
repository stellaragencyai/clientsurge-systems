/**
 * Event Queue Dispatcher: Routes incoming events to appropriate processors
 * Enforces tenant isolation, rate limiting, and retry logic
 *
 * Shared helper — NOT a standalone function
 * Import and call from webhook/automation handlers
 */

async function dispatchEvent(base44, eventData) {
  const {
    communication_event_id,
    client_id,
    client_project_id,
    event_category, // inbound_event | automation_event | billing_event | system_event
    processor_type, // messaging_processor | automation_processor | billing_processor
    priority = 0,
  } = eventData;

  try {
    // Validate tenant isolation
    if (!client_id && !client_project_id) {
      throw new Error('Event must reference at least client_id or client_project_id');
    }

    // Create EventQueue record
    const queueEntry = await base44.asServiceRole.entities.EventQueue.create({
      communication_event_id,
      client_id: client_id || null,
      client_project_id: client_project_id || null,
      event_category,
      processor_type,
      status: 'queued',
      priority,
      retry_count: 0,
      max_retries: 3,
    });

    console.log(`[dispatcher] Event queued: ${queueEntry.id}`, {
      client_id,
      event_category,
      processor_type,
    });

    return {
      success: true,
      queue_id: queueEntry.id,
      status: 'queued',
    };
  } catch (error) {
    console.error('[dispatcher] Failed to queue event:', error.message);
    throw error;
  }
}

/**
 * Check tenant rate limits before processing
 */
async function checkRateLimit(base44, clientId, clientProjectId, eventCategory) {
  try {
    // Fetch rate limit config for tenant
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
        { client_id: clientId, client_project_id: null, enabled: true },
        '-created_date',
        1
      ).catch(() => []);
      config = clientConfigs?.[0];
    }

    // If no config, use defaults (no limits)
    if (!config) {
      return { allowed: true, reason: 'no_config' };
    }

    // Check appropriate limit based on event category
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    if (eventCategory === 'inbound_event') {
      const recentEvents = await base44.asServiceRole.entities.EventQueue.filter(
        {
          client_id: clientId,
          client_project_id: clientProjectId,
          event_category: 'inbound_event',
        },
        '-created_date',
        config.max_events_per_minute
      ).catch(() => []);

      const eventsLastMinute = recentEvents?.filter(
        e => new Date(e.created_date) > oneMinuteAgo
      ).length || 0;

      if (eventsLastMinute >= config.max_events_per_minute) {
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          limit: config.max_events_per_minute,
          current: eventsLastMinute,
        };
      }
    }

    return { allowed: true, reason: 'within_limits' };
  } catch (error) {
    console.error('[rateLimit] Check failed, allowing event:', error.message);
    return { allowed: true, reason: 'check_failed' }; // Fail-open: allow on error
  }
}

/**
 * Schedule retry for failed event with exponential backoff
 */
async function scheduleRetry(base44, queueId, retryCount) {
  try {
    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    const backoffMs = Math.pow(2, retryCount) * 1000;
    const nextRetryAt = new Date(Date.now() + backoffMs);

    await base44.asServiceRole.entities.EventQueue.update(queueId, {
      status: 'queued',
      retry_count: retryCount + 1,
      last_retry_at: new Date().toISOString(),
      next_retry_at: nextRetryAt.toISOString(),
    });

    return {
      scheduled: true,
      next_retry_at: nextRetryAt.toISOString(),
      backoff_ms: backoffMs,
    };
  } catch (error) {
    console.error('[scheduler] Failed to schedule retry:', error.message);
    throw error;
  }
}

/**
 * Move event to dead letter queue after max retries
 */
async function moveToDeadLetter(base44, queueEntry, failureReason, errorMessage) {
  try {
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
      metadata_json: JSON.stringify({
        queue_id: queueEntry.id,
        status_before_dlq: queueEntry.status,
      }),
      status: 'pending_review',
    });

    // Update EventQueue status
    await base44.asServiceRole.entities.EventQueue.update(queueEntry.id, {
      status: 'dead_letter',
    });

    console.log('[dlq] Event moved to dead letter:', deadLetter.id);

    return {
      success: true,
      dead_letter_id: deadLetter.id,
    };
  } catch (error) {
    console.error('[dlq] Failed to create dead letter record:', error.message);
    throw error;
  }
}

export { dispatchEvent, checkRateLimit, scheduleRetry, moveToDeadLetter };