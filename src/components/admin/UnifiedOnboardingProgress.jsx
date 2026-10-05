import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, Zap, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STAGE_COLORS = {
  intake_received: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Intake Received' },
  setup_in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Setup In Progress' },
  testing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Testing' },
  awaiting_client_approval: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Awaiting Approval' },
  live: { bg: 'bg-green-100', text: 'text-green-700', label: 'Live' },
  blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocked' },
};

const STAGE_SEQUENCE = [
  'intake_received',
  'setup_in_progress',
  'testing',
  'awaiting_client_approval',
  'live',
];

function StageProgressBar({ currentStage }) {
  const currentIndex = STAGE_SEQUENCE.indexOf(currentStage);
  const progressPercent = currentIndex >= 0 ? ((currentIndex + 1) / STAGE_SEQUENCE.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
        <span className="text-sm font-bold text-foreground">{Math.round(progressPercent)}%</span>
      </div>
      <div className="flex items-center gap-1">
        {STAGE_SEQUENCE.map((stage, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-2 rounded-full transition-all ${
                  isComplete ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span className="text-[10px] font-bold text-muted-foreground text-center whitespace-nowrap">
                {stage.split('_')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OnboardingCard({ orch }) {
  if (!orch) return null;

  const stageConfig = STAGE_COLORS[orch.unified_stage] || STAGE_COLORS.intake_received;
  const hasBlockers = orch.blockers && orch.blockers.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-foreground">{orch.business_name}</h3>
          <p className="text-xs text-muted-foreground">{orch.client_email}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${stageConfig.bg} ${stageConfig.text}`}>
          {stageConfig.label}
        </div>
      </div>

      {/* Completion Bar */}
      <StageProgressBar currentStage={orch.unified_stage} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded p-2 bg-muted/30">
          <p className="text-xs text-muted-foreground font-medium uppercase">Checklist</p>
          <p className="text-lg font-bold text-foreground">
            {orch.completion_metrics?.completion_percentage || 0}%
          </p>
        </div>
        <div className="rounded p-2 bg-muted/30">
          <p className="text-xs text-muted-foreground font-medium uppercase">Status</p>
          <p className="text-sm font-bold text-foreground capitalize">{orch.checklist_status}</p>
        </div>
        <div className="rounded p-2 bg-muted/30">
          <p className="text-xs text-muted-foreground font-medium uppercase">Ready</p>
          <p className={`text-lg font-bold ${orch.ready_to_go_live ? 'text-green-600' : 'text-orange-600'}`}>
            {orch.ready_to_go_live ? '✓' : '–'}
          </p>
        </div>
      </div>

      {/* Blockers */}
      {hasBlockers && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Blockers ({orch.blockers.length})
          </p>
          <div className="space-y-1">
            {orch.blockers.slice(0, 2).map((blocker, i) => (
              <p key={i} className="text-xs text-red-600">{blocker.description}</p>
            ))}
            {orch.blockers.length > 2 && (
              <p className="text-xs text-red-600">+{orch.blockers.length - 2} more</p>
            )}
          </div>
        </div>
      )}

      {/* Missing Items */}
      {orch.missing_setup_items && orch.missing_setup_items.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-2">
          <p className="text-xs font-bold text-orange-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Missing Setup ({orch.missing_setup_items.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {orch.missing_setup_items.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 capitalize"
              >
                {item.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="text-xs text-muted-foreground border-t border-border pt-2">
        <p>Last sync: {new Date(orch.last_sync_at).toLocaleString()}</p>
        {orch.go_live_date && (
          <p className="text-green-600 font-semibold">Go-live: {new Date(orch.go_live_date).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

export default function UnifiedOnboardingProgress() {
  const [orchestrations, setOrchestrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const allOrch = await base44.admin.entities.OnboardingOrchestration.filter({}, '-created_date', 500);
      setOrchestrations(allOrch || []);
    } catch (err) {
      console.error('Failed to fetch orchestrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = (orchestrations || []).filter(o => {
    if (search && !o.business_name?.toLowerCase().includes(search.toLowerCase()) &&
        !o.client_email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStage && o.unified_stage !== filterStage) return false;
    return true;
  });

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading onboarding orchestrations...</div>;
  }

  const stagedCounts = {};
  orchestrations.forEach(o => {
    const stage = o.unified_stage || 'intake_received';
    stagedCounts[stage] = (stagedCounts[stage] || 0) + 1;
  });

  const blockedCount = orchestrations.filter(o => o.blockers && o.blockers.length > 0).length;
  const readyCount = orchestrations.filter(o => o.ready_to_go_live).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Unified Onboarding Progress
        </h2>
        <p className="text-sm text-muted-foreground">
          Centralized orchestration across Order → Setup → Testing → Live
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{orchestrations.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stagedCounts['setup_in_progress'] || 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Testing</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stagedCounts['testing'] || 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Live</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stagedCounts['live'] || 0}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium text-red-700 uppercase">Blocked</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{blockedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded border border-border text-sm text-foreground"
        />
        <select
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Stages</option>
          {STAGE_SEQUENCE.map(stage => (
            <option key={stage} value={stage}>
              {STAGE_COLORS[stage].label}
            </option>
          ))}
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map(orch => (
            <OnboardingCard key={orch.id} orch={orch} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No onboarding records match your filters
          </div>
        )}
      </div>
    </div>
  );
}