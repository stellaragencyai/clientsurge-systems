import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StageIndicator({ stage }) {
  const stages = {
    intake_received: { label: 'Intake', color: 'bg-blue-100 text-blue-700' },
    setup_in_progress: { label: 'Setup', color: 'bg-amber-100 text-amber-700' },
    testing: { label: 'Testing', color: 'bg-purple-100 text-purple-700' },
    awaiting_client_approval: { label: 'Approval', color: 'bg-cyan-100 text-cyan-700' },
    live: { label: 'Live', color: 'bg-green-100 text-green-700' },
    blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' },
    unknown: { label: 'Unknown', color: 'bg-gray-100 text-gray-600' },
  };

  const s = stages[stage] || stages.unknown;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function HealthBadge({ status }) {
  const colors = {
    on_track: 'bg-green-50 text-green-700 border-green-200',
    delayed: 'bg-amber-50 text-amber-700 border-amber-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold ${colors[status] || 'bg-gray-50'}`}>
      {status === 'on_track' && <CheckCircle2 className="w-3.5 h-3.5" />}
      {status === 'delayed' && <Clock className="w-3.5 h-3.5" />}
      {status === 'blocked' && <AlertCircle className="w-3.5 h-3.5" />}
      {status === 'on_track' && 'On Track'}
      {status === 'delayed' && 'Delayed'}
      {status === 'blocked' && 'Blocked'}
    </div>
  );
}

function ProgressBar({ percentage }) {
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${percentage}%`,
          background: percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
        }}
      />
    </div>
  );
}

function BlockerItem({ blocker }) {
  const severityColors = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    high: 'bg-orange-50 border-orange-200 text-orange-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`rounded-lg border p-3 text-sm ${severityColors[blocker.severity] || 'bg-gray-50'}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">{blocker.code}</p>
          <p className="text-xs mt-0.5 opacity-90">{blocker.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function ClientLifecyclePanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPlatformClientsOverview', {});
      setClients(res?.data?.clients || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const [lifecycleData, setLifecycleData] = useState({});

  useEffect(() => {
    // Load lifecycle progress for visible clients
    const loadLifecycleData = async () => {
      const data = {};
      for (const client of clients.slice(0, 10)) {
        try {
          const res = await base44.functions.invoke('computeClientLifecycleProgress', {
            client_id: client.client_id,
          });
          data[client.client_id] = res?.data;
        } catch (e) {
          console.error('Failed to load lifecycle data:', e);
        }
      }
      setLifecycleData(data);
    };

    if (clients.length > 0) {
      loadLifecycleData();
    }
  }, [clients]);

  const filteredClients = clients.filter(c => {
    if (search && !c.business_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'on_track' && lifecycleData[c.client_id]?.progress?.setup_health_status !== 'on_track') return false;
    if (filter === 'delayed' && lifecycleData[c.client_id]?.progress?.setup_health_status !== 'delayed') return false;
    if (filter === 'blocked' && lifecycleData[c.client_id]?.progress?.setup_health_status !== 'blocked') return false;
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading client lifecycle data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Client Lifecycle Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Progress, blockers, and next steps per client</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by business name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm flex-1 min-w-[180px]"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium bg-white cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="on_track">On Track</option>
          <option value="delayed">Delayed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Client Cards */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground rounded-lg border border-border">
            No clients match your filters
          </div>
        ) : (
          filteredClients.slice(0, 25).map(client => {
            const lifecycle = lifecycleData[client.client_id];
            const progress = lifecycle?.progress || {};
            const blockers = lifecycle?.blockers || [];

            return (
              <div key={client.client_id} className="rounded-lg border border-border bg-white p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-lg">{client.business_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageIndicator stage={progress.lifecycle_stage || client.workspace_status} />
                    <HealthBadge status={progress.setup_health_status || 'on_track'} />
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Onboarding</p>
                    <div className="space-y-1">
                      <ProgressBar percentage={progress.onboarding_completion_percentage || 0} />
                      <p className="text-xs text-muted-foreground">{progress.onboarding_completion_percentage || 0}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Checklist</p>
                    <div className="space-y-1">
                      <ProgressBar percentage={progress.checklist_completion_percentage || 0} />
                      <p className="text-xs text-muted-foreground">{progress.checklist_completion_percentage || 0}%</p>
                    </div>
                  </div>
                </div>

                {/* Next Step */}
                {lifecycle?.next_step && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 flex items-start gap-2">
                    <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 font-semibold">{lifecycle.next_step}</p>
                  </div>
                )}

                {/* Blockers */}
                {blockers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Blockers ({blockers.length})</p>
                    <div className="space-y-2">
                      {blockers.slice(0, 3).map((b, idx) => (
                        <BlockerItem key={idx} blocker={b} />
                      ))}
                      {blockers.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{blockers.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>Plan: <span className="font-semibold capitalize">{client.plan_type}</span></p>
                  <p>Leads: <span className="font-semibold">{client.leads_total}</span></p>
                  <p>Health Score: <span className="font-semibold">{client.health_score}</span></p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}