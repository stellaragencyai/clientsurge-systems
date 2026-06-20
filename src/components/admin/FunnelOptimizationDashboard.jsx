import React, { useEffect, useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, AlertCircle, Zap, Filter, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const IMPACT_STYLES = {
  high:   { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    label: '🔴 High' },
  medium: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', label: '🟠 Medium' },
  low:    { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   label: '🔵 Low' },
};

const CATEGORY_COLORS = {
  'Funnel Drop-off':    'bg-purple-100 text-purple-700',
  'Lead Response':      'bg-blue-100 text-blue-700',
  'Source Optimization':'bg-green-100 text-green-700',
  'Stage Conversion':   'bg-yellow-100 text-yellow-700',
  'Messaging Health':   'bg-pink-100 text-pink-700',
};

function RecommendationCard({ rec }) {
  const style = IMPACT_STYLES[rec.impact] || IMPACT_STYLES.low;
  const categoryColor = CATEGORY_COLORS[rec.category] || 'bg-gray-100 text-gray-700';

  return (
    <div className={`rounded-lg border p-5 ${rec.impact === 'high' ? `${style.bg} ${style.border}` : 'border-border bg-white'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${categoryColor}`}>{rec.category}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.badge}`}>{style.label} Impact</span>
          </div>
          <h4 className="font-bold text-foreground text-sm mt-2">{rec.title}</h4>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Problem Detected</p>
          <p className="text-sm text-foreground">{rec.problem}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Suggested Action</p>
          <p className="text-sm text-foreground/80">{rec.action}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelStageBar({ label, count, prevCount }) {
  const dropoff = prevCount ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
  const widthPct = prevCount ? Math.max(8, Math.round((count / prevCount) * 100)) : 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-foreground">{count.toLocaleString()}</span>
          {dropoff > 0 && (
            <span className="text-red-600 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> -{dropoff}%
            </span>
          )}
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${widthPct}%`, background: '#00AEEF', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color = 'text-foreground' }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const ALL_CATEGORIES = ['Funnel Drop-off', 'Lead Response', 'Source Optimization', 'Stage Conversion', 'Messaging Health'];

export default function FunnelOptimizationDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterImpact, setFilterImpact] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const res = await base44.functions.invoke('getFunnelOptimizationRecommendations', {});
      setData(res?.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load funnel recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecs = useMemo(() => {
    if (!data?.recommendations) return [];
    return data.recommendations.filter(r => {
      if (filterImpact && r.impact !== filterImpact) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      return true;
    });
  }, [data, filterImpact, filterCategory]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Analyzing funnel data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-600">Failed to load recommendations.</div>;
  }

  const { funnel_stages, drop_offs, source_stats, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Funnel Optimization Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actionable insights based on lead flow, drop-off analysis, and source performance.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Recommendations" value={summary.total_recommendations} />
        <SummaryCard label="High Impact" value={summary.high_impact} color="text-red-600" />
        <SummaryCard label="Medium Impact" value={summary.medium_impact} color="text-orange-600" />
        <SummaryCard
          label="Worst Drop-off Stage"
          value={`${summary.worst_dropoff_rate}%`}
          sub={summary.worst_dropoff_stage}
          color="text-red-600"
        />
      </div>

      {/* Funnel Visualization + Source Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Stages */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            Funnel Stage Flow
          </h3>
          <FunnelStageBar label="Leads Created" count={funnel_stages.created} prevCount={null} />
          <FunnelStageBar label="Contacted" count={funnel_stages.contacted} prevCount={funnel_stages.created} />
          <FunnelStageBar label="Replied" count={funnel_stages.replied} prevCount={funnel_stages.contacted} />
          <FunnelStageBar label="Booked" count={funnel_stages.booked} prevCount={funnel_stages.replied} />
          <FunnelStageBar label="Won" count={funnel_stages.won} prevCount={funnel_stages.booked} />
        </div>

        {/* Source Performance */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4">Source Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">Source</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase">Leads</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase">Converted</th>
                  <th className="text-right py-2 text-xs font-semibold text-muted-foreground uppercase">Rate</th>
                </tr>
              </thead>
              <tbody>
                {source_stats.slice(0, 7).map((src, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium text-foreground capitalize">{src.source}</td>
                    <td className="py-2 text-right text-muted-foreground">{src.total}</td>
                    <td className="py-2 text-right text-muted-foreground">{src.converted}</td>
                    <td className="py-2 text-right">
                      <span className={`font-bold text-xs px-2 py-0.5 rounded ${src.conversion_rate >= 10 ? 'bg-green-100 text-green-700' : src.conversion_rate >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {src.conversion_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-gray-50">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <select
          value={filterImpact}
          onChange={e => setFilterImpact(e.target.value)}
          className="px-3 py-1.5 rounded border border-border text-sm bg-white font-medium text-foreground cursor-pointer"
        >
          <option value="">All Impact Levels</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟠 Medium</option>
          <option value="low">🔵 Low</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 rounded border border-border text-sm bg-white font-medium text-foreground cursor-pointer"
        >
          <option value="">All Categories</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filterImpact || filterCategory) && (
          <button
            onClick={() => { setFilterImpact(''); setFilterCategory(''); }}
            className="text-xs text-primary underline font-semibold"
            style={{ minHeight: 'unset', minWidth: 'unset' }}
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filteredRecs.length} recommendations</span>
      </div>

      {/* Recommendation Cards */}
      {filteredRecs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground text-sm">
          No recommendations match the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Group by category */}
          {ALL_CATEGORIES.filter(cat => !filterCategory || cat === filterCategory).map(category => {
            const catRecs = filteredRecs.filter(r => r.category === category);
            if (catRecs.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catRecs.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Analysis run at {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}