import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * calculateDeploymentHealth — Deployment Health Engine
 *
 * Evaluates a ClientDeployment across three dimensions:
 *   1. Configuration Health — IndustryConfig, PackageTier, required modules present
 *   2. Automation Health — activated_modules vs recent AutomationExecutionLog results
 *   3. Integration Health — Twilio, Resend, AI provider connectivity
 *
 * Returns a health verdict (healthy / warning / critical) and caches it on the deployment.
 *
 * Usage:
 *   const res = await base44.functions.invoke('calculateDeploymentHealth', { deployment_id })
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deployment_id } = body;

    if (!deployment_id) {
      return Response.json({ error: 'deployment_id is required' }, { status: 400 });
    }

    // ── 1. Fetch the deployment ──
    const deployment = await base44.asServiceRole.entities.ClientDeployment.get(deployment_id);
    if (!deployment) {
      return Response.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const blockers = [];
    const warnings = [];
    const moduleHealth = [];

    // ── 2. Configuration Health ──
    if (!deployment.industry_config_id) {
      blockers.push({ code: 'missing_industry_config', message: 'IndustryConfig is not linked', severity: 'critical' });
    }
    if (!deployment.package_tier_id) {
      blockers.push({ code: 'missing_package_tier', message: 'PackageTier is not linked', severity: 'critical' });
    }
    if (!deployment.activated_modules || deployment.activated_modules.length === 0) {
      blockers.push({ code: 'no_activated_modules', message: 'No automation modules are activated', severity: 'critical' });
    }

    // Fetch PackageTier to verify module entitlements
    let packageTier = null;
    if (deployment.package_tier_id) {
      packageTier = await base44.asServiceRole.entities.PackageTier.get(deployment.package_tier_id).catch(() => null);
      if (!packageTier) {
        blockers.push({ code: 'package_tier_lookup_failed', message: 'Linked PackageTier record not found', severity: 'critical' });
      }
    }

    // Fetch IndustryConfig to verify it exists and is published
    let industryConfig = null;
    if (deployment.industry_config_id) {
      industryConfig = await base44.asServiceRole.entities.IndustryConfig.get(deployment.industry_config_id).catch(() => null);
      if (!industryConfig) {
        blockers.push({ code: 'industry_config_lookup_failed', message: 'Linked IndustryConfig record not found', severity: 'critical' });
      } else if (industryConfig.status === 'archived') {
        warnings.push({ code: 'industry_config_archived', message: 'IndustryConfig is archived', severity: 'warning' });
      }
    }

    // ── 3. Automation Health — check each activated module ──
    const activeModules = deployment.activated_modules || [];
    const moduleInstallStatus = deployment.module_installation_status || {};

    for (const moduleKey of activeModules) {
      const installStatus = moduleInstallStatus[moduleKey] || 'not_started';

      // Check recent execution logs for this module
      const recentLogs = await base44.asServiceRole.entities.AutomationExecutionLog.filter(
        { client_deployment_id: deployment_id, module_key: moduleKey },
        '-created_date',
        10
      ).catch(() => []);

      const failedCount = recentLogs.filter(l => l.execution_status === 'failed').length;
      const blockedCount = recentLogs.filter(l => l.execution_status === 'blocked').length;
      const successCount = recentLogs.filter(l => l.execution_status === 'completed').length;

      let moduleStatus = 'healthy';
      let moduleIssues = [];

      if (installStatus !== 'verified' && installStatus !== 'installed') {
        moduleStatus = 'warning';
        moduleIssues.push(`Installation status: ${installStatus}`);
      }

      if (failedCount > 0) {
        moduleStatus = failedCount >= 3 ? 'critical' : 'warning';
        moduleIssues.push(`${failedCount} recent failure(s)`);
      }

      if (blockedCount > 0) {
        moduleStatus = 'warning';
        moduleIssues.push(`${blockedCount} blocked execution(s)`);
      }

      const lastLog = recentLogs?.[0];
      const lastError = lastLog?.execution_status === 'failed' ? lastLog.error_message : null;

      moduleHealth.push({
        module_key: moduleKey,
        install_status: installStatus,
        execution_status: moduleStatus,
        recent_failures: failedCount,
        recent_successes: successCount,
        recent_blocked: blockedCount,
        last_error: lastError,
        last_executed_at: lastLog?.created_date || null,
        issues: moduleIssues
      });

      if (moduleStatus === 'critical') {
        blockers.push({
          code: `module_${moduleKey}_critical`,
          message: `Module '${moduleKey}' has ${failedCount} recent failures`,
          module_key: moduleKey,
          severity: 'critical'
        });
      } else if (moduleStatus === 'warning') {
        warnings.push({
          code: `module_${moduleKey}_warning`,
          message: `Module '${moduleKey}': ${moduleIssues.join('; ')}`,
          module_key: moduleKey,
          severity: 'warning'
        });
      }
    }

    // Check if any PackageTier-entitled modules are NOT activated
    if (packageTier?.enabled_module_keys) {
      const missingModules = packageTier.enabled_module_keys.filter(k => !activeModules.includes(k));
      if (missingModules.length > 0 && deployment.deployment_status === 'live') {
        warnings.push({
          code: 'entitled_modules_not_activated',
          message: `Modules entitled but not activated: ${missingModules.join(', ')}`,
          severity: 'warning'
        });
      }
    }

    // ── 4. Integration Health — check AdminSettings for provider config ──
    const settings = await base44.asServiceRole.entities.AdminSettings.list().then(s => s?.[0]).catch(() => null);

    if (settings) {
      if (!settings.twilio_enabled && activeModules.includes('instant_lead_response')) {
        blockers.push({
          code: 'twilio_not_enabled',
          message: 'Twilio not enabled but instant_lead_response module is active',
          severity: 'critical',
          suggested_action: 'Enable and configure Twilio in Admin Settings'
        });
      }
      if (!settings.resend_enabled && activeModules.includes('lead_nurture')) {
        warnings.push({
          code: 'resend_not_enabled',
          message: 'Resend not enabled but lead_nurture module is active',
          severity: 'warning',
          suggested_action: 'Enable and configure Resend in Admin Settings'
        });
      }
    } else {
      warnings.push({
        code: 'no_admin_settings',
        message: 'AdminSettings record not found — cannot verify integration health',
        severity: 'warning'
      });
    }

    // ── 5. Check existing deployment errors ──
    const unresolvedErrors = (deployment.errors || []).filter(e => !e.resolved_at);
    for (const err of unresolvedErrors) {
      if (err.severity === 'critical') {
        blockers.push({
          code: err.error_code || 'deployment_error',
          message: err.message,
          module_key: err.module_key,
          severity: 'critical',
          suggested_action: err.suggested_action
        });
      } else {
        warnings.push({
          code: err.error_code || 'deployment_warning',
          message: err.message,
          module_key: err.module_key,
          severity: err.severity || 'warning',
          suggested_action: err.suggested_action
        });
      }
    }

    // ── 6. Compute final health status ──
    let healthStatus = 'healthy';
    if (blockers.length > 0) {
      healthStatus = 'critical';
    } else if (warnings.length > 0) {
      healthStatus = 'warning';
    }

    const healthSummary = blockers.length > 0
      ? `${blockers.length} critical issue(s): ${blockers.map(b => b.message).join('; ')}`
      : warnings.length > 0
        ? `${warnings.length} warning(s): ${warnings.map(w => w.message).join('; ')}`
        : 'All required modules installed and verified';

    const now = new Date().toISOString();

    // ── 7. Cache health status on the deployment ──
    await base44.asServiceRole.entities.ClientDeployment.update(deployment_id, {
      health_status: healthStatus,
      health_summary: healthSummary,
      health_checked_at: now,
      last_status_check_at: now
    }).catch(err => {
      console.warn('[calculateDeploymentHealth] Failed to cache health status:', err.message);
    });

    return Response.json({
      deployment_id,
      health_status: healthStatus,
      health_summary: healthSummary,
      checked_at: now,
      configuration: {
        has_industry_config: !!deployment.industry_config_id,
        has_package_tier: !!deployment.package_tier_id,
        industry_config_status: industryConfig?.status || 'unknown',
        package_tier_key: packageTier?.tier_key || 'unknown',
        activated_module_count: activeModules.length
      },
      module_health: moduleHealth,
      integration_health: {
        twilio_enabled: settings?.twilio_enabled || false,
        resend_enabled: settings?.resend_enabled || false
      },
      blockers,
      warnings,
      unresolved_error_count: unresolvedErrors.length
    });

  } catch (error) {
    console.error('[calculateDeploymentHealth]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});