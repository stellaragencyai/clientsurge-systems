import React, { useState, useMemo } from 'react';
import { AlertCircle, TrendingUp, Clock, Zap, Filter } from 'lucide-react';

function PriorityBadge({ score, leadState }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">🔴 HOT</span>;
  if (score >= 60) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700">🟠 WARM</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">⚪ COLD</span>;
}

function ActivityIndicator({ lastActivityAt }) {
  const isRecent = lastActivityAt && new Date(lastActivityAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isStale = !lastActivityAt || new Date(lastActivityAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  if (isRecent) return <span className="text-xs font-semibold text-green-600">Active</span>;
  if (isStale) return <span className="text-xs font-semibold text-red-600">Stale</span>;
  return <span className="text-xs font-semibold text-gray-500">Inactive</span>;
}

function LeadRow({ lead, index }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border hover:bg-gray-50/50 transition-colors">
      <span className="text-xs font-bold text-muted-foreground w-6">{index + 1}</span>
      <div className="flex-1">
        <p className="font-semibold text-foreground text-sm">{lead.business_name}</p>
        <p className="text-xs text-muted-foreground">{lead.industry}</p>
      </div>
      <div className="flex items-center gap-3">
        <PriorityBadge score={lead.intelligence_score} leadState={lead.lead_state} />
        <div className="text-right">
          <p className="font-bold text-foreground text-sm">{Math.round(lead.intelligence_score)}</p>
          <ActivityIndicator lastActivityAt={lead.last_activity_at} />
        </div>
      </div>
    </div>
  );
}

export default function DecisionSupportLayer({ insights }) {
  const [filterState, setFilterState] = useState(null);
  const [filterSegment, setFilterSegment] = useState(null);
  const [expandAttention, setExpandAttention] = useState(false);
  const [expandStale, setExpandStale] = useState(false);

  // Apply filters - called unconditionally
  const filteredPriority = useMemo(() => {
    if (!insights?.decision_support?.top_priority_leads) return [];
    const { top_priority_leads } = insights.decision_support;
    return top_priority_leads.filter(l => {
      if (filterState && l.lead_state !== filterState) return false;
      if (filterSegment && l.segment !== filterSegment) return false;
      return true;
    });
  }, [filterState, filterSegment, insights]);

  if (!insights?.decision_support) return null;

  const { top_priority_leads, leads_requiring_attention, stale_high_potential, top_industries, segment_breakdown } = insights.decision_support;

  return (
    <div className="space-y-6">
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Decision Support Layer
        </h2>
        <p className="text-sm text-muted-foreground">Prioritization view to help identify leads and areas requiring attention</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={filterState || ''}
          onChange={e => setFilterState(e.target.value || null)}
          className="px-3 py-1.5 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All States</option>
          <option value="NEW">NEW</option>
          <option value="HOT">HOT</option>
          <option value="WARM">WARM</option>
          <option value="COLD">COLD</option>
        </select>
        <select
          value={filterSegment || ''}
          onChange={e => setFilterSegment(e.target.value || null)}
          className="px-3 py-1.5 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Segments</option>
          {Object.keys(segment_breakdown).map(seg => (
            <option key={seg} value={seg}>{seg}</option>
          ))}
        </select>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leads Requiring Attention */}
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-foreground">Requires Immediate Attention</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{leads_requiring_attention.length} high-score leads not yet contacted</p>
          {leads_requiring_attention.length > 0 && (
            <button
              onClick={() => setExpandAttention(!expandAttention)}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              {expandAttention ? 'Hide' : 'Show'} top {Math.min(5, leads_requiring_attention.length)}
            </button>
          )}
          {expandAttention && (
            <div className="mt-3 space-y-2">
              {leads_requiring_attention.slice(0, 5).map((lead, idx) => (
                <div key={idx} className="text-xs py-2 border-b border-red-100 last:border-0">
                  <p className="font-semibold text-foreground">{lead.business_name}</p>
                  <p className="text-muted-foreground">{lead.industry} • Score: {Math.round(lead.intelligence_score)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stale High-Potential */}
        <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-foreground">Stale but High-Potential</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{stale_high_potential.length} leads inactive 7+ days</p>
          {stale_high_potential.length > 0 && (
            <button
              onClick={() => setExpandStale(!expandStale)}
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              {expandStale ? 'Hide' : 'Show'} top {Math.min(5, stale_high_potential.length)}
            </button>
          )}
          {expandStale && (
            <div className="mt-3 space-y-2">
              {stale_high_potential.slice(0, 5).map((lead, idx) => (
                <div key={idx} className="text-xs py-2 border-b border-orange-100 last:border-0">
                  <p className="font-semibold text-foreground">{lead.business_name}</p>
                  <p className="text-muted-foreground">{lead.industry} • Score: {Math.round(lead.intelligence_score || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Priority Leads */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-5 border-b border-border bg-gray-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Priority Leads
          </h3>
        </div>
        <div>
          {filteredPriority.length > 0 ? (
            filteredPriority.map((lead, idx) => (
              <LeadRow key={lead.id} lead={lead} index={idx} />
            ))
          ) : (
            <div className="p-5 text-center text-sm text-muted-foreground">
              No leads match the selected filters
            </div>
          )}
        </div>
      </div>

      {/* Industry Concentration */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="font-bold text-foreground mb-4">Industry Concentration</h3>
        <div className="space-y-3">
          {top_industries.map((ind, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{ind.industry}</p>
                <p className="text-xs text-muted-foreground">{ind.total_leads} leads ({ind.high_value_leads} high-value)</p>
              </div>
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${Math.round((ind.high_value_leads / ind.total_leads) * 100)}%`,
                    background: '#00AEEF'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segment Overview */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h3 className="font-bold text-foreground mb-4">Segment Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(segment_breakdown).map(([segment, data]) => (
            <div key={segment} className="text-center p-3 rounded-lg border border-border">
              <p className="text-lg font-bold text-foreground">{data.count}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{segment}</p>
              <p className="text-xs text-primary font-bold mt-1">⌀ {data.avg_score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}