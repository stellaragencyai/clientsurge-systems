import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, AlertCircle, AlertTriangle, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAGE_SIZE = 25;

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
  return { label: labels[segment] || segment, color: styles[segment] || "bg-gray-100 text-gray-800" };
}

// Row highlight based on lead_state for visual consistency
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

// Status badge styles
function getStatusBadge(status) {
  const styles = {
    Booked: "bg-green-100 text-green-800",
    Qualified: "bg-purple-100 text-purple-800",
    Contacted: "bg-blue-100 text-blue-800",
    Replied: "bg-cyan-100 text-cyan-800",
    New: "bg-gray-100 text-gray-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
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
    crm_tag: "",
    industry: "",
  });
  const [sort, setSort] = useState({ field: "last_activity_at", order: -1 });
  const [totalCount, setTotalCount] = useState(0);
  const [duplicateWarnings, setDuplicateWarnings] = useState(0);
  const [kpis, setKpis] = useState({
    total: 0,
    hot: 0,
    new: 0,
    booked: 0,
  });

  // Build query filter
  const buildFilter = useCallback(() => {
    const f = {};

    if (search) {
      // Search across business_name, email, phone, industry
      // Note: Leads SDK doesn't support full-text search, so we filter client-side OR build multiple queries
      // For now, we'll fetch and filter client-side with limit
    }

    if (filters.status) f.status = filters.status;
    if (filters.lead_state) f.lead_state = filters.lead_state;
    if (filters.intelligence_segment) f.intelligence_segment = filters.intelligence_segment;
    if (filters.crm_tag) f.crm_tag = filters.crm_tag;
    if (filters.industry) f.industry = filters.industry;
    
    if (filters.scoreMin || filters.scoreMax) {
      f.intelligence_score = {};
      if (filters.scoreMin) f.intelligence_score.$gte = parseInt(filters.scoreMin);
      if (filters.scoreMax) f.intelligence_score.$lte = parseInt(filters.scoreMax);
    }

    // Hide quarantined records by default — they're managed in Lead Quality Control
    f.quality_review_status = { $nin: ['quarantine_candidate', 'quarantined'] };

    return f;
  }, [search, filters]);

  // Load KPIs
  useEffect(() => {
    const loadKpis = async () => {
      try {
        // Single fetch for all KPIs + duplicate detection
        const allLeads = await base44.entities.Leads.filter({}, "id", 500);
        const leadsList = allLeads || [];

        // Count potential duplicates (same normalized email)
        const emailCounts = {};
        const duplicates = new Set();
        leadsList.forEach((l) => {
          const key = l.normalized_email || l.email;
          if (key) {
            emailCounts[key] = (emailCounts[key] || 0) + 1;
            if (emailCounts[key] > 1) duplicates.add(key);
          }
        });

        setDuplicateWarnings(duplicates.size);
        setKpis({
          total: leadsList.length,
          hot: leadsList.filter((l) => (l.intelligence_score || 0) >= 80).length,
          new: leadsList.filter((l) => l.lead_state === "NEW").length,
          booked: leadsList.filter((l) => l.lead_state === "BOOKED").length,
        });
      } catch {
        // Silently fail — KPIs are secondary
      }
    };
    loadKpis();
  }, []);

  // Load paginated leads with real-time updates
  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const filter = buildFilter();
        const offset = page * PAGE_SIZE;

        // Fetch with sort and pagination
        const sortKey =
          sort.field === "intelligence_score" ? "intelligence_score" : "last_activity_at";
        const sortValue = sort.order === 1 ? sortKey : `-${sortKey}`;

        // Use user-scoped client — admin role passes RLS read check.
        const results = await base44.entities.Leads.filter(
          filter,
          sortValue,
          PAGE_SIZE + 1,
          offset
        );

        let items = results?.slice(0, PAGE_SIZE) || [];
        if (search) {
          const q = search.toLowerCase();
          items = items.filter((l) =>
            (l.full_name || "").toLowerCase().includes(q) ||
            (l.business_name || "").toLowerCase().includes(q) ||
            (l.email || "").toLowerCase().includes(q)
          );
        }
        // Fallback: if filter returned nothing, try list() with skip
        if (items.length === 0 && !search && Object.keys(filter).length === 0) {
          const fallback = await base44.entities.Leads.list(sortValue, PAGE_SIZE + 1, offset);
          items = (fallback || []).slice(0, PAGE_SIZE);
        }
        setLeads(items);
        setTotalCount(offset + items.length);
      } catch (err) {
        setError(err.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    loadLeads();

    // Subscribe to lead updates for real-time row changes
    const unsubscribe = base44.entities.Leads.subscribe((event) => {
      if (event.type === "update" && event.data) {
        // Update only the changed lead in the current view
        setLeads((prev) =>
          prev.map((l) => (l.id === event.entity_id ? { ...l, ...event.data } : l))
        );
      }
    });

    return unsubscribe;
  }, [page, filters, sort, buildFilter]);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
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
    return sort.order === 1 ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Leads.delete(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setKpis((prev) => ({ ...prev, total: prev.total - 1 }));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards - Clean & Minimal */}
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
            <strong>{duplicateWarnings} potential duplicate(s) found</strong> by email address. Review in data quality dashboard.
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

          <select
            value={filters.industry}
            onChange={(e) => handleFilterChange("industry", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">Industry</option>
            <option value="med-spa">Med Spa</option>
            <option value="dental">Dental</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
            <option value="roofing">Roofing</option>
            <option value="chiropractic">Chiropractic</option>
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

      {/* Table */}
      <div className="rounded-lg border border-border bg-white overflow-hidden">
        {error && (
          <div className="flex items-start gap-3 p-4 text-sm text-red-800 bg-red-50 border-b border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Business</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort("intelligence_score")}
                    className="hover:text-primary transition-colors"
                  >
                    Intelligence {renderSortIcon("intelligence_score")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">State</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort("last_activity_at")}
                    className="hover:text-primary transition-colors"
                  >
                    Last Activity {renderSortIcon("last_activity_at")}
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
                      <span className="text-xs">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-muted-foreground text-xs">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className={`${getRowHighlight(lead.lead_state)} border-none`}>
                    <td className="px-4 py-3 font-medium text-foreground">{lead.full_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.business_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="space-y-1">
                        <div>{lead.email || "-"}</div>
                        {lead.phone && <div className="text-xs">{lead.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                          {lead.intelligence_score || 0}
                        </span>
                        {lead.intelligence_segment && (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getIntelligenceSegmentBadge(lead.intelligence_segment).color}`}>
                            {getIntelligenceSegmentBadge(lead.intelligence_segment).label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                        {lead.lead_state || "NEW"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">
                      {lead.last_activity_at
                        ? new Date(lead.last_activity_at).toLocaleDateString()
                        : "—"}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-gray-50">
          <p className="text-sm text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of ~{kpis.total}
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
                <p className="text-sm font-semibold text-foreground">{deleteTarget.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{deleteTarget.business_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{deleteTarget.email || "—"}</p>
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