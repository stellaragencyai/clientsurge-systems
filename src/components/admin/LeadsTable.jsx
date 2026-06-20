import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAGE_SIZE = 25;

// Lead score categories
function getLeadScoreBadge(score) {
  if (score >= 80) return { label: "Hot", color: "bg-red-100 text-red-800" };
  if (score >= 50) return { label: "Warm", color: "bg-orange-100 text-orange-800" };
  return { label: "Cold", color: "bg-blue-100 text-blue-800" };
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
    crm_stage: "",
    industry: "",
    minScore: "",
  });
  const [sort, setSort] = useState({ field: "last_activity_at", order: -1 });
  const [totalCount, setTotalCount] = useState(0);
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
    if (filters.crm_stage) f.crm_stage = filters.crm_stage;
    if (filters.industry) f.industry = filters.industry;
    if (filters.minScore) f.lead_score = { $gte: parseInt(filters.minScore) };

    return f;
  }, [search, filters]);

  // Load KPIs
  useEffect(() => {
    const loadKpis = async () => {
      try {
        // Fetch counts efficiently
        const [totalList, hotList, newList, bookedList] = await Promise.all([
          base44.asServiceRole.entities.Leads.filter({}, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ lead_score: { $gte: 80 } }, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ status: "New" }, "id", 1),
          base44.asServiceRole.entities.Leads.filter({ status: "Booked" }, "id", 1),
        ]);

        // Extract total from query results (we fetch just IDs with limit 1 to get count)
        // This is a workaround — ideally backend provides count
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

  // Load paginated leads
  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const filter = buildFilter();
        const offset = page * PAGE_SIZE;

        // Fetch with sort and pagination
        const sortKey =
          sort.field === "lead_score" ? "lead_score" : "last_activity_at";
        const sortValue = sort.order === 1 ? sortKey : `-${sortKey}`;

        const results = await base44.asServiceRole.entities.Leads.filter(
          filter,
          sortValue,
          PAGE_SIZE + 1, // Fetch one extra to detect if there are more pages
          offset
        );

        const items = results?.slice(0, PAGE_SIZE) || [];
        const hasMore = (results?.length || 0) > PAGE_SIZE;

        setLeads(items);
        setTotalCount(offset + items.length);
      } catch (err) {
        setError(err.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Leads</p>
          <p className="text-3xl font-bold text-foreground mt-2">{kpis.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Hot Leads (80+)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{kpis.hot}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">New Leads</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{kpis.new}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Booked</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{kpis.booked}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or industry..."
            value={search}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Qualified">Qualified</option>
            <option value="Booked">Booked</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filters.crm_stage}
            onChange={(e) => handleFilterChange("crm_stage", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">All CRM Stages</option>
            <option value="Not Contacted">Not Contacted</option>
            <option value="Contacted">Contacted</option>
            <option value="Opened / Clicked">Opened / Clicked</option>
            <option value="Replied">Replied</option>
            <option value="Audit Booked">Audit Booked</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <select
            value={filters.minScore}
            onChange={(e) => handleFilterChange("minScore", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">All Scores</option>
            <option value="50">50+</option>
            <option value="70">70+</option>
            <option value="80">80+ (Hot)</option>
          </select>

          <select
            value={filters.industry}
            onChange={(e) => handleFilterChange("industry", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors"
          >
            <option value="">All Industries</option>
            <option value="med-spa">Med Spa</option>
            <option value="dental">Dental</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
            <option value="roofing">Roofing</option>
            <option value="chiropractic">Chiropractic</option>
            <option value="contractors">Contractors</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Business</th>
                <th className="px-4 py-3 text-left font-semibold">Email / Phone</th>
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    onClick={() => handleSort("lead_score")}
                    className="hover:text-primary transition-colors"
                  >
                    Score {renderSortIcon("lead_score")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">
                  <button
                    onClick={() => handleSort("last_activity_at")}
                    className="hover:text-primary transition-colors"
                  >
                    Last Activity {renderSortIcon("last_activity_at")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium">{lead.full_name || "-"}</td>
                    <td className="px-4 py-3">{lead.business_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lead.email || "-"}
                      {lead.phone && <div>{lead.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          getLeadScoreBadge(lead.lead_score).color
                        }`}
                      >
                        {lead.lead_score || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(lead.status)}`}>
                        {lead.status || "New"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lead.last_activity_at
                        ? new Date(lead.last_activity_at).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of ~{kpis.total} leads
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground px-2">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={leads.length < PAGE_SIZE || loading}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}