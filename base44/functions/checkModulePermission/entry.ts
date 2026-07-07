import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * checkModulePermission — Permission enforcement service for the Vertical AI Growth System.
 *
 * Validates whether a ClientDeployment is authorized to execute a given AutomationModule.
 * This is the backend enforcement layer — frontend hiding is NOT sufficient.
 *
 * Required checks (all must pass):
 *   1. Deployment exists
 *   2. Deployment belongs to the client (if client_id provided)
 *   3. Deployment status allows execution
 *   4. Package tier allows module
 *   5. Module exists and is enabled
 *   6. Environment is valid (if environment provided)
 *
 * Every check result is logged to AutomationExecutionLog for audit trail.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deployment_id, module_key, client_id, environment } = body;

    if (!deployment_id || !module_key) {
      return Response.json(
        { error: 'deployment_id and module_key are required' },
        { status: 400 }
      );
    }

    const checkedAt = new Date().toISOString();

    // ── CHECK 1: Find the ClientDeployment ──
    const deployment = await base44.asServiceRole.entities.ClientDeployment.get(deployment_id).catch(() => null);
    if (!deployment) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: client_id || null,
        authorized: false, reason: 'deployment_not_found',
        deployment_status: null, checked_at: checkedAt,
      });
      return Response.json({
        authorized: false,
        reason: 'deployment_not_found',
        deployment_status: null,
        module_key,
        checked_at: checkedAt,
        message: `No ClientDeployment found with id: ${deployment_id}`
      }, { status: 404 });
    }

    // ── CHECK 2: Deployment belongs to the client (if client_id provided) ──
    if (client_id && deployment.client_id !== client_id) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: client_id || null,
        authorized: false, reason: 'deployment_client_mismatch',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
        error_message: `Deployment client_id '${deployment.client_id}' does not match requested client_id '${client_id}'`,
      });
      return Response.json({
        authorized: false,
        reason: 'deployment_client_mismatch',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `Deployment does not belong to client_id: ${client_id}`
      }, { status: 403 });
    }

    // ── CHECK 3: Deployment status allows execution ──
    const EXECUTION_BLOCKED_STATUSES = ['paused', 'cancelled', 'error'];
    if (EXECUTION_BLOCKED_STATUSES.includes(deployment.deployment_status)) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: deployment.client_id,
        authorized: false, reason: 'deployment_status_blocked',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
        error_message: `Deployment status '${deployment.deployment_status}' blocks automation execution`,
      });
      return Response.json({
        authorized: false,
        reason: 'deployment_status_blocked',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `Deployment status '${deployment.deployment_status}' does not allow execution`
      }, { status: 403 });
    }

    // ── CHECK 4: Find the PackageTier and verify module inclusion ──
    const packageTier = await base44.asServiceRole.entities.PackageTier.get(deployment.package_tier_id);
    if (!packageTier) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: deployment.client_id,
        authorized: false, reason: 'package_tier_not_found',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
      });
      return Response.json({
        authorized: false,
        reason: 'package_tier_not_found',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `No PackageTier found with id: ${deployment.package_tier_id}`
      }, { status: 404 });
    }

    const tierHasModule = packageTier.enabled_module_keys?.includes(module_key);

    // ── CHECK 5: Confirm AutomationModule exists and is enabled ──
    const modules = await base44.asServiceRole.entities.AutomationModule.filter({
      module_key: module_key
    });
    const automationModule = modules?.[0];

    if (!automationModule) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: deployment.client_id,
        authorized: false, reason: 'module_not_found',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
      });
      return Response.json({
        authorized: false,
        reason: 'module_not_found',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `AutomationModule not found: ${module_key}`
      }, { status: 404 });
    }

    if (automationModule.status === 'deprecated') {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: deployment.client_id,
        authorized: false, reason: 'module_deprecated',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
      });
      return Response.json({
        authorized: false,
        reason: 'module_deprecated',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `Module ${module_key} is deprecated`
      });
    }

    // ── CHECK 6: Environment validation (if provided) ──
    const VALID_ENVIRONMENTS = ['production', 'qa', 'smoke', 'demo', 'internal'];
    if (environment && !VALID_ENVIRONMENTS.includes(environment)) {
      await logPermissionCheck(base44, {
        deployment_id, module_key, client_id: deployment.client_id,
        authorized: false, reason: 'invalid_environment',
        deployment_status: deployment.deployment_status, checked_at: checkedAt,
        error_message: `Unknown environment: ${environment}`,
      });
      return Response.json({
        authorized: false,
        reason: 'invalid_environment',
        deployment_status: deployment.deployment_status,
        module_key,
        checked_at: checkedAt,
        message: `Invalid environment: ${environment}. Valid: ${VALID_ENVIRONMENTS.join(', ')}`
      }, { status: 400 });
    }

    // ── FINAL EVALUATION ──
    const moduleEnabled = automationModule.status === 'enabled';
    const authorized = tierHasModule === true && moduleEnabled;

    const finalReason = authorized ? 'authorized' : (
      !tierHasModule ? 'module_not_in_tier' : 'module_not_enabled'
    );

    // ── LOG PERMISSION CHECK RESULT ──
    await logPermissionCheck(base44, {
      deployment_id, module_key, client_id: deployment.client_id,
      authorized, reason: finalReason,
      deployment_status: deployment.deployment_status, checked_at: checkedAt,
      error_message: authorized ? null : `Module '${module_key}' denied for tier '${packageTier.tier_key}'`,
    });

    return Response.json({
      authorized,
      deployment_id: deployment.id,
      module_key: module_key,
      deployment_status: deployment.deployment_status,
      package_tier_key: packageTier.tier_key,
      package_tier_name: packageTier.name,
      module_display_name: automationModule.display_name,
      module_status: automationModule.status,
      checked_at: checkedAt,
      reason: finalReason,
      message: authorized
        ? `Module '${module_key}' is authorized for ${packageTier.tier_key} tier`
        : `Module '${module_key}' is NOT authorized for ${packageTier.tier_key} tier`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Log every permission check to AutomationExecutionLog for audit trail.
 * Even denied checks are logged so admins can see permission enforcement activity.
 */
async function logPermissionCheck(base44, params) {
  try {
    await base44.asServiceRole.entities.AutomationExecutionLog.create({
      client_deployment_id: params.deployment_id,
      client_id: params.client_id || null,
      module_key: params.module_key,
      trigger_event: 'permission_check',
      execution_status: params.authorized ? 'completed' : 'blocked',
      error_message: params.error_message || null,
      error_code: params.authorized ? null : params.reason,
      started_at: params.checked_at,
      completed_at: params.checked_at,
    });
  } catch (err) {
    console.warn('[checkModulePermission] Failed to log permission check:', err.message);
  }
}