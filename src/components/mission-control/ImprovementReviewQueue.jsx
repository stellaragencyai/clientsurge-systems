import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, Check, X, Loader2, MessageSquare, Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: 'text-red-600' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-600' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: 'text-yellow-600' },
  advisory: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-600' },
};

const STATUS_LABELS = {
  pending_review: { label: 'Pending Review', badge: 'bg-slate-100 text-slate-700' },
  approved: { label: 'Approved', badge: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-700' },
  completed: { label: 'Completed', badge: 'bg-gray-100 text-gray-700' },
};

export default function ImprovementReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getImprovementReviewQueue', { action: 'fetch' });
      setItems(res?.data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (itemId, decision) => {
    setSubmitting(true);
    try {
      await base44.functions.invoke('getImprovementReviewQueue', {
        action: 'decide',
        item_id: itemId,
        decision,
        notes: reviewNotes,
      });

      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.review_id === itemId
            ? { ...item, status: decision === 'approved' ? 'approved' : 'rejected' }
            : item
        )
      );
      setReviewingId(null);
      setReviewNotes('');
    } catch (err) {
      setError(err.message || 'Failed to save decision');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = filterSeverity === 'all'
    ? items
    : items.filter(item => item.severity === filterSeverity);

  const pendingCount = items.filter(i => i.status === 'pending_review').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const rejectedCount = items.filter(i => i.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Improvement Review Queue</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage system improvement recommendations from health monitoring and diagnostics.
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-blue-700">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {['all', 'critical', 'high', 'medium', 'advisory'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === sev
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading recommendations...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No recommendations</p>
            <p className="text-xs text-muted-foreground mt-1">All systems operating optimally.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const colors = SEVERITY_COLORS[item.severity];
            const statusLabel = STATUS_LABELS[item.status];
            const isReviewing = reviewingId === item.review_id;

            return (
              <div
                key={item.review_id}
                className={`rounded-lg border ${colors.border} ${colors.bg} p-4 space-y-3`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.severity === 'critical' && <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />}
                    {item.severity === 'high' && <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />}
                    {item.severity === 'medium' && <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />}
                    {item.severity === 'advisory' && <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colors.badge}`}>
                          {item.severity.toUpperCase()}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusLabel.badge}`}>
                          {statusLabel.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{item.source_issue}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">From: {item.source_module}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-foreground leading-relaxed">{item.description}</p>

                {/* Recommendation */}
                <div className="flex items-start gap-2 rounded-lg bg-white/50 p-3">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-primary mb-0.5">Recommendation</p>
                    <p className="text-xs text-foreground">{item.recommendation}</p>
                  </div>
                </div>

                {/* Review Controls */}
                {item.status === 'pending_review' && (
                  <div className="space-y-2">
                    {!isReviewing ? (
                      <button
                        onClick={() => setReviewingId(item.review_id)}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-current text-foreground hover:bg-white/30 transition-colors"
                      >
                        Review Item
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Optional notes about this decision..."
                          className="w-full px-3 py-2 rounded-lg border border-current text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDecision(item.review_id, 'approved')}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                          >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(item.review_id, 'rejected')}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            Reject
                          </button>
                          <button
                            onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                            disabled={submitting}
                            className="px-3 py-2 rounded-lg border border-current text-foreground hover:bg-white/30 transition-colors disabled:opacity-60 text-sm font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Meta */}
                <p className="text-[10px] text-muted-foreground">
                  ID: {item.review_id} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}