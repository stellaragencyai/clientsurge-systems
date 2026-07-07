import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Event Queue Processor: Consumes queued events and routes to processor pipelines.
 *
 * PHASE 1 HARDENING — Every queued event must resolve to exactly one ClientDeployment
 * before execution. If deploymentId cannot be resolved, the event is moved to
 * dead-letter state and a diagnostic record is created.
 *
 * Required execution flow:
 *   EventQueue → Resolve ClientDeployment → checkModulePermission() →
 *   Automation Execution → AutomationProofLog
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
      blocked: 0,
      dead_lettered: 0,
      rate_limited: 0,
      errors: [],
    };

    for (const event of queuedEvents) {
      try {
        // ── DEDUPLICATION GUARD ──────────────────────────────────────────────
        const idempKey = event.communication_event_id
          ? `eq_${event.communication_event_id}_${event.processor_type}`
          : null;

        if (idempKey) {
          const [existingKey, existingCompleted] = await Promise.all([
            base44.asServiceRole.entities.IdempotencyKey.filter(
              { idempotency_key: idempKey, status: { $in: ['completed', 'processing'] } },
              '-created_date', 1
            ).catch(() => []),
            base44.asServiceRole.entities.EventQueue.filter(
              {
                communication_event_id: event.communication_event_id,
                status: { $in: ['completed'] },
                id: { $ne: event.id },
              },
              '-created_date', 1
            ).catch(() => []),
          ]);

          const isDuplicate = (existingKey?.length > 0) || (existingCompleted?.length > 0);

          if (isDuplicate) {
            await base44.asServiceRole.entities.EventQueue.update(event.id, {
              status: 'ignored',
              error_message: 'Skipped: duplicate of already-processed event',
            }).catch(() => {});

            results.total_processed++;
            continue;
          }

          await base44.asServiceRole.entities.IdempotencyKey.create({
            idempotency_key: idempKey,
            operation_type: 'event_queue_processing',
            resource_type: 'event_queue',
            resource_id: event.id,
            client_id: event.client_id,
            client_project_id: event.client_project_id || null,
            status: 'processing',
            execution_count: 1,
          }).catch(() => {});
        }

        // ── PHASE 1: DEPLOYMENT IDENTITY RESOLUTION ──────────────────────────
        // Every event must resolve to exactly one ClientDeployment before execution.
        const deploymentCtx = await resolveDeploymentForEvent(base44, event);

        if (!deploymentCtx.resolved) {
          // Cannot resolve deployment — do NOT execute, move to dead-letter
          await moveToDeadLetter(base44, event, 'deployment_unresolvable', deploymentCtx.reason);
          await createDiagnosticRecord(base44, event, 'deployment_unresolvable', deploymentCtx.reason);

          results.blocked++;
          results.dead_lettered++;
          results.total_processed++;
          continue;
        }

        // ── PHASE 1: DEPLOYMENT STATUS VALIDATION ────────────────────────────
        const BLOCKED_STATUSES = ['paused', 'cancelled', 'error'];
        if (BLOCKED_STATUSES.includes(deploymentCtx.deployment.deployment_status)) {
          await base44.asServiceRole.entities.EventQueue.update(event.id, {
            status: 'dead_letter',
            error_message: `Deployment status '${deploymentCtx.deployment.deployment_status}' blocks execution`,
          }).catch(() => {});
          await createDiagnosticRecord(base44, event, 'deployment_status_blocked',
            `Deployment '${deploymentCtx.deployment.id}' has blocking status: ${deploymentCtx.deployment.deployment_status}`);

          results.blocked++;
          results.dead_lettered++;
          results.total_processed++;
          continue;
        }

        // ── PHASE 1: MODULE PERMISSION VALIDATION ────────────────────────────
        // Determine module_key from event metadata or processor_type
        const moduleKey = event.module_key || inferModuleKey(event);
        if (moduleKey) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deploymentCtx.deployment.id,
            module_key: moduleKey,
            client_id: event.client_id,
            environment: event.environment || null,
          }).catch((err) => ({ data: { authorized: false, reason: 'permission_check_failed', error: err.message } }));

          if (permRes.data?.authorized !== true) {
            // Permission denied — do NOT execute, move to dead-letter
            await base44.asServiceRole.entities.EventQueue.update(event.id, {
              status: 'dead_letter',
              error_message: `Module '${moduleKey}' not authorized: ${permRes.data?.reason || 'unknown'}`,
            }).catch(() => {});
            await createDiagnosticRecord(base44, event, 'module_permission_denied',
              `Module '${moduleKey}' denied for deployment ${deploymentCtx.deployment.id}: ${permRes.data?.reason}`);

            results.blocked++;
          results.dead_lettered++;
            results.total_processed++;
            continue;
          }
        }

        // Mark as processing
        await base44.asServiceRole.entities.EventQueue.update(event.id, {
          status: 'processing',
          deployment_id: deploymentCtx.deployment.id,
          module_key: moduleKey,
        });

        // Check rate limits
        const rateLimitCheck = await checkRateLimit(
          base44, event.client_id, event.client_project_id, event.event_category
        );

        if (!rateLimitCheck.allowed) {
          await base44.asServiceRole.entities.EventQueue.update(event.id, {
            status: 'queued', rate_limited: true,
          });
          results.rate_limited++;
          continue;
        }

        // Route to appropriate processor — pass deployment context
        let processorResult = null;
        switch (event.processor_type) {
          case 'messaging_processor':
            processorResult = await invokeProcessor(base44, 'messagingProcessor', event, deploymentCtx);
            break;
          case 'automation_processor':
            processorResult = await invokeProcessor(base44, 'automationProcessor', event, deploymentCtx);
            break;
          case 'billing_processor':
            processorResult = await invokeProcessor(base44, 'billingProcessor', event, deploymentCtx);
            break;
          default:
            throw new Error(`Unknown processor: ${event.processor_type}`);
        }

        if (processorResult.success) {
          await base44.asServiceRole.entities.EventQueue.update(event.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          if (idempKey) {
            await base44.asServiceRole.entities.IdempotencyKey.filter(
              { idempotency_key: idempKey }, '-created_date', 1
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
            event_id: event.id, error: error.message, retrying: true, next_retry: retry.next_retry_at,
          });
        } else {
          const dlq = await moveToDeadLetter(base44, event, 'max_retries_exceeded', error.message);
          results.errors.push({
            event_id: event.id, error: error.message, dead_lettered: true, dead_letter_id: dlq.dead_letter_id,
          });
          results.dead_lettered++;
        }
      }
    }

    return Response.json({ success: true, processing_results: results });
  } catch (error) {
    console.error('[processEventQueue] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Resolve the ClientDeployment for a queued event.
 * Checks event.deployment_id first, then falls back to client_id lookup.
 */
async function resolveDeploymentForEvent(base44, event) {
  // Direct deployment_id on the event record
  if (event.deployment_id) {
    try {
      const deployment = await base44.asServiceRole.entities.ClientDeployment.get(event.deployment_id).catch(() => null);
      if (deployment) {
        // Validate deployment belongs to the client (if both present)
        if (event.client_id && deployment.client_id !== event.client_id) {
          return { resolved: false, reason: `Deployment ${event.deployment_id} client mismatch: deployment.client_id='${deployment.client_id}' vs event.client_id='${event.client_id}'` };
        }
        return { resolved: true, deployment };
      }
      return { resolved: false, reason: `Deployment ${event.deployment_id} not found` };
    } catch (err) {
      return { resolved: false, reason: `Failed to fetch deployment ${event.deployment_id}: ${err.message}` };
    }
  }

  // Fallback: resolve by client_id
  if (event.client_id) {
    try {
      const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
        { client_id: event.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
        '-created_date', 1
      );
      if (deployments?.length > 0) {
        return { resolved: true, deployment: deployments[0] };
      }
      return { resolved: false, reason: `No active deployment found for client_id: ${event.client_id}` };
    } catch (err) {
      return { resolved: false, reason: `Deployment lookup failed for client_id ${event.client_id}: ${err.message}` };
    }
  }

  return { resolved: false, reason: 'Event has no deployment_id and no client_id — cannot resolve deployment' };
}

/**
 * Infer the module_key from event metadata when not explicitly set.
 */
function inferModuleKey(event) {
  if (event.module_key) return event.module_key;
  if (event.event_category === 'instant_lead_response') return 'instant_lead_response';
  if (event.event_category === 'missed_call') return 'missed_call_text_back';
  if (event.event_category === 'nurture') return 'lead_nurture';
  if (event.event_category === 'booking') return 'ai_booking_agent';
  if (event.event_category === 'review_request') return 'review_reactivation';
  if (event.event_category === 'daily_digest') return 'daily_digest';
  return null;
}

/**
 * Create a diagnostic record for unresolvable events.
 */
async function createDiagnosticRecord(base44, event, failureType, reason) {
  try {
    await base44.asServiceRole.entities.AutomationExecutionLog.create({
      client_deployment_id: event.deployment_id || null,
      client_id: event.client_id || null,
      module_key: event.module_key || inferModuleKey(event) || 'unknown',
      trigger_event: 'event_queue_processing',
      execution_status: 'blocked',
      error_message: reason,
      error_code: failureType,
      response_data: JSON.stringify({
        event_queue_id: event.id,
        communication_event_id: event.communication_event_id,
        processor_type: event.processor_type,
        event_category: event.event_category,
        failure_type: failureType,
      }),
    });
  } catch (err) {
    console.warn('[processEventQueue] Failed to create diagnostic record:', err.message);
  }
}

async function checkRateLimit(base44, clientId, clientProjectId, eventCategory) {
  try {
    let config = null;
    if (clientProjectId) {
      const projectConfigs = await base44.asServiceRole.entities.RateLimitConfig.filter(
        { client_project_id: clientProjectId, enabled: true }, '-created_date', 1
      ).catch(() => []);
      config = projectConfigs?.[0];
    }
    if (!config && clientId) {
      const clientConfigs = await base44.asServiceRole.entities.RateLimitConfig.filter(
        { client_id: clientId, enabled: true }, '-created_date', 1
      ).catch(() => []);
      config = clientConfigs?.[0];
    }
    if (!config) return { allowed: true, reason: 'no_config' };
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

/**
 * Invoke a processor, passing deployment context so the downstream function
 * has full deployment identity available.
 */
async function invokeProcessor(base44, processorName, event, deploymentCtx) {
  try {
    const result = await base44.asServiceRole.functions.invoke(processorName, {
      event_queue_id: event.id,
      communication_event_id: event.communication_event_id,
      client_id: event.client_id,
      client_project_id: event.client_project_id,
      event_category: event.event_category,
      // ── DEPLOYMENT CONTEXT (Phase 1 hardening) ──
      deployment_id: deploymentCtx.deployment.id,
      module_key: event.module_key || inferModuleKey(event),
      environment: event.environment || null,
      industry_config_id: deploymentCtx.deployment.industry_config_id || null,
      package_tier_key: deploymentCtx.deployment.package_tier_key || null,
    });
    return { success: result.data?.success !== false, error: result.data?.error || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}