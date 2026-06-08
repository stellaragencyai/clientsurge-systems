/**
 * Task 15: Automation Tracking Panel
 * Admin view of all AutomationChecklist records with filtering by service_key
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Clock, AlertTriangle, RefreshCw, Filter } from "lucide-react";

const SERVICE_KEYS = [
  { value: "", label: "All Services" },
  { value: "instant_lead_response", label: "Instant Lead Response" },
  { value: "missed_call_text_back", label: "Missed Call Text-Back" },
  { value: "nurture_sequence_14d", label: "Nurture Sequence" },
  { value: "ai_booking_agent", label: "AI Booking Agent" },
  { value: "lead_reactivation", label: "Lead Reactivation" },
  { value: "review_request", label: "Review Request" },
];

const STATUS_COLORS = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/10 text-amber-700",
  active: "bg-emerald-500/10 text-emerald-700",
  failed: "bg-red-500/10 text-red-700",
  paused: "bg-slate-500/10 text-slate-700",
};

const STATUS_ICONS = {
  not_started: Clock,
  in_progress: RefreshCw,
  active: CheckCircle2,
  failed: AlertTriangle,
  paused: AlertTriangle,
};

export default function AutomationTrackingPanel() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    setLoading(true);
    try {
      const data = await base44.asServiceRole.entities.AutomationChecklist.list("-created_date", 200);
      setChecklists(data || []);
    } catch (err) {
      console.error("AutomationTrackingPanel load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await base44.asServiceRole.entities.AutomationChecklist.update(id, {
        status: newStatus,
        ...(newStatus === "active" ? { went_live_at: new Date().toISOString() } : {}),
      });
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = checklists.filter((c) => {
    const matchesService = !serviceFilter || c.service_key === serviceFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesSearch = !searchQuery ||
      (c.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.client_email || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesStatus && matchesSearch;
  });

  const summaryStats = {
    total: checklists.length,
    active: checklists.filter((c) => c.status === "active").length,
    in_progress: checklists.filter((c) => c.status === "in_progress").length,
    not_started: checklists.filter((c) => c.status === "not_started").length,
    failed: checklists.filter((c) => c.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Automation Tracking</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor setup progress for all client automations
          </p>
        </div>
        <button
          onClick={loadChecklists}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: summaryStats.total, color: "text-foreground" },
          { label: "Active", value: summaryStats.active, color: "text-emerald-600" },
          { label: "In Progress", value: summaryStats.in_progress, color: "text-amber-600" },
          { label: "Failed", value: summaryStats.failed, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Filter:</span>
          </div>
          <input
            type="text"
            placeholder="Search by business or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SERVICE_KEYS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading automations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No automation checklists found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((checklist) => {
                  const StatusIcon = STATUS_ICONS[checklist.status] || Clock;
                  const serviceLabel = SERVICE_KEYS.find((s) => s.value === checklist.service_key)?.label || checklist.service_key;
                  const updatedDate = checklist.updated_date
                    ? new Date(checklist.updated_date).toLocaleDateString()
                    : "—";
                  return (
                    <tr key={checklist.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{checklist.business_name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{checklist.client_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-foreground">{serviceLabel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[checklist.status] || "bg-muted text-muted-foreground"}`}>
                          <StatusIcon className="w-3 h-3" />
                          {checklist.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{updatedDate}</td>
                      <td className="px-4 py-3">
                        <select
                          value={checklist.status || "not_started"}
                          onChange={(e) => updateStatus(checklist.id, e.target.value)}
                          disabled={updating === checklist.id}
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="active">Active</option>
                          <option value="failed">Failed</option>
                          <option value="paused">Paused</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}