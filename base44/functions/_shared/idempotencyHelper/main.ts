/**
 * Idempotency Helper: Shared utilities for deduplication
 * 
 * Usage: inline this logic into functions that need idempotency
 * (shared functions cannot import other shared functions)
 */

async function checkOrCreateIdempotencyKey(
  base44,
  idempotencyKey,
  operationType,
  resourceType,
  resourceId,
  clientId,
  clientProjectId,
  metadata = {}
) {
  try {
    // Check if idempotency key already exists
    const existing = await base44.asServiceRole.entities.IdempotencyKey.filter(
      { idempotency_key: idempotencyKey },
      '-created_date',
      1
    ).catch(() => []);

    if (existing?.length > 0) {
      const idempKey = existing[0];
      
      if (idempKey.status === 'completed') {
        return {
          is_duplicate: true,
          status: 'completed',
          key_id: idempKey.id,
          skip_execution: true,
          reason: 'already_processed',
          result_hash: idempKey.result_hash,
        };
      } else if (idempKey.status === 'processing') {
        return {
          is_duplicate: true,
          status: 'processing',
          key_id: idempKey.id,
          skip_execution: true,
          reason: 'currently_processing',
        };
      } else if (idempKey.status === 'failed') {
        return {
          is_duplicate: false,
          status: 'failed',
          key_id: idempKey.id,
          skip_execution: false,
          reason: 'previous_failure_retry',
        };
      }
    }

    // Create new idempotency key entry
    const newKey = await base44.asServiceRole.entities.IdempotencyKey.create({
      idempotency_key: idempotencyKey,
      operation_type: operationType,
      resource_type: resourceType,
      resource_id: resourceId,
      client_id: clientId,
      client_project_id: clientProjectId || null,
      status: 'pending',
      metadata_json: JSON.stringify(metadata),
    });

    return {
      is_duplicate: false,
      status: 'pending',
      key_id: newKey.id,
      skip_execution: false,
      reason: 'new_operation',
    };
  } catch (error) {
    console.error('[idempotencyHelper] Check failed:', error.message);
    // Fail-open: allow execution on error
    return {
      is_duplicate: false,
      status: 'unknown',
      skip_execution: false,
      reason: 'check_failed',
    };
  }
}

async function markIdempotencyKeyProcessing(base44, keyId) {
  await base44.asServiceRole.entities.IdempotencyKey.update(keyId, {
    status: 'processing',
    execution_count: { $inc: 1 },
    first_executed_at: new Date().toISOString(),
  }).catch(() => {});
}

async function markIdempotencyKeyCompleted(base44, keyId, resultHash = null) {
  await base44.asServiceRole.entities.IdempotencyKey.update(keyId, {
    status: 'completed',
    result_hash: resultHash,
    last_executed_at: new Date().toISOString(),
  }).catch(() => {});
}

async function markIdempotencyKeyFailed(base44, keyId, errorMessage) {
  await base44.asServiceRole.entities.IdempotencyKey.update(keyId, {
    status: 'failed',
    error_message: errorMessage,
    last_executed_at: new Date().toISOString(),
  }).catch(() => {});
}

async function trackStateTransition(
  base44,
  workflowId,
  resourceType,
  resourceId,
  clientId,
  clientProjectId,
  entityType,
  fieldName,
  fromValue,
  toValue,
  processorType,
  idempotencyKey
) {
  try {
    // Check if this exact state transition already exists
    const existingHistory = await base44.asServiceRole.entities.WorkflowStateHistory.filter(
      {
        workflow_id: workflowId,
        'state_transition.field_name': fieldName,
        'state_transition.to_value': toValue,
      },
      '-created_at',
      1
    ).catch(() => []);

    if (existingHistory?.length > 0) {
      // State already applied, skip
      const history = await base44.asServiceRole.entities.WorkflowStateHistory.create({
        workflow_id: workflowId,
        resource_type: resourceType,
        resource_id: resourceId,
        client_id: clientId,
        client_project_id: clientProjectId || null,
        state_transition: {
          entity_type: entityType,
          field_name: fieldName,
          from_value: fromValue,
          to_value: toValue,
        },
        processor_type: processorType,
        idempotency_key: idempotencyKey,
        is_duplicate: true,
        duplicate_of_history_id: existingHistory[0].id,
        applied_at: new Date().toISOString(),
      });

      return {
        tracked: true,
        is_duplicate: true,
        history_id: history.id,
      };
    }

    // New state transition
    const history = await base44.asServiceRole.entities.WorkflowStateHistory.create({
      workflow_id: workflowId,
      resource_type: resourceType,
      resource_id: resourceId,
      client_id: clientId,
      client_project_id: clientProjectId || null,
      state_transition: {
        entity_type: entityType,
        field_name: fieldName,
        from_value: fromValue,
        to_value: toValue,
      },
      processor_type: processorType,
      idempotency_key: idempotencyKey,
      is_duplicate: false,
      applied_at: new Date().toISOString(),
    });

    return {
      tracked: true,
      is_duplicate: false,
      history_id: history.id,
    };
  } catch (error) {
    console.error('[idempotencyHelper] State tracking failed:', error.message);
    return {
      tracked: false,
      error: error.message,
    };
  }
}

export {
  checkOrCreateIdempotencyKey,
  markIdempotencyKeyProcessing,
  markIdempotencyKeyCompleted,
  markIdempotencyKeyFailed,
  trackStateTransition,
};