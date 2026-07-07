/**
 * deploymentObservability.ts — Shared observability integration for automation execution.
 *
 * Provides a single `observeAutomationExecution()` function that:
 *   1. Resolves the ClientDeployment for a given client_id
 *   2. Calls checkModulePermission to enforce package tier entitlements
 *   3. Returns deployment context (deploymentId, moduleKey, triggerEvent)
 *
 * The calling function is responsible for calling `logAutomationExecution`
 * after the automation attempt completes (success or failure).
 *
 * Usage:
 *   const ctx = await observeAutomationExecution(base44, {
 *     client_id: lead.client_id,
 *     module_key: 'instant_lead_response',
 *     trigger_event: 'lead_created',
 *     lead_id: lead.id,
 *   });
 *   if (ctx.blocked) {
 *     // Permission denied — do NOT execute. ctx has the blocked log already created.
 *     return;
 *   }
 *   // ... execute automation ...
 *   // ... then call logAutomationExecution with the result ...
 */

/**
 * Resolve the ClientDeployment for a client_id.
 * Returns the first active deployment found.
 */
export async function resolveDeployment(base44, clientId) {
  if (!clientId) return null;
  try {
    const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
      { client_id: clientId, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
      '-created_date',
      1
    );
    return deployments?.[0] || null;
  } catch (err) {
    console.warn('[deploymentObservability] resolveDeployment failed:', err.message);
    return null;
  }
}

/**
 * Check module permission via the checkModulePermission function.
 * Returns { authorized, reason } or { authorized: false, error } on failure.
 */
export async function checkPermission(base44, deploymentId, moduleKey) {
  try {
    const res = await base44.asServiceRole.functions.invoke('checkModulePermission', {
      deployment_id: deploymentId,
      module_key: moduleKey,
    });
    return {
      authorized: res.data?.authorized === true,
      reason: res.data?.reason || 'unknown',
      package_tier_key: res.data?.package_tier_key || null,
    };
  } catch (err) {
    console.warn('[deploymentObservability] checkModulePermission failed:', err.message);
    // FAIL-CLOSED: If the permission service is down, block automation rather than
    // risk executing a module the deployment may not be entitled to.
    return { authorized: false, reason: 'permission_check_failed_fail_closed', error: err.message };
  }
}

/**
 * Full observability entry point — resolves deployment + checks permission.
 * Returns a context object with deploymentId, clientId, moduleKey, triggerEvent,
 * and a `blocked` flag if permission was denied.
 *
 * If blocked, a log is automatically created via logAutomationExecution.
 */
export async function observeAutomationExecution(base44, params) {
  const { client_id, module_key, trigger_event, lead_id, conversation_id } = params;

  const deployment = await resolveDeployment(base44, client_id);

  // If no deployment found, return context with null deployment — caller decides
  if (!deployment) {
    return {
      deployment_id: null,
      client_id: client_id || null,
      module_key,
      trigger_event,
      lead_id: lead_id || null,
      conversation_id: conversation_id || null,
      blocked: false,
      blocked_reason: null,
      deployment,
    };
  }

  const deploymentId = deployment.id;
  const permResult = await checkPermission(base44, deploymentId, module_key);

  if (!permResult.authorized) {
    // Permission denied — log the block and return blocked context
    try {
      await base44.asServiceRole.functions.invoke('logAutomationExecution', {
        client_deployment_id: deploymentId,
        client_id: client_id || null,
        module_key,
        trigger_event,
        execution_status: 'blocked',
        error_message: `Module '${module_key}' is not authorized for this deployment (reason: ${permResult.reason})`,
        error_code: permResult.reason,
        lead_id: lead_id || null,
        conversation_id: conversation_id || null,
      });
    } catch (err) {
      console.warn('[deploymentObservability] Failed to log blocked execution:', err.message);
    }

    return {
      deployment_id: deploymentId,
      client_id: client_id || null,
      module_key,
      trigger_event,
      lead_id: lead_id || null,
      conversation_id: conversation_id || null,
      blocked: true,
      blocked_reason: permResult.reason,
      deployment,
    };
  }

  return {
    deployment_id: deploymentId,
    client_id: client_id || null,
    module_key,
    trigger_event,
    lead_id: lead_id || null,
    conversation_id: conversation_id || null,
    blocked: false,
    blocked_reason: null,
    deployment,
  };
}

/**
 * Log a completed automation execution (success or failure).
 * Thin wrapper around logAutomationExecution.
 */
export async function logExecution(base44, ctx, status, details = {}) {
  if (!ctx?.deployment_id) return; // No deployment — nothing to log

  try {
    await base44.asServiceRole.functions.invoke('logAutomationExecution', {
      client_deployment_id: ctx.deployment_id,
      client_id: ctx.client_id,
      module_key: ctx.module_key,
      trigger_event: ctx.trigger_event,
      execution_status: status,
      response_data: details.response_data || null,
      error_message: details.error_message || null,
      error_code: details.error_code || null,
      execution_time_ms: details.execution_time_ms || null,
      external_provider_reference: details.external_provider_reference || null,
      lead_id: ctx.lead_id || details.lead_id || null,
      conversation_id: ctx.conversation_id || details.conversation_id || null,
      started_at: details.started_at || null,
      completed_at: details.completed_at || null,
    });
  } catch (err) {
    console.warn('[deploymentObservability] logExecution failed:', err.message);
  }
}

/**
 * Trigger a health recalculation for a deployment.
 * Call after significant events (failures, recoveries).
 */
export async function triggerHealthCheck(base44, deploymentId) {
  if (!deploymentId) return;
  try {
    await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', {
      deployment_id: deploymentId,
    });
  } catch (err) {
    console.warn('[deploymentObservability] triggerHealthCheck failed:', err.message);
  }
}

// Minimal handler so this utility file is deployable and importable by other functions
Deno.serve(() => new Response("OK", { status: 200 }));