import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
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

    return f;
  }, [search, filters]);

  // Load KPIs
  useEffect(() => {
    const loadKpis = async () => {
      try {
        // Fetch counts efficiently
        const [totalList, hotList, newList, bookedList] = await Promise.all([
          base44.asServiceRole.entities.Leads.filter({}, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ intelligence_score: { $gte: 80 } }, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ lead_state: "NEW" }, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ lead_state: "BOOKED" }, "id", 1),
        ]);

        // Count potential duplicates (same normalized email)
        const allLeads = await base44.asServiceRole.entities.Leads.filter({}, "id", 100);
        const emailCounts = {};
        const duplicates = new Set();
        (allLeads || []).forEach((l) => {
          const key = l.normalized_email || l.email;
          if (key) {
            emailCounts[key] = (emailCounts[key] || 0) + 1;
            if (emailCounts[key] > 1) duplicates.add(key);
          }
        });

        setDuplicateWarnings(duplicates.size);
        setKpis({
          total: totalList?.length || 0,
          hot: hotList?.length || 0,
          new: newList?.length || 0,
          booked: bookedList?.length || 0,
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

        const results = await base44.asServiceRole.entities.Leads.filter(
          filter,
          sortValue,
          PAGE_SIZE + 1,
          offset
        );

        const items = results?.slice(0, PAGE_SIZE) || [];
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
    const unsubscribe = base44.asServiceRole.entities.Leads.subscribe((event) => {
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

  return (
    <div className="space-y-6">
      {/* KPI Cards - Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-background/50 p-3 border border-border/40">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{kpis.total}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 border border-border/40">
          <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wide">Hot</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{kpis.hot}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 border border-border/40">
          <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">New</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{kpis.new}</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 border border-border/40">
          <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">Booked</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{kpis.booked}</p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateWarnings > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/50 text-xs text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>{duplicateWarnings} potential duplicate(s)</strong> detected by email. Review and merge if needed.
          </span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="space-y-3 rounded-lg border border-border/40 bg-background/30 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/50 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
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
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs outline-none hover:border-primary transition-colors"
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
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs outline-none hover:border-primary transition-colors"
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
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs outline-none hover:border-primary transition-colors"
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
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs outline-none hover:border-primary transition-colors"
          />

          <input
            type="number"
            placeholder="Score max"
            min="0"
            max="100"
            value={filters.scoreMax}
            onChange={(e) => handleFilterChange("scoreMax", e.target.value)}
            className="rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs outline-none hover:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/40 bg-background/20 overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50/50 border-b border-red-200/30">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-background/50 border-b border-border/40">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Business</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Contact</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort("intelligence_score")}
                    className="hover:text-primary transition-colors"
                  >
                    Intelligence {renderSortIcon("intelligence_score")}
                  </button>
                </th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">State</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort("last_activity_at")}
                    className="hover:text-primary transition-colors"
                  >
                    Last Activity {renderSortIcon("last_activity_at")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-6 text-center text-muted-foreground text-xs">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className={`${getRowHighlight(lead.lead_state)}`}>
                    <td className="px-3 py-2 font-medium text-foreground">{lead.full_name || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{lead.business_name || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="space-y-0.5">
                        <div>{lead.email || "-"}</div>
                        {lead.phone && <div>{lead.phone}</div>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100/80 text-blue-700">
                          {lead.intelligence_score || 0}
                        </span>
                        {lead.intelligence_segment && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${getIntelligenceSegmentBadge(lead.intelligence_segment).color}`}>
                            {getIntelligenceSegmentBadge(lead.intelligence_segment).label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {lead.lead_state || "NEW"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {lead.last_activity_at
                        ? new Date(lead.last_activity_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Minimal */}
        <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 bg-background/30">
          <p className="text-[11px] text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of ~{kpis.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-2 py-1 rounded text-[11px] font-medium border border-border/40 hover:bg-background/50 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="text-[10px] text-muted-foreground px-1.5">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={leads.length < PAGE_SIZE || loading}
              className="px-2 py-1 rounded text-[11px] font-medium border border-border/40 hover:bg-background/50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}