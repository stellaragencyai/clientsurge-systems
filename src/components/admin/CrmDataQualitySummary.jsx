import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Archive, CheckCircle2, Database, Loader2, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  getLeadCleanupEligibility,
  getWebsiteLeadCleanupEligibility,
  isLeadVisibleInSalesViews,
  isWebsiteLeadVisibleInSalesViews,
} from '@/lib/leadCleanupGuards';

function parseMeta(event) {
  try {
    return event?.metadata_json ? JSON.parse(event.metadata_json) : {};
  } catch {
    return {};
  }
}

function pct(numerator, denominator) {
  if (!denominator) return '0%';
  return `${Math.round((Number(numerator || 0) / Number(denominator || 1)) * 100)}%`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

function StatCard({ label, value, subtext, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'border-border bg-white text-foreground',
    good: 'border-green-200 bg-green-50 text-green-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.default}`}>
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

function RunRow({ event }) {
  const meta = parseMeta(event);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(event.created_date)}</td>
      <td className="px-3 py-2 text-xs font-semibold text-foreground whitespace-nowrap">{event.status}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground">{event.subject}</td>
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
        {meta?.scanned ? `${meta.scanned.leads || 0}/${meta.scanned.website_leads || 0}` : '—'}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
        {meta?.applied ? `${meta.applied.leads || 0}/${meta.applied.website_leads || 0}` : '—'}
      </td>
    </tr>
  );
}

export default function CrmDataQualitySummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [websiteLeads, setWebsiteLeads] = useState([]);
  const [backfillRuns, setBackfillRuns] = useState([]);
  const [suppressedEvents, setSuppressedEvents] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [leadRows, websiteRows, runRows, suppressedRows] = await Promise.all([
        base44.entities.Leads.filter({}, '-created_date', 1000).catch(() => []),
        base44.admin.entities.WebsiteLead.filter({}, '-created_date', 1000).catch(() => []),
        base44.entities.CommunicationEvent.filter({ context_type: 'crm_quality_backfill' }, '-created_date', 25).catch(() => []),
        base44.entities.CommunicationEvent.filter({ event_type: 'outbound_suppressed' }, '-created_date', 100).catch(() => []),
      ]);
      setLeads(leadRows || []);
      setWebsiteLeads(websiteRows || []);
      setBackfillRuns(runRows || []);
      setSuppressedEvents(suppressedRows || []);
    } catch (err) {
      setError(err?.message || 'Failed to load CRM data quality summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const trustedLeads = leads.filter(isLeadVisibleInSalesViews);
    const hiddenLeads = leads.length - trustedLeads.length;
    const eligibleLeads = leads.filter((lead) => getLeadCleanupEligibility(lead).eligible);
    const trustedWebsiteLeads = websiteLeads.filter(isWebsiteLeadVisibleInSalesViews);
    const hiddenWebsiteLeads = websiteLeads.length - trustedWebsiteLeads.length;
    const eligibleWebsiteLeads = websiteLeads.filter((lead) => getWebsiteLeadCleanupEligibility(lead).eligible);
    const quarantined = leads.filter((lead) => ['quarantine_candidate', 'quarantined'].includes(lead.quality_review_status)).length;
    const duplicates = leads.filter((lead) => lead.quality_review_status === 'duplicate_candidate' || lead.dedupe_status === 'duplicate_candidate' || lead.dedupe_duplicate_of).length;
    const archivedWebsite = websiteLeads.filter((lead) => lead.archived === true || lead.lead_status === 'ignored').length;
    const automationDisabledWebsite = websiteLeads.filter((lead) => lead.automation_enabled === false).length;
    const lastRun = backfillRuns[0] || null;
    const lastMeta = parseMeta(lastRun);

    return {
      rawLeads: leads.length,
      trustedLeads: trustedLeads.length,
      hiddenLeads,
      trustedRate: pct(trustedLeads.length, leads.length),
      quarantineCandidates: quarantined,
      duplicateCandidates: duplicates,
      eligibleLeads: eligibleLeads.length,
      rawWebsiteLeads: websiteLeads.length,
      trustedWebsiteLeads: trustedWebsiteLeads.length,
      hiddenWebsiteLeads,
      websiteTrustedRate: pct(trustedWebsiteLeads.length, websiteLeads.length),
      archivedWebsite,
      automationDisabledWebsite,
      eligibleWebsiteLeads: eligibleWebsiteLeads.length,
      suppressedOutbound: suppressedEvents.length,
      lastRun,
      lastMeta,
    };
  }, [leads, websiteLeads, backfillRuns, suppressedEvents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CRM Data Quality</h2>
          <p className="mt-1 text-sm text-muted-foreground">Raw vs trusted visibility, quality-review status, backfill run proof, and outbound suppression proof.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Trusted Leads" value={stats.trustedLeads} subtext={`${stats.rawLeads} raw · ${stats.trustedRate} trusted`} icon={CheckCircle2} tone="good" />
        <StatCard label="Hidden Leads" value={stats.hiddenLeads} subtext="Quality-review, duplicate, internal, or raw-import signals" icon={AlertTriangle} tone={stats.hiddenLeads > 0 ? 'warn' : 'good'} />
        <StatCard label="Duplicate Candidates" value={stats.duplicateCandidates} subtext="Manual keeper review required" icon={Database} tone={stats.duplicateCandidates > 0 ? 'warn' : 'good'} />
        <StatCard label="Guarded Cleanup Eligible" value={stats.eligibleLeads} subtext="Requires review, backup, and confirmation" icon={ShieldCheck} tone={stats.eligibleLeads > 0 ? 'warn' : 'good'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Trusted Website Leads" value={stats.trustedWebsiteLeads} subtext={`${stats.rawWebsiteLeads} raw · ${stats.websiteTrustedRate} trusted`} icon={CheckCircle2} tone="good" />
        <StatCard label="Archived / Ignored" value={stats.archivedWebsite} subtext="Hidden from normal Website Leads" icon={Archive} tone={stats.archivedWebsite > 0 ? 'info' : 'good'} />
        <StatCard label="Automation Disabled" value={stats.automationDisabledWebsite} subtext="Protected from outbound automation" icon={ShieldCheck} tone="info" />
        <StatCard label="Outbound Suppressed" value={stats.suppressedOutbound} subtext="Guardrail skip events in recent logs" icon={Send} tone={stats.suppressedOutbound > 0 ? 'info' : 'good'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-lg font-semibold text-foreground">Latest Backfill Proof</h3>
          {!stats.lastRun ? (
            <p className="mt-3 text-sm text-muted-foreground">No `crm_quality_backfill` audit events found yet. Run a dry-run from Lead Quality Control after publish.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p><span className="font-semibold">Status:</span> {stats.lastRun.status}</p>
              <p><span className="font-semibold">When:</span> {formatDate(stats.lastRun.created_date)}</p>
              <p><span className="font-semibold">Scanned:</span> {stats.lastMeta?.scanned?.leads || 0} Leads / {stats.lastMeta?.scanned?.website_leads || 0} WebsiteLeads</p>
              <p><span className="font-semibold">Eligible:</span> {stats.lastMeta?.eligible?.leads || 0} Leads / {stats.lastMeta?.eligible?.website_leads || 0} WebsiteLeads</p>
              <p><span className="font-semibold">Applied:</span> {stats.lastMeta?.applied?.leads || 0} Leads / {stats.lastMeta?.applied?.website_leads || 0} WebsiteLeads</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h3 className="text-lg font-semibold text-foreground">How to Read This</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>Trusted counts are the records normal sales views should treat as usable.</p>
            <p>Hidden counts are records with quarantine, duplicate, test, internal, archived, ignored, or reserved phone/email/source markers.</p>
            <p>Outbound suppressed events prove automation tried to run but was blocked by lead-quality guardrails.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-lg font-semibold text-foreground">Recent Backfill Runs</h3>
          <p className="text-xs text-muted-foreground">Rows show Leads / WebsiteLeads counts.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Scanned</th>
                <th className="px-3 py-2 text-left">Applied</th>
              </tr>
            </thead>
            <tbody>
              {backfillRuns.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-8 text-center text-sm text-muted-foreground">No backfill runs logged yet.</td></tr>
              ) : (
                backfillRuns.map((event) => <RunRow key={event.id} event={event} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
