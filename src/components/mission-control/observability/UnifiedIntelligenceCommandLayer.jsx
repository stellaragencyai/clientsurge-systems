import React, { useMemo } from 'react';
import { Activity, AlertCircle, TrendingUp, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

function HealthBadge({ status }) {
  const colors = {
    'Healthy': 'bg-green-50 text-green-700 border-green-200',
    'Degraded': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Critical': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors['Healthy']}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const styles = {
    high: { bg: 'bg-red-50', text: 'text-red-700', icon: '🔴' },
    medium: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🟠' },
    low: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🔵' },
  };
  const style = styles[priority] || styles.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.icon} {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function InsightCard({ insight, source }) {
  const sourceColors = {
    OBSERVABILITY: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    OPTIMIZATION: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    DECISION: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    SUGGESTION: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  };
  const sourceColor = sourceColors[source] || sourceColors.OBSERVABILITY;

  return (
    <div className={`rounded-lg border ${sourceColor.border} ${sourceColor.bg} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-foreground text-sm flex-1">{insight.title}</h4>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${sourceColor.text}`}>
          {source}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{insight.description}</p>
      {insight.priority && <PriorityBadge priority={insight.priority} />}
    </div>
  );
}

export default function UnifiedIntelligenceCommandLayer({ metrics, suggestions, decisionSupport, systemNotes }) {
  // Consolidate all insights
  const allInsights = useMemo(() => {
    const insights = [];

    // Add suggestions
    if (suggestions && Array.isArray(suggestions)) {
      suggestions.forEach(s => {
        insights.push({
          ...s,
          source: 'SUGGESTION',
        });
      });
    }

    // Add decision support insights
    if (decisionSupport?.leads_requiring_attention?.length > 0) {
      insights.push({
        title: 'High-Activity Leads Requiring Attention',
        description: `${decisionSupport.leads_requiring_attention.length} high-score leads haven't been contacted yet.`,
        priority: 'high',
        source: 'DECISION',
      });
    }

    if (decisionSupport?.stale_high_potential?.length > 0) {
      insights.push({
        title: 'Stale but High-Potential Leads',
        description: `${decisionSupport.stale_high_potential.length} leads inactive 7+ days with high score.`,
        priority: 'medium',
        source: 'DECISION',
      });
    }

    // Add system notes insights (if available)
    if (systemNotes && Array.isArray(systemNotes)) {
      systemNotes.forEach(note => {
        insights.push({
          title: note.title || 'System Note',
          description: note.description || '',
          priority: note.priority || 'low',
          source: 'OBSERVABILITY',
        });
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }, [suggestions, decisionSupport, systemNotes]);

  // Extract key metrics
  const systemHealth = metrics?.health_indicators;
  const coreMetrics = metrics?.core_metrics;
  const leadFlow = metrics?.lead_flow_24h;

  // Determine overall health
  const overallHealth = useMemo(() => {
    if (!systemHealth) return 'Healthy';
    const statuses = Object.values(systemHealth)
      .map(h => h.status)
      .filter(Boolean);
    if (statuses.some(s => s === 'Issue')) return 'Critical';
    if (statuses.some(s => s === 'Degraded')) return 'Degraded';
    return 'Healthy';
  }, [systemHealth]);

  // Top focus areas
  const topFocusAreas = useMemo(() => {
    const areas = [];

    // High-activity not contacted
    if (decisionSupport?.leads_requiring_attention?.length > 5) {
      areas.push({
        title: 'Prioritize High-Activity Outreach',
        description: `${decisionSupport.leads_requiring_attention.length} hot leads awaiting first contact`,
        priority: 'high',
      });
    }

    // Event queue backlog
    if (systemHealth?.event_queue_health?.queued > 50) {
      areas.push({
        title: 'Event Queue Backlog',
        description: `${systemHealth.event_queue_health.queued} events queued. Monitor processing speed.`,
        priority: 'high',
      });
    }

    // Messaging health
    if (systemHealth?.messaging_health?.status === 'Degraded') {
      areas.push({
        title: 'Message Delivery Issues',
        description: 'SMS or email failure rate elevated. Check provider health.',
        priority: 'high',
      });
    }

    // Automation success rate
    if (coreMetrics?.success_rate < 70) {
      areas.push({
        title: 'Automation Success Rate Low',
        description: `Only ${coreMetrics.success_rate}% of jobs succeeded. Review error patterns.`,
        priority: 'medium',
      });
    }

    // Stale leads
    if (decisionSupport?.stale_high_potential?.length > 10) {
      areas.push({
        title: 'Reactivate Dormant Leads',
        description: `${decisionSupport.stale_high_potential.length} inactive but valuable leads available for reactivation.`,
        priority: 'medium',
      });
    }

    return areas.slice(0, 5);
  }, [decisionSupport, systemHealth, coreMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Unified Intelligence Command Layer
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Consolidated executive dashboard of all system intelligence</p>
      </div>

      {/* Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">System Status</p>
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <HealthBadge status={overallHealth} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Total Activity (24h)</p>
          <p className="text-2xl font-bold text-foreground">{(coreMetrics?.total_events || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Events processed</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Lead Flow</p>
          <p className="text-2xl font-bold text-foreground">{(leadFlow?.new_leads || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">New leads</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Success Rate</p>
          <p className="text-2xl font-bold text-foreground">{coreMetrics?.success_rate || 0}%</p>
          <p className="text-xs text-muted-foreground mt-1">Automation jobs</p>
        </div>
      </div>

      {/* System Health Snapshot */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          System Health Snapshot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemHealth?.messaging_health && (
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Messaging</span>
              <HealthBadge status={systemHealth.messaging_health.status} />
            </div>
          )}
          {systemHealth?.automation_health && (
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Automation</span>
              <HealthBadge status={systemHealth.automation_health.status} />
            </div>
          )}
          {systemHealth?.event_queue_health && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Event Queue</span>
              <HealthBadge status={systemHealth.event_queue_health.status} />
            </div>
          )}
        </div>
      </div>

      {/* Top Focus Areas */}
      {topFocusAreas.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Top Focus Areas
          </h3>
          <div className="space-y-3">
            {topFocusAreas.map((area, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <PriorityBadge priority={area.priority} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{area.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consolidated Insight Stream */}
      {allInsights.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Consolidated Insight Stream
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} source={insight.source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}