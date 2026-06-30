import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { summarizeOutreachReadiness } from '@/lib/outreachReadiness';

function StatusPill({ status }) {
  const styles = {
    ready: 'bg-green-50 text-green-700 border-green-200',
    needs_verification: 'bg-amber-50 text-amber-700 border-amber-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
  };
  const label = status === 'ready' ? 'Ready' : status === 'blocked' ? 'Blocked' : 'Verify First';
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${styles[status] || styles.needs_verification}`}>{label}</span>;
}

function StatCard({ label, value, subtext, icon: Icon, tone }) {
  const tones = {
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtext && <p className="mt-1 text-xs opacity-75">{subtext}</p>}
        </div>
        {Icon && <Icon className="h-5 w-5 opacity-70" />}
      </div>
    </div>
  );
}

function LeadRow({ row }) {
  const { lead, readiness } = row;
  const details = readiness.status === 'blocked' ? readiness.blockers : readiness.warnings;
  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="px-3 py-3">
        <p className="text-sm font-semibold text-foreground">{lead.business_name || lead.full_name || lead.email || lead.id}</p>
        <p className="text-xs text-muted-foreground">{readiness.contact.email || 'no email'} · {readiness.contact.phone || 'no phone'}</p>
      </td>
      <td className="px-3 py-3"><StatusPill status={readiness.status} /></td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {readiness.contact.website || 'no website'}
        <br />
        {readiness.contact.location || 'no city/state'}
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {details.length ? details.join('; ') : 'All minimum checks passed'}
        {readiness.reasons.length > 0 && <p className="mt-1 text-[11px] text-red-600">{readiness.reasons.slice(0, 2).join('; ')}</p>}
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{lead.created_date ? new Date(lead.created_date).toLocaleDateString() : '—'}</td>
    </tr>
  );
}

export default function SafeOutreachQueue() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('ready');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await base44.entities.Leads.filter({}, '-created_date', 1000);
      setLeads(rows || []);
    } catch (err) {
      setError(err?.message || 'Failed to load outreach queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => summarizeOutreachReadiness(leads), [leads]);
  const visibleRows = filter === 'ready'
    ? summary.ready
    : filter === 'needs_verification'
      ? summary.needs_verification
      : filter === 'blocked'
        ? summary.blocked
        : summary.rows;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Safe Outreach Queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">Classifies leads before SMS/email outreach. This panel does not send messages.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex gap-3">
        <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Only Ready leads should be used for manual or automated outreach.</p>
          <p className="mt-1 text-xs">Needs Verification records are probably real but incomplete. Blocked records have quarantine, duplicate, opt-out, or hidden CRM-quality signals.</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Ready" value={summary.ready.length} subtext="Can be contacted" icon={CheckCircle2} tone="green" />
        <StatCard label="Verify First" value={summary.needs_verification.length} subtext="Incomplete identity/contact data" icon={AlertTriangle} tone="amber" />
        <StatCard label="Blocked" value={summary.blocked.length} subtext="Do not contact" icon={ShieldAlert} tone="red" />
        <StatCard label="Total Loaded" value={summary.rows.length} subtext="Latest sample loaded" icon={ShieldCheck} tone="blue" />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['ready', 'Ready'],
          ['needs_verification', 'Verify First'],
          ['blocked', 'Blocked'],
          ['all', 'All'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${filter === id ? 'border-gray-900 bg-gray-900 text-white' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{visibleRows.length} leads shown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Lead</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Identity</th>
                <th className="px-3 py-2 text-left">Reason</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-10 text-center text-muted-foreground">No leads in this queue.</td></tr>
              ) : (
                visibleRows.map((row) => <LeadRow key={row.lead.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
