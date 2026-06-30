import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck, Slash, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildAutomationEvidence } from '@/lib/automationEvidence';

const STATUS = {
  proven: { label: 'Proven', tone: 'border-green-200 bg-green-50 text-green-800', Icon: CheckCircle2 },
  guarded: { label: 'Guarded', tone: 'border-blue-200 bg-blue-50 text-blue-800', Icon: ShieldCheck },
  mixed: { label: 'Mixed', tone: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
  needs_review: { label: 'Needs Review', tone: 'border-red-200 bg-red-50 text-red-800', Icon: AlertTriangle },
  no_signal: { label: 'No Signal', tone: 'border-slate-200 bg-slate-50 text-slate-700', Icon: Slash },
};

function formatDate(value) {
  if (!value) return 'No event yet';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'No event yet';
  }
}

function EvidenceCard({ item }) {
  const config = STATUS[item.status] || STATUS.no_signal;
  const Icon = config.Icon;
  return (
    <div className={`rounded-xl border p-4 ${config.tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{item.label}</p>
          <p className="mt-1 text-xs opacity-75">Latest: {formatDate(item.latest_at)}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold">
          <Icon className="h-3 w-3" /> {config.label}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/70 p-2"><p className="font-bold text-foreground">{item.total_events}</p><p className="opacity-70">Events</p></div>
        <div className="rounded-lg bg-white/70 p-2"><p className="font-bold text-green-700">{item.positive_count}</p><p className="opacity-70">Positive</p></div>
        <div className="rounded-lg bg-white/70 p-2"><p className="font-bold text-blue-700">{item.guarded_count}</p><p className="opacity-70">Guarded</p></div>
        <div className="rounded-lg bg-white/70 p-2"><p className="font-bold text-red-700">{item.issue_count}</p><p className="opacity-70">Review</p></div>
      </div>
      <p className="mt-3 truncate text-xs opacity-80">{item.latest_subject || 'No CommunicationEvent evidence yet.'}</p>
    </div>
  );
}

export default function AutomationEvidenceCards() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await base44.entities.CommunicationEvent.filter({}, '-created_date', 500);
      setEvents(rows || []);
    } catch (err) {
      setError(err?.message || 'Unable to load automation evidence events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const proof = useMemo(() => buildAutomationEvidence(events), [events]);
  const proven = proof.filter((item) => item.status === 'proven').length;
  const guarded = proof.filter((item) => item.status === 'guarded').length;
  const review = proof.filter((item) => item.status === 'needs_review' || item.status === 'mixed').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automation Evidence Cards</h2>
          <p className="mt-1 text-sm text-muted-foreground">Evidence from recent CommunicationEvent records. These cards show what ran, what succeeded, what was guarded, and what needs review.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Evidence summary: {proven} proven · {guarded} guarded · {review} need review.</p>
        <p className="mt-1 text-xs">A guarded card is positive when unsafe or internal records were intentionally held back. No Signal means no recent CommunicationEvent proof exists in the loaded sample.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-border bg-white p-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proof.map((item) => <EvidenceCard key={item.key} item={item} />)}
        </div>
      )}
    </div>
  );
}
