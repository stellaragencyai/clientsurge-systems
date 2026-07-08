import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function secureJson(data = {}, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function adminAllowed(user) {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function dateMs(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : 0;
}

function latestLogTimestamp(logs = []) {
  const latest = logs.reduce((max, log) => Math.max(max, dateMs(log.created_date || log.updated_date)), 0);
  return latest ? new Date(latest).toISOString() : null;
}

function executionSummary(logs = []) {
  return {
    total: logs.length,
    completed: logs.filter((log) => log.execution_status === 'completed').length,
    failed: logs.filter((log) => log.execution_status === 'failed').length,
    blocked: logs.filter((log) => log.execution_status === 'blocked').length,
    running: logs.filter((log) => log.execution_status === 'running' || log.execution_status === 'queued').length,
    unknown: logs.filter((log) => !log.execution_status).length,
  };
}

Deno.serve(async (req) => {
  const requestId = `activity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    if (req.method !== 'POST') {
      return secureJson(
        { error: 'Method not allowed', code: 'method_not_allowed', request_id: requestId },
        { status: 405, headers: { Allow: 'POST' } }
      );
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return secureJson({ error: 'Unauthorized', code: 'unauthorized', request_id: requestId }, { status: 401 });
    if (!adminAllowed(user)) {
      return secureJson({ error: 'Admin access required', code: 'admin_required', request_id: requestId }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      client_id,
      industry_slug,
      module_key,
      execution_status,
      deployment_id,
      date_from,
      date_to,
      limit = 100,
      skip = 0,
    } = body || {};

    const query = {};
    if (client_id) query.client_id = String(client_id);
    if (module_key) query.module_key = String(module_key);
    if (execution_status) query.execution_status = String(execution_status);
    if (deployment_id) query.client_deployment_id = String(deployment_id);
    if (date_from || date_to) {
      query.created_date = {};
      if (date_from) query.created_date.$gte = date_from;
      if (date_to) query.created_date.$lte = date_to;
    }

    let logs = [];
    let logQueryWarning = null;
    try {
      logs = await base44.asServiceRole.entities.AutomationExecutionLog.filter(
        query,
        '-created_date',
        Math.min(Number(limit) || 100, 200)
      );
    } catch (error) {
      logQueryWarning = `AutomationExecutionLog query failed: ${error?.message || String(error)}`;
      logs = [];
    }

    const deploymentCache = {};
    let deployment_lookup_failures = 0;
    let logs_without_deployment_id = 0;
    let orphaned_deployment_logs = 0;

    const enrichLog = async (log) => {
      const depId = log.client_deployment_id;
      if (!depId) {
        logs_without_deployment_id += 1;
        return { ...log, deployment: null, industry_slug: null, package_tier_key: null, observability_note: 'No client_deployment_id on execution log' };
      }

      if (!Object.prototype.hasOwnProperty.call(deploymentCache, depId)) {
        try {
          const dep = await base44.asServiceRole.entities.ClientDeployment.get(depId);
          deploymentCache[depId] = dep || null;
        } catch {
          deployment_lookup_failures += 1;
          deploymentCache[depId] = null;
        }
      }

      const dep = deploymentCache[depId];
      if (!dep) orphaned_deployment_logs += 1;

      return {
        ...log,
        deployment: dep ? {
          id: dep.id,
          deployment_status: dep.deployment_status,
          health_status: dep.health_status,
          industry_slug: dep.industry_slug,
          package_tier_key: dep.package_tier_key,
          activated_modules: dep.activated_modules,
        } : null,
        industry_slug: dep?.industry_slug || null,
        package_tier_key: dep?.package_tier_key || null,
        observability_note: dep ? null : 'Deployment record not found for execution log',
      };
    };

    let enriched = [];
    for (const log of logs || []) {
      const enrichedLog = await enrichLog(log);
      if (industry_slug && enrichedLog.industry_slug !== industry_slug) continue;
      enriched.push(enrichedLog);
    }

    const stats = executionSummary(enriched);
    const activeFilters = Object.fromEntries(
      Object.entries({ client_id, industry_slug, module_key, execution_status, deployment_id, date_from, date_to })
        .filter(([, value]) => value)
    );

    const dataCoverage = {
      queried_at: new Date().toISOString(),
      request_id: requestId,
      logs_queried: !logQueryWarning,
      sampled_log_count: enriched.length,
      raw_log_count_before_industry_filter: logs.length,
      last_log_at: latestLogTimestamp(enriched),
      active_filters: activeFilters,
      deployment_lookup_failures,
      logs_without_deployment_id,
      orphaned_deployment_logs,
      warning: logQueryWarning,
      proof_label: 'AutomationExecutionLog sample only — not live provider proof',
    };

    const warnings = [
      logQueryWarning,
      enriched.length === 0 ? 'No execution logs found for the current filters. This is unknown coverage, not proof that automations are healthy.' : null,
      logs_without_deployment_id ? `${logs_without_deployment_id} execution log(s) have no client_deployment_id.` : null,
      orphaned_deployment_logs ? `${orphaned_deployment_logs} execution log(s) point to a missing ClientDeployment.` : null,
      deployment_lookup_failures ? `${deployment_lookup_failures} deployment lookup(s) failed.` : null,
    ].filter(Boolean);

    return secureJson({
      success: true,
      request_id: requestId,
      logs: enriched,
      stats,
      limit,
      skip,
      data_coverage: dataCoverage,
      coverage_warnings: warnings,
    });
  } catch (error) {
    console.error('[getAutomationActivity]', error.message);
    return secureJson({ error: error.message || 'Failed to load automation activity', request_id: requestId }, { status: 500 });
  }
});
