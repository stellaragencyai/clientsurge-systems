import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function OrchestrationDashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    active_workflows: 0,
    completed_today: 0,
    duplicates_detected: 0,
    avg_execution_time: 0,
  });

  useEffect(() => {
    const loadWorkflows = async () => {
      setLoading(true);
      try {
        // Fetch active workflows
        const active = await base44.admin.entities.OrchestrationWorkflow.filter(
          { status: { $in: ['initiated', 'in_progress'] } },
          '-started_at',
          50
        ).catch(() => []);

        setWorkflows(active || []);

        // Calculate metrics
        const completed = await base44.admin.entities.OrchestrationWorkflow.filter(
          { status: 'completed' },
          '-completed_at',
          1000
        ).catch(() => []);

        const duplicates = await base44.admin.entities.IdempotencyKey.filter(
          { status: 'completed' },
          '-created_date',
          10000
        ).catch(() => []);

        setMetrics({
          active_workflows: active?.length || 0,
          completed_today: completed?.length || 0,
          duplicates_detected: duplicates?.filter(k => k.execution_count > 1).length || 0,
          avg_execution_time: 45, // Placeholder
        });
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
    const interval = setInterval(loadWorkflows, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Active Workflows</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.active_workflows}</p>
            </div>
            <Zap className="w-6 h-6 text-primary opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Completed Today</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.completed_today}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Duplicates Detected</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.duplicates_detected}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Avg Exec Time</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.avg_execution_time}ms</p>
            </div>
            <Clock className="w-6 h-6 text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>

      {/* Active Workflows */}
      <div>
        <h3 className="font-semibold mb-4">Active Workflows</h3>
        {workflows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No active workflows</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {workflow.workflow_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workflow.resource_type}: {workflow.resource_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      workflow.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                </div>

                {/* Execution Progress */}
                <div className="mt-3">
                  <div className="flex gap-1 mb-2">
                    {workflow.execution_order?.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-2 rounded-sm ${
                          stage.status === 'completed'
                            ? 'bg-green-500'
                            : stage.status === 'executing'
                            ? 'bg-blue-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current: <strong>{workflow.current_stage}</strong> •{' '}
                    {formatDistanceToNow(new Date(workflow.started_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}