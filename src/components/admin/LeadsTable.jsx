import { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, AlertCircle, AlertTriangle, Trash2, X, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAGE_SIZE = 25;

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

export default function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    lead_state: "",
    intelligence_segment: "",
    scoreMin: "",
    scoreMax: "",
  });
  const [sort, setSort] = useState({ field: "created_date", order: -1 });
  const [kpis, setKpis] = useState({ total: 0, hot: 0, new: 0, booked: 0 });
  const [duplicateWarnings, setDuplicateWarnings] = useState(0);

  // Build query filter for the canonical Leads entity
  const buildFilter = useCallback(() => {
    const f = {};
    if (filters.status) f.status = filters.status;
    if (filters.lead_state) f.lead_state = filters.lead_state;
    if (filters.intelligence_segment) f.intelligence_segment = filters.intelligence_segment;
    if (filters.scoreMin || filters.scoreMax) {
      f.intelligence_score = {};
      if (filters.scoreMin) f.intelligence_score.$gte = parseInt(filters.scoreMin, 10);
      if (filters.scoreMax) f.intelligence_score.$lte = parseInt(filters.scoreMax, 10);
    }
    // Exclude quarantined records from the main leads view
    f.quality_review_status = { $nin: ["quarantine_candidate", "quarantined"] };
    return f;
  }, [filters]);

  // Load KPIs — uses asServiceRole (admin-only page, safe elevation)
  useEffect(() => {
    const loadKpis = async () => {
      try {
        const allLeads = await base44.asServiceRole.entities.Leads.filter({}, "-created_date", 500);
        const list = Array.isArray(allLeads) ? allLeads : [];

        const emailCounts = {};
        const duplicates = new Set();
        list.forEach((l) => {
          const key = l?.normalized_email || l?.email;
          if (key) {
            emailCounts[key] = (emailCounts[key] || 0) + 1;
            if (emailCounts[key] > 1) duplicates.add(key);
          }
        });

        setDuplicateWarnings(duplicates.size);
        setKpis({
          total: list.length,
          hot: list.filter((l) => safeNum(l?.intelligence_score) >= 80).length,
          new: list.filter((l) => l?.lead_state === "NEW").length,
          booked: list.filter((l) => l?.lead_state === "BOOKED").length,
        });
      } catch {
        // KPIs are secondary — silent fail keeps the table usable
      }
    };
    loadKpis();
  }, []);

  // Load paginated leads with real-time updates
  useEffect(() => {
    let cancelled = false;

    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const filter = buildFilter();
        const offset = page * PAGE_SIZE;
        const sortKey = sort.field === "intelligence_score" ? "intelligence_score" : "created_date";
        const sortValue = sort.order === 1 ? sortKey : `-${sortKey}`;

        // asServiceRole for admin reads — canonical Leads entity
        const results = await base44.asServiceRole.entities.Leads.filter(
          filter,
          sortValue,
          PAGE_SIZE + 1,
          offset
        );

        let items = Array.isArray(results) ? results.slice(0, PAGE_SIZE) : [];

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
        );
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
  }, [page, filters, sort, buildFilter, search]);

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
    setDeleting(true);
    try {
      await base44.asServiceRole.entities.Leads.delete(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setKpis((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.message || "Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white p-4 border border-border text-center">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Total</p>
          <p className="text-3xl font-bold text-foreground mt-2">{kpis.total}</p>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
            onClick={() => { setError(""); setPage(0); setFilters({ status: "", lead_state: "", intelligence_segment: "", scoreMin: "", scoreMax: "" }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-100 transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Business</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  <button onClick={() => handleSort("intelligence_score")} className="hover:text-primary transition-colors">
                    Intelligence {renderSortIcon("intelligence_score")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">State</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  <button onClick={() => handleSort("created_date")} className="hover:text-primary transition-colors">
                    Created {renderSortIcon("created_date")}
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No leads found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or check back later.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const seg = getIntelligenceSegmentBadge(lead?.intelligence_segment);
                  return (
                    <tr key={lead?.id || Math.random()} className={`${getRowHighlight(lead?.lead_state)} border-none`}>
                      <td className="px-4 py-3 font-medium text-foreground">{safeStr(lead?.full_name)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{safeStr(lead?.business_name)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="space-y-1">
                          <div>{safeStr(lead?.email)}</div>
                          {lead?.phone && <div className="text-xs">{lead.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                          {safeStr(lead?.lead_state, "NEW")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-sm">
                        {safeDate(lead?.created_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setDeleteTarget(lead)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete lead"
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
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, page * PAGE_SIZE + leads.length)} of ~{kpis.total}
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
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Delete Lead?</h3>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-3">
                This will permanently delete this lead record. This action cannot be undone.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{safeStr(deleteTarget?.full_name)}</p>
                <p className="text-xs text-muted-foreground">{safeStr(deleteTarget?.business_name)}</p>
                <p className="text-xs text-muted-foreground">{safeStr(deleteTarget?.email)}</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-border">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </span>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}