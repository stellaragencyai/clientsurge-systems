import React, { useEffect, useState } from 'react';
import { Users, Zap, Settings, DollarSign, AlertTriangle, RefreshCw, CheckCircle2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getPlanLabel, getPlanBadgeClasses, getDefaultFeatureFlags, getDefaultUsageLimits } from '@/lib/planFeatureFlags';

const PLAN_OPTIONS = [
  { value: 'trial', label: 'Free Trial' },
  { value: 'starter_system', label: 'Starter System' },
  { value: 'growth_system', label: 'Growth System' },
  { value: 'pro_system', label: 'Pro System' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = ['trial', 'active', 'paused', 'cancelled', 'past_due'];

const FEATURE_LABELS = {
  sms_enabled: 'SMS Messaging',
  email_enabled: 'Email Messaging',
  voice_calls_enabled: 'Voice Calls',
  ai_booking_agent_enabled: 'AI Booking Agent',
  lead_reactivation_enabled: 'Lead Reactivation',
  review_request_enabled: 'Review Requests',
  nurture_sequence_enabled: 'Nurture Sequences',
  ai_intelligence_enabled: 'AI Lead Intelligence',
  advanced_analytics_enabled: 'Advanced Analytics',
  conversion_insights_enabled: 'Conversion Insights',
  funnel_optimization_enabled: 'Funnel Optimization',
  command_center_enabled: 'Command Center',
  assisted_operations_enabled: 'Assisted Operations',
  white_label_enabled: 'White Label',
  api_access_enabled: 'API Access',
};

function PlanBadge({ plan }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getPlanBadgeClasses(plan)}`}>
      {getPlanLabel(plan)}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-green-50 text-green-700',
    trial: 'bg-orange-50 text-orange-700',
    paused: 'bg-yellow-50 text-yellow-700',
    cancelled: 'bg-red-50 text-red-700',
    past_due: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${colors[status] || 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  );
}

function UsageBar({ label, used, limit, colorClass = 'bg-primary' }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold text-foreground">{used.toLocaleString()} / {limit === 999999 ? '∞' : limit.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ClientPlanCard({ config, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plan_type: config.plan_type || 'starter_system',
    plan_status: config.plan_status || 'trial',
    feature_flags: config.feature_flags || {},
    white_label: config.white_label || {},
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.admin.entities.ClientAccountConfig.update(config.id, {
        plan_type: form.plan_type,
        plan_status: form.plan_status,
        feature_flags: { ...getDefaultFeatureFlags(form.plan_type), ...form.feature_flags },
      });
      onUpdate();
      setEditing(false);
    } catch (err) {
      console.error('Failed to update plan:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = (key) => {
    setForm(prev => ({
      ...prev,
      feature_flags: { ...prev.feature_flags, [key]: !prev.feature_flags[key] },
    }));
  };

  const usageLimits = getDefaultUsageLimits(form.plan_type);
  const usage = config.usage_current_month || {};

  return (
    <div className={`rounded-lg border ${config.plan_status === 'active' ? 'border-border' : 'border-border/60'} bg-white overflow-hidden`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border bg-gray-50/40">
        <div>
          <p className="font-bold text-foreground">{config.business_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{config.client_email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PlanBadge plan={config.plan_type} />
          <StatusBadge status={config.plan_status} />
          <button
            onClick={() => setEditing(!editing)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="p-4 space-y-2 border-b border-border">
        <UsageBar label="SMS Sent" used={usage.sms_sent || 0} limit={usageLimits.max_sms_per_month} />
        <UsageBar label="Emails" used={usage.emails_sent || 0} limit={usageLimits.max_emails_per_month} />
        <UsageBar label="Leads" used={usage.leads_processed || 0} limit={usageLimits.max_leads_per_month} />
      </div>

      {/* All-time stats */}
      {config.usage_all_time && (
        <div className="px-4 py-2 grid grid-cols-2 gap-2 border-b border-border text-xs">
          <div>
            <span className="text-muted-foreground">Lifetime Leads:</span>
            <span className="font-semibold text-foreground ml-1">{(config.usage_all_time.leads_processed_count || 0).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lifetime Messages:</span>
            <span className="font-semibold text-foreground ml-1">{(config.usage_all_time.messages_sent_count || 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* White Label info */}
      {config.white_label?.brand_name_override && (
        <div className="px-4 py-2 bg-purple-50/30 border-b border-border text-xs">
          <span className="text-purple-700 font-semibold">White Label:</span>
          <span className="ml-1 text-foreground">{config.white_label.brand_name_override}</span>
          {config.white_label.primary_color && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full border border-border" style={{ background: config.white_label.primary_color }} />
              {config.white_label.primary_color}
            </span>
          )}
        </div>
      )}

      {/* Edit Panel */}
      {editing && (
        <div className="p-4 space-y-4 bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Plan</label>
              <select
                value={form.plan_type}
                onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}
                className="w-full rounded border border-border px-2 py-1.5 text-sm bg-white"
              >
                {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Status</label>
              <select
                value={form.plan_status}
                onChange={e => setForm(f => ({ ...f, plan_status: e.target.value }))}
                className="w-full rounded border border-border px-2 py-1.5 text-sm bg-white capitalize"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Feature Flags Overrides */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Feature Overrides</label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                const defaultVal = getDefaultFeatureFlags(form.plan_type)[key] ?? false;
                const currentVal = form.feature_flags[key] !== undefined ? form.feature_flags[key] : defaultVal;
                const isOverride = form.feature_flags[key] !== undefined && form.feature_flags[key] !== defaultVal;
                return (
                  <button
                    key={key}
                    onClick={() => toggleFlag(key)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium border transition-colors text-left ${
                      currentVal ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-border text-muted-foreground'
                    } ${isOverride ? 'ring-1 ring-orange-400' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${currentVal ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: '#00AEEF' }}
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaaSPlanManagerPanel() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const filter = {};
      if (planFilter) filter.plan_type = planFilter;
      if (statusFilter) filter.plan_status = statusFilter;
      const res = await base44.admin.entities.ClientAccountConfig.filter(filter, '-created_date', PAGE_SIZE + 1, page * PAGE_SIZE);
      setConfigs(res || []);
    } catch (err) {
      console.error('Failed to fetch client configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [planFilter, statusFilter, page]);

  const filtered = configs.filter(c => !search ||
    c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.client_email?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const planCounts = {};
  configs.forEach(c => {
    planCounts[c.plan_type] = (planCounts[c.plan_type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            SaaS Plan Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage client plans, feature flags, and usage tracking</p>
        </div>
        <button onClick={fetchConfigs} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Plan Distribution Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {PLAN_OPTIONS.map(plan => (
          <div key={plan.value} className="rounded-lg border border-border bg-white p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">{plan.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{planCounts[plan.value] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] rounded border border-border px-3 py-1.5 text-sm"
        />
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(0); }} className="rounded border border-border px-3 py-1.5 text-sm bg-white">
          <option value="">All Plans</option>
          {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="rounded border border-border px-3 py-1.5 text-sm bg-white capitalize">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading client plans...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No client configurations found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.slice(0, PAGE_SIZE).map(config => (
            <ClientPlanCard key={config.id} config={config} onUpdate={fetchConfigs} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {configs.length} clients</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors">Prev</button>
          <span>Page {page + 1}</span>
          <button onClick={() => setPage(page + 1)} disabled={configs.length <= PAGE_SIZE} className="px-3 py-1.5 rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}