import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

const BAND_STYLE = {
  trusted: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  blocked: 'border-red-200 bg-red-50 text-red-800',
  no_evidence: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default function DashboardTrustScorePanel() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const run = async (dryRun) => {
    setRunning(true);
    setError('');
    try {
      const response = await base44.functions.invoke('scoreDashboardTruthChecks', { dry_run: dryRun });
      setReport(response?.data || response);
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Trust scoring failed. The backend function may not be deployed yet.');
    } finally {
      setRunning(false);
    }
  };

  const rows = report?.results || [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Dashboard Trust Scoring</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Evidence-backed score only. Blockers always prevent a Trusted result.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => run(true)} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Dry Run
          </button>
          <button onClick={() => run(false)} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 disabled:opacity-50">
            <CheckCircle2 className="h-3.5 w-3.5" /> Score & Persist
          </button>
        </div>
      </div>

      {error && <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4" />{error}</div>}

      {report && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-5">
            {['processed', 'trusted', 'warning', 'blocked', 'no_evidence'].map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{key.replace('_', ' ')}</p>
                <p className="text-lg font-bold text-slate-800">{report.summary?.[key] || 0}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Mode: {report.dry_run ? 'Dry run — no records changed' : 'Persisted to DashboardTruthCheck'} · Request ID: {report.request_id}</p>
          {rows.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
              {rows.slice(0, 25).map((row) => (
                <div key={row.id} className="border-b border-slate-100 p-3 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">{row.business_name || row.id}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${BAND_STYLE[row.trust_band] || BAND_STYLE.no_evidence}`}>{row.trust_score}/100 · {row.trust_band}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Blockers {row.blocker_count} · Warnings {row.warning_count} · Stale {row.stale_source_count} · Missing {row.missing_source_count} · Evidence {row.evidence_count}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Penalties: blockers {row.trust_penalties?.blockers || 0}, warnings {row.trust_penalties?.warnings || 0}, stale {row.trust_penalties?.stale_sources || 0}, missing {row.trust_penalties?.missing_sources || 0}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
