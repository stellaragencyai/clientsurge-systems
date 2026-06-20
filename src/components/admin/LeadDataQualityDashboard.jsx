import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function QualityStatusBadge({ status }) {
  const colors = {
    complete: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    incomplete: 'bg-red-100 text-red-700',
  };
  const labels = { complete: 'Complete', partial: 'Partial', incomplete: 'Incomplete' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[status] || colors.partial}`}>
      {labels[status] || status}
    </span>
  );
}

function NormalizationBadge({ status }) {
  const colors = {
    complete: 'bg-green-50 text-green-700',
    partial: 'bg-orange-50 text-orange-700',
    pending: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${colors[status] || colors.partial}`}>
      {status}
    </span>
  );
}

export default function LeadDataQualityDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [filterQuality, setFilterQuality] = useState('');
  const [filterNormalization, setFilterNormalization] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const allLeads = await base44.asServiceRole.entities.Leads.filter({}, '-data_quality_checked_at', 500);
      setLeads(allLeads || []);
      computeSummary(allLeads || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeSummary = (leadList) => {
    const total = leadList.length;
    const complete = leadList.filter(l => l.data_quality_status === 'complete').length;
    const partial = leadList.filter(l => l.data_quality_status === 'partial').length;
    const incomplete = leadList.filter(l => l.data_quality_status === 'incomplete').length;

    const normComplete = leadList.filter(l => l.normalization_status === 'complete').length;
    const normPartial = leadList.filter(l => l.normalization_status === 'partial').length;
    const normPending = leadList.filter(l => l.normalization_status === 'pending').length;

    const withFlags = leadList.filter(l => l.data_quality_flags && l.data_quality_flags.length > 0).length;
    const dedupReview = leadList.filter(l => l.dedup_review_needed).length;
    const scoringIssues = leadList.filter(l => l.scoring_validation_issues && l.scoring_validation_issues.length > 0).length;

    setSummary({
      total,
      quality: { complete, partial, incomplete },
      normalization: { complete: normComplete, partial: normPartial, pending: normPending },
      issues: { with_flags: withFlags, dedup_review: dedupReview, scoring: scoringIssues },
    });
  };

  const runValidation = async () => {
    setValidating(true);
    try {
      const res = await base44.functions.invoke('validateLeadDataQuality', { batch_size: 500 });
      if (res?.data?.summary) {
        alert(`Validation complete: ${res.data.summary.records_updated} leads updated with quality flags`);
      }
      // Refresh after validation
      setTimeout(fetchLeads, 1000);
    } catch (err) {
      alert(`Validation failed: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const filtered = (leads || []).filter(l => {
    if (filterQuality && l.data_quality_status !== filterQuality) return false;
    if (filterNormalization && l.normalization_status !== filterNormalization) return false;
    return true;
  });

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading lead data quality...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Lead Data Quality
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Normalization, deduplication, and scoring consistency</p>
        </div>
        <button
          onClick={runValidation}
          disabled={validating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
          {validating ? 'Running Validation...' : 'Run Full Validation'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Leads</p>
            <p className="text-3xl font-bold text-foreground mt-2">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium text-green-700 uppercase">Data Complete</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{summary.quality.complete}</p>
            <p className="text-xs text-green-600 mt-1">{Math.round((summary.quality.complete / summary.total) * 100)}%</p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs font-medium text-orange-700 uppercase">Partial Data</p>
            <p className="text-3xl font-bold text-orange-700 mt-2">{summary.quality.partial}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-700 uppercase">Incomplete</p>
            <p className="text-3xl font-bold text-red-700 mt-2">{summary.quality.incomplete}</p>
          </div>
        </div>
      )}

      {/* Issues Overview */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Normalization Status</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Complete</span>
                <span className="font-bold text-green-600">{summary.normalization.complete}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partial</span>
                <span className="font-bold text-orange-600">{summary.normalization.partial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-bold text-red-600">{summary.normalization.pending}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Quality Issues</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">With Flags</span>
                <span className="font-bold text-orange-600">{summary.issues.with_flags}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dedup Review</span>
                <span className="font-bold text-red-600">{summary.issues.dedup_review}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scoring Issues</span>
                <span className="font-bold text-red-600">{summary.issues.scoring}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Data Completeness</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Quality</span>
                  <span className="font-bold">{Math.round((summary.quality.complete / summary.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(summary.quality.complete / summary.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Normalization</span>
                  <span className="font-bold">{Math.round((summary.normalization.complete / summary.total) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(summary.normalization.complete / summary.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterQuality}
          onChange={e => setFilterQuality(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Quality Status</option>
          <option value="complete">Complete</option>
          <option value="partial">Partial</option>
          <option value="incomplete">Incomplete</option>
        </select>
        <select
          value={filterNormalization}
          onChange={e => setFilterNormalization(e.target.value)}
          className="px-3 py-2 rounded border border-border text-sm font-medium text-foreground bg-white cursor-pointer"
        >
          <option value="">All Normalization</option>
          <option value="complete">Complete</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-border">
          <h3 className="font-bold text-foreground">Lead Records ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Business</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Quality</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Normalization</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Issues</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Dedup Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr key={lead.id} className={i % 2 === 0 ? 'bg-background' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{lead.business_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <QualityStatusBadge status={lead.data_quality_status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <NormalizationBadge status={lead.normalization_status} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.data_quality_flags && lead.data_quality_flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.data_quality_flags.slice(0, 2).map((flag, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700"
                          >
                            {flag}
                          </span>
                        ))}
                        {lead.data_quality_flags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{lead.data_quality_flags.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">✓ No issues</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.dedup_review_needed ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Review
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No leads match selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}