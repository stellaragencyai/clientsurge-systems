import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, RefreshCw, CheckCircle2, Zap, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function MetricBox({ label, value, color = 'text-foreground', subtext }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

function IncidentBadge({ severity }) {
  const colors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

export default function AutomationEdgeCasePanel() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke('getAutomationEdgeCaseReport', {});
      setReport(res?.data);
    } catch (err) {
      console.error('Failed to fetch edge case report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading automation stability report...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-600">Failed to load report.</div>;
  }

  const { summary, dedup_analysis, job_analysis, idempotency_analysis, communication_event_flags, recent_incidents } = report;

  const healthColor = summary.success_rate >= 90 ? 'text-green-600' :
    summary.success_rate >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Automation Edge Case Stability
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Deduplication, retry safety, and race condition protection</p>
        </div>
        <button
          onClick={fetchReport}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System Health Overview */}
      <div className="rounded-lg border-2 border-border bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <h3 className="font-bold text-foreground mb-4">System Stability Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricBox label="Success Rate" value={`${summary.success_rate}%`} color={healthColor} />
          <MetricBox label="Dedup Effectiveness" value={`${summary.deduplication_effectiveness_percent}%`} color="text-blue-600" />
          <MetricBox label="Duplicates Blocked" value={summary.blocked_duplicates} color="text-green-600" />
          <MetricBox label="High Retry Jobs" value={summary.high_retry_count} color={summary.high_retry_count > 5 ? 'text-red-600' : 'text-amber-600'} />
        </div>
      </div>

      {/* Dedup + Idempotency + Safety Flags Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dedup Analysis */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Deduplication
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Total Events</span>
              <span className="font-bold">{dedup_analysis.total}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Last 24h</span>
              <span className="font-bold text-primary">{dedup_analysis.recent_24h}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Blocked</span>
              <span className="font-bold text-green-600">{dedup_analysis.skipped}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Processed</span>
              <span className="font-bold">{dedup_analysis.processed}</span>
            </div>
          </div>
        </div>

        {/* Idempotency */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Idempotency Keys
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Total Keys</span>
              <span className="font-bold">{idempotency_analysis.total_keys}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Duplicates Prevented</span>
              <span className="font-bold text-green-600">{idempotency_analysis.duplicates_prevented}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Processed</span>
              <span className="font-bold">{idempotency_analysis.processed}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Expired</span>
              <span className="font-bold text-muted-foreground">{idempotency_analysis.expired}</span>
            </div>
          </div>
        </div>

        {/* Communication Event Safety Flags */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            Comm Event Flags
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Duplicate Detected</span>
              <span className="font-bold text-orange-600">{communication_event_flags.duplicate_detected}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Execution Skipped</span>
              <span className="font-bold text-blue-600">{communication_event_flags.execution_skipped}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Retry Blocked</span>
              <span className="font-bold text-red-600">{communication_event_flags.retry_blocked}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Total Flagged</span>
              <span className="font-bold">{communication_event_flags.total_flagged}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Job Types */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Top Automation Types
          </h3>
          <div className="space-y-2">
            {(job_analysis.top_job_types || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground capitalize">{item.type}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, (item.count / (job_analysis.top_job_types[0]?.count || 1)) * 100)}%`,
                        background: '#00AEEF'
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground w-10 text-right">{item.count}</span>
              </div>
            ))}
            {!job_analysis.top_job_types?.length && <p className="text-sm text-muted-foreground">No data yet</p>}
          </div>
        </div>

        {/* Top Failure Reasons */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Top Failure Patterns
          </h3>
          <div className="space-y-2">
            {(job_analysis.top_failure_reasons || []).map((item, i) => (
              <div key={i} className="rounded p-2 bg-red-50 border border-red-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-red-700 flex-1">{item.reason}</p>
                  <span className="text-xs font-bold text-red-600 flex-shrink-0">{item.count}x</span>
                </div>
              </div>
            ))}
            {!job_analysis.top_failure_reasons?.length && (
              <p className="text-sm text-green-600 font-medium">✓ No failure patterns detected</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Recent Edge Case Incidents ({recent_incidents.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {recent_incidents.length > 0 ? (
            recent_incidents.map((inc, idx) => (
              <div key={idx} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{inc.entity}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground capitalize">{inc.type.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{inc.description}</p>
                  {inc.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">{new Date(inc.timestamp).toLocaleString()}</p>
                  )}
                </div>
                <IncidentBadge severity={inc.severity} />
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-green-600 font-medium">
              ✓ No edge case incidents detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}