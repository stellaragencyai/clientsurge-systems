import { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, AlertCircle, AlertTriangle, Trash2, X, RefreshCw, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fetchLeadPipelineSummary } from "@/lib/leadPipelineApi";
import { getLeadCleanupEligibility, getTrustedLeadQueryFilter, isLeadVisibleInSalesViews } from "@/lib/leadCleanupGuards";

const PAGE_SIZE = 25;
const KPI_PAGE_SIZE = 500;
const KPI_MAX_ROWS = 25000;

// ── Safe field helpers — never throw on missing/undefined ──
const safeStr = (val, fallback = "—") => (val != null && String(val).trim() !== "") ? String(val) : fallback;
const safeNum = (val, fallback = 0) => (typeof val === "number" && !isNaN(val)) ? val : fallback;
const safeDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  } catch {
    return "—";
  }
};

// Lead score categories
function getIntelligenceSegmentBadge(segment) {
  const styles = {
    HOT_LEADS: "bg-red-100 text-red-800",
    HIGH_INTENT: "bg-orange-100 text-orange-800",
    ENGAGED: "bg-cyan-100 text-cyan-800",
    NURTURE: "bg-blue-100 text-blue-800",
    DORMANT: "bg-gray-100 text-gray-800",
    COLD: "bg-slate-100 text-slate-800",
  };
  const labels = {
    HOT_LEADS: "Hot",
    HIGH_INTENT: "High Intent",
    ENGAGED: "Engaged",
    NURTURE: "Nurture",
    DORMANT: "Dormant",
    COLD: "Cold",
  };
  return { label: labels[segment] || segment || "Unknown", color: styles[segment] || "bg-gray-100 text-gray-800" };
}

// Row highlight based on lead_state
function getRowHighlight(leadState) {
  const highlights = {
    HOT: "bg-red-50/30 hover:bg-red-50/50",
    BOOKED: "bg-green-50/30 hover:bg-green-50/50",
    WON: "bg-green-100/20 hover:bg-green-100/30",
    ENGAGED: "bg-blue-50/20 hover:bg-blue-50/40",
    DORMANT: "bg-gray-50/30 hover:bg-gray-50/50",
    NEW: "hover:bg-primary/5 transition-colors",
  };
  return highlights[leadState] || "hover:bg-primary/5 transition-colors";
}

function baseFilterState() {
  return {
    status: "",
    lead_state: "",
    intelligence_segment: "",
    scoreMin: "",
    scoreMax: "",
    includeFlagged: false,
  };
}

function matchesLeadFilters(lead, filters) {
  if (filters.status && lead.status !== filters.status) return false;
  if (filters.lead_state && lead.lead_state !== filters.lead_state) return false;
  if (filters.intelligence_segment && lead.intelligence_segment !== filters.intelligence_segment) return false;
  if (filters.scoreMin || filters.scoreMax) {
    const score = Number(lead.intelligence_score || 0);
    if (filters.scoreMin && score < parseInt(filters.scoreMin, 10)) return false;
    if (filters.scoreMax && score > parseInt(filters.scoreMax, 10)) return false;
  }
  return true;
}

function computeKpisFromLeads(allLeads, filters) {
  const rawRows = Array.isArray(allLeads) ? allLeads : [];
  const visibleRows = filters.includeFlagged ? rawRows : rawRows.filter(isLeadVisibleInSalesViews);
  const filteredRows = visibleRows.filter((lead) => matchesLeadFilters(lead, filters));
  const statusCounts = filteredRows.reduce((counts, lead) => {
    const status = lead.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  return {
    total: filteredRows.length,
    rawTotal: rawRows.length,
    hidden: Math.max(0, rawRows.length - visibleRows.length),
    hot: filteredRows.filter((lead) => lead.lead_state === "HOT" || lead.intelligence_segment === "HOT_LEADS").length,
    new: statusCounts.New || filteredRows.filter((lead) => lead.lead_state === "NEW").length,
    booked: statusCounts.Booked || filteredRows.filter((lead) => lead.lead_state === "BOOKED").length,
  };
}

async function fetchAllLeadsForKpis() {
  const allRows = [];
  for (let skip = 0; skip < KPI_MAX_ROWS; skip += KPI_PAGE_SIZE) {
    const page = await base44.entities.Leads.list("-created_date", KPI_PAGE_SIZE, skip);
    const rows = Array.isArray(page) ? page : [];
    allRows.push(...rows);
    if (rows.length < KPI_PAGE_SIZE) break;
  }
  return allRows;
}

export default function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState(baseFilterState());
  const [sort, setSort] = useState({ field: "created_date", order: -1 });
  const [kpis, setKpis] = useState({ total: 0, rawTotal: 0, hidden: 0, hot: 0, new: 0, booked: 0 });
  const [duplicateWarnings, setDuplicateWarnings] = useState(0);

  // Build query filter for the canonical Leads entity
  const buildFilter = useCallback((includeTrustedScope = true) => {
    const f = {};
    if (includeTrustedScope && !filters.includeFlagged) {
      Object.assign(f, getTrustedLeadQueryFilter());
    }
    if (filters.status) f.status = filters.status;
    if (filters.lead_state) f.lead_state = filters.lead_state;
    if (filters.intelligence_segment) f.intelligence_segment = filters.intelligence_segment;
    if (filters.scoreMin || filters.scoreMax) {
      f.intelligence_score = {};
      if (filters.scoreMin) f.intelligence_score.$gte = parseInt(filters.scoreMin, 10);
      if (filters.scoreMax) f.intelligence_score.$lte = parseInt(filters.scoreMax, 10);
    }
    return f;
  }, [filters]);

  const refreshKpisFromReadableRows = useCallback(async () => {
    const allRows = await fetchAllLeadsForKpis();
    const directKpis = computeKpisFromLeads(allRows, filters);
    setKpis(directKpis);
    setDuplicateWarnings(0);
    return directKpis;
  }, [filters]);

  // Load KPIs. The backend summary is the fast path, but the direct Leads-read
  // fallback is authoritative for this screen because it uses the same entity the
  // table can already read. This prevents 0 KPI cards while rows are visible.
  useEffect(() => {
    let cancelled = false;

    const loadKpis = async () => {
      try {
        const data = await fetchLeadPipelineSummary({ limit: 1, offset: 0, includeFlagged: filters.includeFlagged });
        const summary = data?.summary || {};
        const statusCounts = summary.status_counts || {};
        const total = Number(summary.trusted_leads ?? summary.total_leads ?? 0);
        const rawTotal = Number(summary.raw_total_leads ?? summary.total_leads ?? total);
        const backendKpis = {
          total,
          rawTotal,
          hidden: summary.hidden_junk_leads ?? Math.max(0, Number(rawTotal || 0) - Number(total || 0)),
          hot: summary.segment_counts?.hot || summary.segment_counts?.HOT || summary.segment_counts?.HOT_LEADS || 0,
          new: statusCounts.New || 0,
          booked: statusCounts.Booked || 0,
        };

        if (!cancelled && (backendKpis.total > 0 || backendKpis.rawTotal > 0)) {
          setKpis(backendKpis);
          setDuplicateWarnings(0);
          return;
        }

        if (!cancelled) await refreshKpisFromReadableRows();
      } catch {
        if (!cancelled) await refreshKpisFromReadableRows().catch(() => null);
      }
    };

    loadKpis();
    return () => { cancelled = true; };
  }, [filters, refreshKpisFromReadableRows]);

  // Load paginated leads with real-time updates
  useEffect(() => {
    let cancelled = false;

    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const filter = buildFilter(true);
        const rawFallbackFilter = buildFilter(false);
        const offset = page * PAGE_SIZE;
        const sortKey = sort.field === "intelligence_score" ? "intelligence_score" : "created_date";
        const sortValue = sort.order === 1 ? sortKey : `-${sortKey}`;
        const fetchLimit = filters.includeFlagged ? PAGE_SIZE + 1 : PAGE_SIZE * 4;

        // Admin reads via user-scoped SDK (RLS allows admin to read all Leads). If advanced
        // operators fail in Base44 SDK, retry raw and apply client-side trusted filtering.
        let results;
        try {
          results = await base44.entities.Leads.filter(filter, sortValue, fetchLimit, offset);
        } catch (primaryError) {
          if (filters.includeFlagged) throw primaryError;
          results = await base44.entities.Leads.filter(rawFallbackFilter, sortValue, fetchLimit, offset);
        }

        let items = Array.isArray(results) ? results : [];
        if (!filters.includeFlagged) {
          items = items.filter(isLeadVisibleInSalesViews);
        }
        items = items.slice(0, PAGE_SIZE);

        // Client-side search filter (SDK doesn't support full-text search)
        if (search && items.length > 0) {
          const q = search.toLowerCase();
          items = items.filter((l) =>
            safeStr(l?.full_name, "").toLowerCase().includes(q) ||
            safeStr(l?.business_name, "").toLowerCase().includes(q) ||
            safeStr(l?.email, "").toLowerCase().includes(q)
          );
        }

        if (!cancelled) {
          setLeads(items);
          if (items.length > 0 && kpis.total === 0) {
            refreshKpisFromReadableRows().catch(() => null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load leads. Check your connection and try again.");
          setLeads([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLeads();

    // Subscribe to lead updates — wrapped in try/catch so a realtime
    // infrastructure issue never crashes the tab
    let unsubscribe = null;
    try {
      unsubscribe = base44.entities.Leads.subscribe((event) => {
        if (!event || event.type !== "update" || !event.data) return;
        setLeads((prev) =>
          prev.map((l) => (l?.id === event.entity_id ? { ...l, ...event.data } : l))
            .filter((l) => filters.includeFlagged || isLeadVisibleInSalesViews(l))
        );
        refreshKpisFromReadableRows().catch(() => null);
      });
    } catch {
      // Realtime subscription failed — table still works, just not real-time
    }

    return () => {
      cancelled = true;
      if (typeof unsubscribe === "function") {
        try { unsubscribe(); } catch { /* noop */ }
      }
    };
  }, [page, filters, sort, buildFilter, search, kpis.total, refreshKpisFromReadableRows]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleSort = (field) => {
    if (sort.field === field) {
      setSort((prev) => ({ ...prev, order: prev.order === 1 ? -1 : 1 }));
    } else {
      setSort({ field, order: -1 });
    }
    setPage(0);
  };

  const renderSortIcon = (field) => {
    if (sort.field !== field) return null;
    return sort.order === 1
      ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />;
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget?.id) return;
    const eligibility = getLeadCleanupEligibility(deleteTarget);
    if (!eligibility.eligible) {
      setError(`Delete blocked: ${eligibility.blockers.join('; ') || 'record is not verified junk'}`);
      return;
    }

    const phrase = window.prompt(
      `This record passed verified-junk guardrails.\n\nLead: ${deleteTarget.business_name || deleteTarget.full_name || deleteTarget.id}\nReason: ${(eligibility.signals || []).slice(0, 3).join('; ')}\n\nType DELETE JUNK to permanently delete it.`
    );
    if (phrase !== "DELETE JUNK") return;

    setDeleting(true);
    try {
      await base44.entities.Leads.delete(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setKpis((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        rawTotal: Math.max(0, prev.rawTotal - 1),
      }));
      setDeleteTarget(null);
      refreshKpisFromReadableRows().catch(() => null);
    } catch (err) {
      setError(err?.message || "Failed to delete verified junk lead");
    } finally {
      setDeleting(false);
    }
  };

  const handleQuarantineLead = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await base44.entities.Leads.update(deleteTarget.id, {
        quality_review_status: 'quarantined',
        quality_reason: deleteTarget.quality_reason || 'Manually quarantined from Leads table',
        audited_at: new Date().toISOString(),
      });
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      refreshKpisFromReadableRows().catch(() => null);
    } catch (err) {
      setError(err?.message || "Failed to quarantine lead");
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setError("");
    setPage(0);
    setFilters(baseFilterState());
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white p-4 border border-border text-center">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{filters.includeFlagged ? 'Raw Total' : 'Trusted'}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{kpis.total}</p>
          {!filters.includeFlagged && kpis.rawTotal > kpis.total && (
            <p className="mt-1 text-[10px] text-muted-foreground">{kpis.rawTotal} raw · {kpis.hidden} hidden</p>
          )}
        </div>
        <div className="rounded-lg bg-white p-4 border border-border text-center">
          <p className="text-[11px] text-red-600 font-bold uppercase tracking-widest">Hot</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{kpis.hot}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-border text-center">
          <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest">New</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{kpis.new}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-border text-center">
          <p className="text-[11px] text-green-600 font-bold uppercase tracking-widest">Booked</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{kpis.booked}</p>
        </div>
      </div>

      {/* Trusted view warning */}
      {!filters.includeFlagged && kpis.hidden > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Trusted view is active.</strong> {kpis.hidden} quarantine/test/duplicate lead(s) are hidden from this sales table. Use Lead Quality Control to review or delete verified junk.
          </div>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarnings > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>{duplicateWarnings} potential duplicate(s) found</strong> by email address. Review in Lead Quality Control.
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3 rounded-lg border border-border bg-white p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search business name or email..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={filters.lead_state}
            onChange={(e) => handleFilterChange("lead_state", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">State</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="ENGAGED">Engaged</option>
            <option value="HOT">Hot</option>
            <option value="BOOKED">Booked</option>
            <option value="WON">Won</option>
          </select>

          <select
            value={filters.intelligence_segment}
            onChange={(e) => handleFilterChange("intelligence_segment", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">Segment</option>
            <option value="HOT_LEADS">Hot</option>
            <option value="HIGH_INTENT">High Intent</option>
            <option value="ENGAGED">Engaged</option>
            <option value="NURTURE">Nurture</option>
          </select>

          <input
            type="number"
            placeholder="Score min"
            min="0"
            max="100"
            value={filters.scoreMin}
            onChange={(e) => handleFilterChange("scoreMin", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          />

          <input
            type="number"
            placeholder="Score max"
            min="0"
            max="100"
            value={filters.scoreMax}
            onChange={(e) => handleFilterChange("scoreMax", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          />

          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.includeFlagged}
              onChange={(e) => handleFilterChange("includeFlagged", e.target.checked)}
              className="rounded"
            />
            Show hidden/test/duplicates
          </label>
        </div>
      </div>

      {/* Error banner with retry */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-100 transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="text-sm" style={{ minWidth: "1100px", width: "100%" }}>
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "120px" }}>Name</th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "140px" }}>Business</th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "180px" }}>Contact</th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "130px" }}>
                  <button onClick={() => handleSort("intelligence_score")} className="hover:text-primary transition-colors">
                    Intelligence {renderSortIcon("intelligence_score")}
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "90px" }}>State</th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "110px" }}>Quality</th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "100px" }}>
                  <button onClick={() => handleSort("created_date")} className="hover:text-primary transition-colors">
                    Created {renderSortIcon("created_date")}
                  </button>
                </th>
                <th className="px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap" style={{ minWidth: "70px" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-3 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No trusted leads found</p>
                    <p className="text-xs mt-1">Try adjusting filters or enable “Show hidden/test/duplicates” for raw records.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const seg = getIntelligenceSegmentBadge(lead?.intelligence_segment);
                  const hidden = !isLeadVisibleInSalesViews(lead);
                  const eligibility = getLeadCleanupEligibility(lead);
                  return (
                    <tr key={lead?.id || Math.random()} className={`${getRowHighlight(lead?.lead_state)} border-none ${hidden ? 'opacity-80' : ''}`}>
                      <td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">{safeStr(lead?.full_name)}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{safeStr(lead?.business_name)}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="truncate" style={{ maxWidth: "180px" }}>{safeStr(lead?.email)}</div>
                          {lead?.phone && <div className="text-xs">{lead.phone}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                            {safeNum(lead?.intelligence_score)}
                          </span>
                          {lead?.intelligence_segment && (
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${seg.color}`}>
                              {seg.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                          {safeStr(lead?.lead_state, "NEW")}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {hidden ? (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800" title={lead?.quality_reason || eligibility.signals.join('; ')}>Hidden</span>
                        ) : lead?.quality_review_status === "verified_outbound_ready" ? (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">✓ Verified</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">{safeStr(lead?.quality_review_status, "active")}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-sm whitespace-nowrap">
                        {safeDate(lead?.created_date)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(lead)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${eligibility.eligible ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'}`}
                          title={eligibility.eligible ? "Delete verified junk" : "Delete blocked — open to see guardrail reason"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50">
          <p className="text-sm text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, page * PAGE_SIZE + leads.length)} of ~{kpis.total}{!filters.includeFlagged && kpis.rawTotal > kpis.total ? ` trusted (${kpis.rawTotal} raw)` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-2 rounded text-sm font-medium border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted-foreground px-2">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={leads.length < PAGE_SIZE || loading}
              className="px-3 py-2 rounded text-sm font-medium border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (() => {
        const eligibility = getLeadCleanupEligibility(deleteTarget);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${eligibility.eligible ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Trash2 className={`w-5 h-5 ${eligibility.eligible ? 'text-red-600' : 'text-amber-600'}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{eligibility.eligible ? 'Delete Verified Junk?' : 'Delete Blocked'}</h3>
                </div>
                <button onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {eligibility.eligible
                    ? 'This record has strict junk/test/duplicate signals and no conversion evidence. Deletion still requires the DELETE JUNK confirmation phrase.'
                    : 'This record is not safe to delete. You can quarantine it instead, but hard deletion is blocked to protect real leads.'}
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{safeStr(deleteTarget?.full_name)}</p>
                  <p className="text-xs text-muted-foreground">{safeStr(deleteTarget?.business_name)}</p>
                  <p className="text-xs text-muted-foreground">{safeStr(deleteTarget?.email)}</p>
                </div>
                {eligibility.signals.length > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Junk signals</p>
                    <ul className="text-xs text-red-700 list-disc pl-4 space-y-0.5">
                      {eligibility.signals.slice(0, 5).map((signal) => <li key={signal}>{signal}</li>)}
                    </ul>
                  </div>
                )}
                {eligibility.blockers.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Delete blockers</p>
                    <ul className="text-xs text-amber-700 list-disc pl-4 space-y-0.5">
                      {eligibility.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-5 border-t border-border">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                {!eligibility.eligible && (
                  <button
                    onClick={handleQuarantineLead}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
                  >
                    {deleting ? 'Saving...' : 'Quarantine Instead'}
                  </button>
                )}
                <button
                  onClick={handleDeleteLead}
                  disabled={deleting || !eligibility.eligible}
                  className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </span>
                  ) : (
                    "Delete Verified Junk"
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
