import { useState, useEffect, useCallback } from "react";
import { Download, Play, Loader2, RefreshCw, Globe, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QualityOverview from "./lead-qc/QualityOverview";
import QualityLeadsTable from "./lead-qc/QualityLeadsTable";
import DuplicateGroups from "./lead-qc/DuplicateGroups";
import { getLeadCleanupEligibility, isLeadVisibleInSalesViews } from "@/lib/leadCleanupGuards";

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'internal', label: 'Internal/Test Records' },
  { id: 'quarantine', label: 'Quarantine Candidates' },
  { id: 'duplicates', label: 'Duplicate Groups' },
  { id: 'enrichment', label: 'Missing Website Lookup' },
  { id: 'export', label: 'Export Review' },
];

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadLeadCsv(rows, filenamePrefix) {
  const headers = [
    'Lead ID', 'Business Name', 'Full Name', 'Email', 'Phone', 'Website', 'Website URL',
    'Business Type', 'City', 'State', 'Source', 'Created Date', 'Quality Status',
    'Dedupe Status', 'Duplicate Of', 'Confidence', 'Reason Codes', 'Quality Reason'
  ];
  const dataRows = rows.map((l) => [
    l.id,
    l.business_name || '',
    l.full_name || '',
    l.email || '',
    l.phone || '',
    l.website || '',
    l.website_url || l.canonical_website_url || '',
    l.business_type || '',
    l.city || '',
    l.state || '',
    l.source || '',
    l.created_date ? new Date(l.created_date).toISOString() : '',
    l.quality_review_status || 'active',
    l.dedupe_status || '',
    l.dedupe_duplicate_of || '',
    l.quality_confidence || 0,
    (l.quality_reason_codes || []).join('; '),
    l.quality_reason || '',
  ]);
  const csv = [headers, ...dataRows].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadQualityControl() {
  const [activeTab, setActiveTab] = useState('overview');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    trusted_visible: 0,
    hidden_from_sales: 0,
    quarantine_candidates: 0,
    duplicate_groups: 0,
    cleanup_eligible: 0,
    missing_website: 0,
    missing_phone: 0,
    missing_city_state: 0,
    outbound_ready: 0,
  });
  const [auditResult, setAuditResult] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const allLeads = await base44.entities.Leads.filter({}, '-created_date', 500);
      const list = allLeads || [];
      const trustedVisible = list.filter(isLeadVisibleInSalesViews);
      const cleanupEligible = list.filter((l) => getLeadCleanupEligibility(l).eligible);

      // Compute counts
      const c = {
        total: list.length,
        active: list.filter(l => (l.quality_review_status || 'active') === 'active').length,
        trusted_visible: trustedVisible.length,
        hidden_from_sales: Math.max(0, list.length - trustedVisible.length),
        quarantine_candidates: list.filter(l => l.quality_review_status === 'quarantine_candidate' || l.quality_review_status === 'quarantined').length,
        duplicate_groups: 0,
        cleanup_eligible: cleanupEligible.length,
        missing_website: list.filter(l => !l.website && !l.website_url && (l.quality_review_status || 'active') === 'active').length,
        missing_phone: list.filter(l => !l.phone).length,
        missing_city_state: list.filter(l => !l.city && !l.state).length,
        outbound_ready: list.filter(l => l.quality_review_status === 'verified_outbound_ready').length,
      };

      // Count duplicate groups
      const dupGroups = {};
      list.forEach(l => {
        if (l.quality_review_status === 'duplicate_candidate' || l.dedupe_status === 'duplicate_candidate') {
          const explicit = l.dedupe_group_key;
          const match = (l.quality_reason || '').match(/group:\s*(.+)\)/);
          const key = explicit || (match ? match[1] : l.dedupe_duplicate_of || 'ungrouped');
          dupGroups[key] = (dupGroups[key] || 0) + 1;
        }
      });
      c.duplicate_groups = Object.keys(dupGroups).length;

      setCounts(c);
      setLeads(list);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const runAudit = async () => {
    setAuditLoading(true);
    setAuditResult(null);
    try {
      let offset = 0;
      const batchSize = 500;
      let totalAudited = 0, totalQuarantined = 0, totalDuplicates = 0, totalEnrichment = 0, totalActive = 0;
      let hasMore = true;

      while (hasMore) {
        const res = await base44.functions.invoke('runLeadQualityAudit', { mode: 'full', limit: batchSize, offset });
        const data = res?.data || res;
        const s = data?.summary || {};
        totalAudited += s.total_audited || 0;
        totalQuarantined += s.quarantine_candidates || 0;
        totalDuplicates += s.duplicate_candidates || 0;
        totalEnrichment += s.enrichment_needed || 0;
        totalActive += s.active || 0;
        hasMore = s.has_more === true;
        offset += batchSize;
        setAuditResult({
          summary: {
            total_audited: totalAudited,
            quarantine_candidates: totalQuarantined,
            duplicate_candidates: totalDuplicates,
            enrichment_needed: totalEnrichment,
            active: totalActive,
            audited_at: new Date().toISOString(),
          },
          progress: hasMore ? `Processing batch ${Math.floor(offset / batchSize) + 1}...` : 'Complete',
        });
      }

      await loadLeads();
    } catch (err) {
      setAuditResult({ error: err.message });
    } finally {
      setAuditLoading(false);
    }
  };

  const runEnrichment = async () => {
    setEnrichLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await base44.functions.invoke('processLeadEnrichmentQueue', {
        lead_ids: ids.length > 0 ? ids : null,
        limit: 25,
      });
      await loadLeads();
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Enrichment error:', err);
    } finally {
      setEnrichLoading(false);
    }
  };

  const getSelectedLeads = () => leads.filter((lead) => selectedIds.has(lead.id));

  const runDeleteVerifiedJunk = async () => {
    const selected = getSelectedLeads();
    const evaluations = selected.map((lead) => ({ lead, eligibility: getLeadCleanupEligibility(lead) }));
    const eligible = evaluations.filter((item) => item.eligibility.eligible).map((item) => item.lead);
    const blocked = evaluations.filter((item) => !item.eligibility.eligible);

    setCleanupResult({
      dry_run: true,
      selected_count: selected.length,
      eligible_count: eligible.length,
      blocked_count: blocked.length,
      blocked_preview: blocked.slice(0, 10).map(({ lead, eligibility }) => ({
        id: lead.id,
        business_name: lead.business_name,
        blockers: eligibility.blockers,
      })),
      deleted_count: 0,
      failed_count: 0,
    });

    if (eligible.length === 0) return;

    const phrase = window.prompt(
      `Dry run complete. ${eligible.length} selected lead(s) are eligible for verified-junk deletion and ${blocked.length} are blocked.\n\nA CSV backup will download before deletion.\n\nType DELETE JUNK to permanently delete the eligible records.`
    );

    if (phrase !== 'DELETE JUNK') {
      setCleanupResult((prev) => ({ ...prev, cancelled: true }));
      return;
    }

    setActionLoading(true);
    const deleted = [];
    const failed = [];
    try {
      downloadLeadCsv(eligible, 'clientsurge-verified-junk-delete-backup');
      for (const lead of eligible) {
        try {
          // Guard is intentionally re-evaluated at execution time.
          const eligibility = getLeadCleanupEligibility(lead);
          if (!eligibility.eligible) {
            failed.push({ id: lead.id, business_name: lead.business_name, error: 'became ineligible before delete' });
            continue;
          }
          await base44.entities.Leads.delete(lead.id);
          deleted.push(lead.id);
        } catch (error) {
          failed.push({ id: lead.id, business_name: lead.business_name, error: error?.message || 'delete failed' });
        }
      }
      setCleanupResult({
        dry_run: false,
        selected_count: selected.length,
        eligible_count: eligible.length,
        blocked_count: blocked.length,
        deleted_count: deleted.length,
        failed_count: failed.length,
        failed,
        completed_at: new Date().toISOString(),
      });
      await loadLeads();
      setSelectedIds(new Set());
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (selectedIds.size === 0) return;
    if (action === 'delete_verified_junk') {
      await runDeleteVerifiedJunk();
      return;
    }

    setActionLoading(true);
    try {
      const ids = Array.from(selectedIds);
      let status, reason;
      if (action === 'quarantine') {
        status = 'quarantined';
        reason = 'Manually quarantined by admin';
      } else if (action === 'safe') {
        status = 'active';
        reason = 'Manually marked safe by admin';
      } else if (action === 'outbound') {
        status = 'verified_outbound_ready';
        reason = 'Manually verified for outbound by admin';
      }

      const updates = ids.map(id => ({ id, quality_review_status: status, quality_reason: reason, audited_at: new Date().toISOString() }));
      await base44.entities.Leads.bulkUpdate(updates);
      await loadLeads();
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const tabLeads = getTabLeads();
    if (selectedIds.size === tabLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tabLeads.map(l => l.id)));
    }
  };

  const exportCSV = () => {
    downloadLeadCsv(getTabLeads(), `lead-quality-${activeTab}`);
  };

  const getTabLeads = () => {
    switch (activeTab) {
      case 'internal':
        return leads.filter(l => (l.quality_reason_codes || []).some(c => c.startsWith('internal_test') || c === 'example_email' || c === 'test_phone_555' || c === 'generic_inquiry_name' || c === 'test_website') || !isLeadVisibleInSalesViews(l));
      case 'quarantine':
        return leads.filter(l => l.quality_review_status === 'quarantine_candidate' || l.quality_review_status === 'quarantined');
      case 'duplicates':
        return leads.filter(l => l.quality_review_status === 'duplicate_candidate' || l.dedupe_status === 'duplicate_candidate' || l.dedupe_duplicate_of);
      case 'enrichment':
        return leads.filter(l => l.enrichment_status === 'needs_lookup' && (l.quality_review_status || 'active') === 'active' && isLeadVisibleInSalesViews(l));
      case 'export':
        return leads.filter(l => l.quality_review_status === 'quarantine_candidate' || l.quality_review_status === 'quarantined' || l.quality_review_status === 'duplicate_candidate' || l.dedupe_status === 'duplicate_candidate' || !isLeadVisibleInSalesViews(l));
      default:
        return leads;
    }
  };

  const tabLeads = getTabLeads();
  const selectedLeads = getSelectedLeads();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Trusted lead views now hide junk/test/duplicate records by default.</p>
          <p className="text-xs mt-1">Hard deletion is blocked unless the selected record has strict junk signals and no booking, reply, payment, conversion, or revenue evidence.</p>
          <p className="text-xs mt-1">Current loaded sample: {counts.trusted_visible} trusted visible · {counts.hidden_from_sales} hidden from sales · {counts.cleanup_eligible} eligible for verified-junk deletion.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedIds(new Set()); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit result banner */}
      {auditResult && (
        <div className={`rounded-lg p-4 text-sm ${auditResult.error ? 'bg-red-50 text-red-700 border border-red-200' : auditLoading ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {auditResult.error ? (
            <p>Audit failed: {auditResult.error}</p>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold">{auditLoading ? "Audit Running..." : "Audit Complete"}</p>
              <p>Total: {auditResult.summary?.total_audited || 0} · Quarantine candidates: {auditResult.summary?.quarantine_candidates || 0} · Duplicate candidates: {auditResult.summary?.duplicate_candidates || 0} · Enrichment needed: {auditResult.summary?.enrichment_needed || 0}</p>
              {auditLoading && auditResult.progress && <p className="text-xs opacity-70">{auditResult.progress}</p>}
            </div>
          )}
        </div>
      )}

      {cleanupResult && (
        <div className={`rounded-lg p-4 text-sm ${cleanupResult.failed_count > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : cleanupResult.cancelled ? 'bg-gray-50 text-gray-700 border border-gray-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          <p className="font-semibold">{cleanupResult.dry_run ? 'Cleanup Dry Run Complete' : cleanupResult.cancelled ? 'Cleanup Cancelled' : 'Cleanup Complete'}</p>
          <p>Selected: {cleanupResult.selected_count || 0} · Eligible: {cleanupResult.eligible_count || 0} · Blocked: {cleanupResult.blocked_count || 0} · Deleted: {cleanupResult.deleted_count || 0} · Failed: {cleanupResult.failed_count || 0}</p>
          {cleanupResult.blocked_preview?.length > 0 && (
            <ul className="mt-2 text-xs list-disc pl-5 space-y-1">
              {cleanupResult.blocked_preview.slice(0, 5).map((item) => (
                <li key={item.id}>{item.business_name || item.id}: {(item.blockers || []).join('; ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'overview' && (
        <QualityOverview counts={counts} onRunAudit={runAudit} auditLoading={auditLoading} onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'internal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Internal / Test Records</h2>
              <p className="text-sm text-muted-foreground">Leads matching internal test patterns, example domains, 555 phone numbers, or other hidden-from-sales rules.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button onClick={runAudit} disabled={auditLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-40 transition-colors">
                {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Audit
              </button>
            </div>
          </div>
          <QualityLeadsTable leads={tabLeads} loading={loading} selectedIds={selectedIds} selectedLeads={selectedLeads} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onAction={handleAction} actionLoading={actionLoading} />
        </div>
      )}

      {activeTab === 'quarantine' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Quarantine Candidates</h2>
              <p className="text-sm text-muted-foreground">All leads flagged for quarantine — test records, raw imports, and non-target businesses.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button onClick={runAudit} disabled={auditLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-40 transition-colors">
                {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Audit
              </button>
            </div>
          </div>
          <QualityLeadsTable leads={tabLeads} loading={loading} selectedIds={selectedIds} selectedLeads={selectedLeads} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onAction={handleAction} actionLoading={actionLoading} />
        </div>
      )}

      {activeTab === 'duplicates' && (
        <DuplicateGroups leads={tabLeads} loading={loading} />
      )}

      {activeTab === 'enrichment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Missing Website Lookup</h2>
              <p className="text-sm text-muted-foreground">Trusted active leads missing website data — queued for Google Business Profile enrichment.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadLeads} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button onClick={runEnrichment} disabled={enrichLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-colors">
                {enrichLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />} Run Enrichment {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
            </div>
          </div>
          <QualityLeadsTable leads={tabLeads} loading={loading} selectedIds={selectedIds} selectedLeads={selectedLeads} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onAction={handleAction} actionLoading={actionLoading} />
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export Review</h2>
              <p className="text-sm text-muted-foreground">All flagged or hidden leads for manual review, CSV export, quarantine, or guarded verified-junk deletion.</p>
            </div>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export All Flagged ({tabLeads.length})
            </button>
          </div>
          <QualityLeadsTable leads={tabLeads} loading={loading} selectedIds={selectedIds} selectedLeads={selectedLeads} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} onAction={handleAction} actionLoading={actionLoading} />
        </div>
      )}
    </div>
  );
}
