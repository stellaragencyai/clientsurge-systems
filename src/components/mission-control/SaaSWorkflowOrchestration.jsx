import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const STAGE_COLORS = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
};

const STAGE_ICONS = {
  not_started: <Circle className="w-4 h-4" />,
  in_progress: <AlertCircle className="w-4 h-4" />,
  complete: <CheckCircle2 className="w-4 h-4" />,
};

export default function SaaSWorkflowOrchestration() {
  const [orchestration, setOrchestration] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, not_started, in_progress, complete

  useEffect(() => {
    fetchOrchestrationStatus();
  }, []);

  const fetchOrchestrationStatus = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getWorkflowOrchestrationStatus', {});
      setOrchestration(response.data.orchestration_status || []);
    } catch (error) {
      console.error('Error fetching orchestration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrchestration = orchestration.filter(item => {
    if (filter === 'all') return true;
    return item.workflow_status === filter;
  });

  if (loading) {
    return <div className="h-64 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['not_started', 'in_progress', 'complete'].map(status => {
          const count = orchestration.filter(o => o.workflow_status === status).length;
          return (
            <div key={status} className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                {STAGE_ICONS[status]}
                <span className="text-sm font-semibold capitalize">{status.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
        <div className="p-4 rounded-lg border border-border bg-primary/5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Total Orders</span>
          </div>
          <div className="text-2xl font-bold">{orchestration.length}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'not_started', 'in_progress', 'complete'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'border border-border hover:bg-muted'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Workflow Cards */}
      <div className="space-y-3">
        {filteredOrchestration.map((item, idx) => (
          <div key={idx} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="font-semibold">{item.customer.business_name}</div>
                <div className="text-xs text-muted-foreground">{item.customer.email}</div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${STAGE_COLORS[item.workflow_status]}`}>
                {STAGE_ICONS[item.workflow_status]}
                {item.workflow_status.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Workflow Progression */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Order: {item.order_id.slice(0, 8)}...</div>
                <div className="text-xs text-muted-foreground">
                  Status: {item.order_status.replace(/_/g, ' ')} • Pipeline: {item.pipeline_status}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{item.workflow_completion}% Complete</div>
                <div className="w-48 bg-border rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.workflow_completion}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Entity Linkage Flow */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-muted-foreground mb-2">Orchestration Chain:</div>
              
              {/* Order → Client */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-center">Order ✓</div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex-1">
                  {item.linked_entities.client ? (
                    <span className="text-green-700 font-semibold">
                      Client ({item.linked_entities.client.lifecycle_stage})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Client (pending)</span>
                  )}
                </div>
              </div>

              {/* Client → ClientProject */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-right">
                  {item.linked_entities.client ? <span className="text-green-700">✓</span> : <span className="text-gray-400">○</span>}
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex-1">
                  {item.linked_entities.client_project ? (
                    <span className="text-green-700 font-semibold">
                      ClientProject ({item.linked_entities.client_project.setup_completion_percent}%)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">ClientProject (pending)</span>
                  )}
                </div>
              </div>

              {/* ClientProject → Subscription */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-right">
                  {item.linked_entities.client_project ? <span className="text-green-700">✓</span> : <span className="text-gray-400">○</span>}
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex-1">
                  {item.linked_entities.subscription ? (
                    <span className="text-green-700 font-semibold">
                      Subscription ({item.linked_entities.subscription.status})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Subscription (pending)</span>
                  )}
                </div>
              </div>

              {/* Subscription → ClientInstallationOS */}
              <div className="flex items-center gap-2">
                <div className="w-20 text-right">
                  {item.linked_entities.subscription ? <span className="text-green-700">✓</span> : <span className="text-gray-400">○</span>}
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <div className="flex-1">
                  {item.linked_entities.installation_os ? (
                    <span className="text-green-700 font-semibold">
                      InstallationOS ({item.linked_entities.installation_os.workflow_stage})
                    </span>
                  ) : (
                    <span className="text-muted-foreground">InstallationOS (pending)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrchestration.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No orchestrations found for this filter</p>
        </div>
      )}
    </div>
  );
}