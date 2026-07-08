import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const deploymentLimit = Math.min(Math.max(Number(body.limit) || 200, 1), 500);
    const logLimit = Math.min(Math.max(Number(body.log_limit) || 500, 1), 1000);

    const deployments = await base44.asServiceRole.entities.ClientDeployment.list(
      '-created_date',
      deploymentLimit
    );

    const recentLogs = await base44.asServiceRole.entities.AutomationExecutionLog.filter(
      { execution_status: { $in: ['failed', 'blocked'] } },
      '-created_date',
      logLimit
    ).catch(() => []);

    const statsByDeployment: Record<string, any> = {};
    (recentLogs || []).forEach((log: any) => {
      const depId = log.client_deployment_id;
      if (!depId) return;
      if (!statsByDeployment[depId]) {
        statsByDeployment[depId] = { failed: 0, blocked: 0, lastExecution: null };
      }
      if (log.execution_status === 'failed') statsByDeployment[depId].failed++;
      if (log.execution_status === 'blocked') statsByDeployment[depId].blocked++;
      if (!statsByDeployment[depId].lastExecution || log.created_date > statsByDeployment[depId].lastExecution) {
        statsByDeployment[depId].lastExecution = log.created_date;
      }
    });

    return Response.json({
      success: true,
      deployments: deployments || [],
      executionStats: statsByDeployment,
      limits: {
        deployments: deploymentLimit,
        logs: logLimit,
      },
    });
  } catch (error: any) {
    console.error('[getDeploymentControlCenter]', error?.message || error);
    return Response.json(
      {
        success: false,
        error: 'Failed to load deployment control center',
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
});
