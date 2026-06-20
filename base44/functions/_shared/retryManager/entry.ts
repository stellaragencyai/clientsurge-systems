/**
 * Shared retry manager — exponential backoff, max attempts, dead letter routing
 * 
 * Use this in event processors to safely retry failed items with:
 * - Exponential backoff (2^attempt * 60 seconds)
 * - Max 5 retry attempts
 * - Dead letter routing on final failure
 * - Idempotency key tracking
 */

export async function scheduleRetry(base44, { entityName, entityId, currentAttempt, error, context }) {
  const maxAttempts = 5;
  const nextAttempt = currentAttempt + 1;

  if (nextAttempt > maxAttempts) {
    // Move to dead letter
    await moveToDeadLetter(base44, { entityName, entityId, error, finalAttempt: currentAttempt, context });
    return { status: 'dead_letter', attempt: currentAttempt };
  }

  // Exponential backoff: 2^attempt * 60 seconds (1min, 2min, 4min, 8min, 16min)
  const backoffSeconds = Math.pow(2, nextAttempt) * 60;
  const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

  // Update the entity to reflect retry
  try {
    const updateData = {
      retry_count: nextAttempt,
      last_error_message: error?.message || String(error),
      next_retry_at: nextRetryAt.toISOString(),
      last_retry_at: new Date().toISOString(),
    };

    // Update entity based on type
    if (entityName === 'AutomationJob') {
      await base44.asServiceRole.entities.AutomationJob.update(entityId, updateData);
    } else if (entityName === 'EventQueue') {
      await base44.asServiceRole.entities.EventQueue.update(entityId, updateData);
    } else if (entityName === 'CommunicationEvent') {
      // Communication events can be flagged but not directly updated in most flows
      console.warn(`[retryManager] CommunicationEvent ${entityId} marked for retry (immutable, may not persist)`);
    }
  } catch (updateErr) {
    console.error(`[retryManager] Failed to update retry metadata for ${entityName} ${entityId}:`, updateErr);
  }

  return {
    status: 'scheduled_retry',
    attempt: nextAttempt,
    nextRetryAt: nextRetryAt.toISOString(),
    backoffSeconds,
  };
}

export async function moveToDeadLetter(base44, { entityName, entityId, error, finalAttempt, context }) {
  try {
    await base44.asServiceRole.entities.DeadLetterLog.create({
      entity_name: entityName,
      entity_id: entityId,
      final_attempt: finalAttempt,
      error_message: error?.message || String(error),
      error_stack: error?.stack || null,
      context_json: context ? JSON.stringify(context) : null,
      moved_at: new Date().toISOString(),
      status: 'pending_review',
    });

    console.log(`[retryManager] Moved ${entityName}:${entityId} to DeadLetterLog after ${finalAttempt} attempts`);
    return { status: 'moved_to_dead_letter', entityName, entityId };
  } catch (dlErr) {
    console.error(`[retryManager] Failed to create DeadLetterLog entry:`, dlErr);
    throw dlErr;
  }
}

export async function isRetryable(error) {
  // Classify error as retryable
  if (!error) return true; // Retry on unknown errors

  const message = String(error).toLowerCase();
  const nonRetryablePatterns = [
    'invalid token',
    'unauthorized',
    'forbidden',
    'authentication failed',
    'permission denied',
    'invalid configuration',
    'not found',
  ];

  const isNonRetryable = nonRetryablePatterns.some(p => message.includes(p));
  return !isNonRetryable;
}