import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * getAutomationActivity — Admin automation observability endpoint.
 *
 * Queries AutomationExecutionLog with filters and joins with ClientDeployment
 * to provide enriched execution context (client, industry, package tier).
 *
 * Filters: client_id, industry_slug, module_key, execution_status, date_from, date_to
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
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
    } = body;

    // Build query filter
    const query = {};
    if (client_id) query.client_id = client_id;
    if (module_key) query.module_key = module_key;
    if (execution_status) query.execution_status = execution_status;
    if (deployment_id) query.client_deployment_id = deployment_id;
    if (date_from || date_to) {
      query.created_date = {};
      if (date_from) query.created_date.$gte = date_from;
      if (date_to) query.created_date.$lte = date_to;
    }

    // Fetch execution logs
    const logs = await base44.asServiceRole.entities.AutomationExecutionLog.filter(
      query,
      '-created_date',
      Math.min(limit, 200)
    );

    // Cache deployments to avoid duplicate lookups
    const deploymentCache = {};
    const enrichLog = async (log) => {
      const depId = log.client_deployment_id;
      if (!depId) return { ...log, deployment: null, industry_slug: null, package_tier_key: null };

      if (!deploymentCache[depId]) {
        try {
          const dep = await base44.asServiceRole.entities.ClientDeployment.get(depId);
          deploymentCache[depId] = dep || null;
        } catch {
          deploymentCache[depId] = null;
        }
      }

      const dep = deploymentCache[depId];
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
      };
    };

    // Enrich all logs (but filter by industry_slug if provided)
    let enriched = [];
    for (const log of logs) {
      const e = await enrichLog(log);
      if (industry_slug && e.industry_slug !== industry_slug) continue;
      enriched.push(e);
    }

    // Get summary stats
    const stats = {
      total: enriched.length,
      completed: enriched.filter(e => e.execution_status === 'completed').length,
      failed: enriched.filter(e => e.execution_status === 'failed').length,
      blocked: enriched.filter(e => e.execution_status === 'blocked').length,
      running: enriched.filter(e => e.execution_status === 'running' || e.execution_status === 'queued').length,
    };

    return Response.json({
      success: true,
      logs: enriched,
      stats,
      limit,
      skip,
    });
  } catch (error) {
    console.error('[getAutomationActivity]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});