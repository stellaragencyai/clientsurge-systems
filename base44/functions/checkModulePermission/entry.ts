import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * checkModulePermission — Permission enforcement service for the Vertical AI Growth System.
 *
 * Validates whether a ClientDeployment is authorized to execute a given AutomationModule.
 * This is the backend enforcement layer — frontend hiding is NOT sufficient.
 *
 * Logic:
 *   1. Find ClientDeployment by deploymentId
 *   2. Find PackageTier linked to that deployment
 *   3. Check if requested module_key exists in PackageTier.enabled_module_keys
 *   4. Confirm AutomationModule exists and is enabled
 *   5. Return permission result with metadata
 *
 * Usage:
 *   Frontend:  const res = await base44.functions.invoke('checkModulePermission', { deployment_id, module_key })
 *   Backend:    Directly invoke or inline the logic
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deployment_id, module_key } = body;

    if (!deployment_id || !module_key) {
      return Response.json(
        { error: 'deployment_id and module_key are required' },
        { status: 400 }
      );
    }

    // Step 1: Find the ClientDeployment
    const deployment = await base44.asServiceRole.entities.ClientDeployment.get(deployment_id);
    if (!deployment) {
      return Response.json({
        authorized: false,
        reason: 'deployment_not_found',
        message: `No ClientDeployment found with id: ${deployment_id}`
      }, { status: 404 });
    }

    // Step 2: Find the PackageTier
    const packageTier = await base44.asServiceRole.entities.PackageTier.get(deployment.package_tier_id);
    if (!packageTier) {
      return Response.json({
        authorized: false,
        reason: 'package_tier_not_found',
        message: `No PackageTier found with id: ${deployment.package_tier_id}`
      }, { status: 404 });
    }

    // Step 3: Check if module_key is in the tier's enabled_module_keys
    const tierHasModule = packageTier.enabled_module_keys?.includes(module_key);

    // Step 4: Confirm AutomationModule exists and is enabled
    const modules = await base44.asServiceRole.entities.AutomationModule.filter({
      module_key: module_key
    });
    const automationModule = modules?.[0];

    if (!automationModule) {
      return Response.json({
        authorized: false,
        reason: 'module_not_found',
        message: `AutomationModule not found: ${module_key}`
      }, { status: 404 });
    }

    if (automationModule.status === 'deprecated') {
      return Response.json({
        authorized: false,
        reason: 'module_deprecated',
        message: `Module ${module_key} is deprecated`
      });
    }

    // Step 5: Evaluate final permission
    const authorized = tierHasModule === true && automationModule.status === 'enabled';

    return Response.json({
      authorized,
      deployment_id: deployment.id,
      module_key: module_key,
      package_tier_key: packageTier.tier_key,
      package_tier_name: packageTier.name,
      module_display_name: automationModule.display_name,
      module_status: automationModule.status,
      reason: authorized ? 'authorized' : (
        !tierHasModule ? 'module_not_in_tier' : 'module_not_enabled'
      ),
      message: authorized
        ? `Module '${module_key}' is authorized for ${packageTier.tier_key} tier`
        : `Module '${module_key}' is NOT authorized for ${packageTier.tier_key} tier`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});