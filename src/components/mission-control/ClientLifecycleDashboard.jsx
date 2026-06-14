import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { CheckCircle2, Circle, AlertCircle, Clock, Zap } from 'lucide-react';

const LIFECYCLE_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  setup_in_progress: 'bg-blue-100 text-blue-700',
  testing: 'bg-purple-100 text-purple-700',
  live: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
};

const LIFECYCLE_ICONS = {
  pending: <Circle className="w-4 h-4" />,
  setup_in_progress: <Clock className="w-4 h-4" />,
  testing: <Zap className="w-4 h-4" />,
  live: <CheckCircle2 className="w-4 h-4" />,
  suspended: <AlertCircle className="w-4 h-4" />,
};

export default function ClientLifecycleDashboard() {
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrideClient, setOverrideClient] = useState(null);
  const [overrideStage, setOverrideStage] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getClientLifecycleDashboard', {});
      setDashboard(response.data.dashboard || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (clientId) => {
    if (!overrideStage) return;

    try {
      await base44.functions.invoke('manageClientLifecycle', {
        client_id: clientId,
        action: 'override',
        target_stage: overrideStage,
        admin_email: 'admin@clientsurge.io', // In real app, get from auth
      });

      setOverrideClient(null);
      setOverrideStage('');
      fetchDashboard();
    } catch (error) {
      console.error('Error overriding lifecycle:', error);
    }
  };

  const handleClearOverride = async (clientId) => {
    try {
      await base44.functions.invoke('manageClientLifecycle', {
        client_id: clientId,
        action: 'clear_override',
      });
      fetchDashboard();
    } catch (error) {
      console.error('Error clearing override:', error);
    }
  };

  if (loading) {
    return <div className="h-64 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        {Object.keys(LIFECYCLE_COLORS).map(stage => {
          const count = dashboard.filter(c => (c.lifecycle_stage === stage)).length;
          return (
            <div key={stage} className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                {LIFECYCLE_ICONS[stage]}
                <span className="text-sm font-semibold capitalize">{stage.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Clients Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Lifecycle</th>
                <th className="px-4 py-3 text-left font-semibold">Project Status</th>
                <th className="px-4 py-3 text-left font-semibold">Setup Progress</th>
                <th className="px-4 py-3 text-left font-semibold">Workflow Stage</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dashboard.map((client, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{client.business_name}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${LIFECYCLE_COLORS[client.lifecycle_stage]}`}>
                        {LIFECYCLE_ICONS[client.lifecycle_stage]}
                        {client.lifecycle_stage.replace(/_/g, ' ')}
                      </div>
                      {client.is_override && (
                        <span className="text-xs text-orange-600 font-semibold">Override</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{client.project_status}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-xs font-medium">
                        {client.setup_steps_completed}/{client.setup_steps_total} steps
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${client.setup_completion_percent}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">{client.setup_completion_percent}%</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {client.workflow_stage}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {client.is_override ? (
                        <button
                          onClick={() => handleClearOverride(client.client_id)}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                        >
                          Clear Override
                        </button>
                      ) : (
                        <button
                          onClick={() => setOverrideClient(client.client_id)}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                        >
                          Override
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold">Override Lifecycle Stage</h2>
            <select
              value={overrideStage}
              onChange={(e) => setOverrideStage(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="">Select stage...</option>
              <option value="pending">Pending</option>
              <option value="setup_in_progress">Setup In Progress</option>
              <option value="testing">Testing</option>
              <option value="live">Live</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setOverrideClient(null);
                  setOverrideStage('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverride(overrideClient)}
                disabled={!overrideStage}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}