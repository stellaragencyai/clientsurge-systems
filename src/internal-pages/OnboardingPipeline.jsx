import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/admin/AdminShell";
import {
  CheckCircle2, Clock, AlertTriangle, Circle, RefreshCw,
  Building2, Calendar, ChevronRight, User, Layers
} from "lucide-react";

const STAGE_ORDER = [
  "intake_received",
  "website_building",
  "website_review",
  "website_approved",
  "website_live",
  "automation_setup",
  "automation_testing",
  "activation_ready",
  "activated",
];

const STAGE_LABELS = {
  intake_received: "Intake Received",
  website_building: "Website Building",
  website_review: "Website Review",
  website_approved: "Website Approved",
  website_live: "Website Live",
  automation_setup: "Automation Setup",
  automation_testing: "Automation Testing",
  activation_ready: "Activation Ready",
  activated: "Activated",
};

const STAGE_COLORS = {
  intake_received:     { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400"  },
  website_building:    { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400"   },
  website_review:      { bg: "bg-yellow-50",  text: "text-yellow-700", dot: "bg-yellow-400" },
  website_approved:    { bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-400"  },
  website_live:        { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500"  },
  automation_setup:    { bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-400" },
  automation_testing:  { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-400" },
  activation_ready:    { bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400"   },
  activated:           { bg: "bg-primary/10", text: "text-primary",    dot: "bg-primary"    },
};

function StageBadge({ stage }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.intake_received;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STAGE_LABELS[stage] || stage}
    </span>
  );
}

function StageProgressBar({ stage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground font-medium w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatsBar({ clients }) {
  const counts = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = clients.filter(c => c.workflow_stage === s).length;
    return acc;
  }, {});
  const active = clients.filter(c => c.workflow_stage !== "activated").length;
  const done = counts.activated || 0;
  const stuck = clients.filter(c => {
    const d = new Date(c.updated_date);
    return (Date.now() - d.getTime()) > 3 * 24 * 60 * 60 * 1000 && c.workflow_stage !== "activated";
  }).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Total Active", value: clients.length, icon: Layers, color: "text-primary" },
        { label: "In Progress", value: active, icon: Clock, color: "text-blue-600" },
        { label: "Activated", value: done, icon: CheckCircle2, color: "text-green-600" },
        { label: "Stalled (3+ days)", value: stuck, icon: AlertTriangle, color: "text-orange-500" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return d;
}

export default function OnboardingPipeline() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await base44.admin.entities.ClientInstallationOS.list("-updated_date", 100);
      setClients(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = clients.filter(c => {
    const matchFilter =
      filter === "all" ? true :
      filter === "stalled" ? (daysSince(c.updated_date) >= 3 && c.workflow_stage !== "activated") :
      filter === "activated" ? c.workflow_stage === "activated" :
      c.workflow_stage === filter;
    const matchSearch =
      !search ||
      (c.business_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.client_email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stageFilters = [
    { id: "all", label: "All Clients" },
    { id: "stalled", label: "Stalled" },
    ...STAGE_ORDER.map(s => ({ id: s, label: STAGE_LABELS[s] })),
  ];

  return (
    <AdminShell title="Onboarding Pipeline" activeId="onboarding-pipeline">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Client Onboarding Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track every client from intake to activation in real time.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {!loading && <StatsBar clients={clients} />}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by business or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Stage filter pills */}
        <div className="flex flex-wrap gap-2">
          {stageFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Circle className="w-10 h-10 opacity-30" />
            <p className="text-sm">No clients match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => {
              const days = daysSince(client.updated_date);
              const isStalled = days >= 3 && client.workflow_stage !== "activated";

              return (
                <div
                  key={client.id}
                  className={`bg-card border rounded-xl p-5 transition-all hover:shadow-md ${
                    isStalled ? "border-orange-200 bg-orange-50/30" : "border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{client.business_name || "Unnamed Client"}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            {client.client_email || "No email"}
                          </span>
                          {days !== null && (
                            <span className={`text-xs font-medium ${isStalled ? "text-orange-600" : "text-muted-foreground"}`}>
                              {isStalled && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                              Updated {days}d ago
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex flex-col gap-2 sm:items-end sm:min-w-[200px]">
                      <StageBadge stage={client.workflow_stage} />
                      <StageProgressBar stage={client.workflow_stage} />
                    </div>
                  </div>

                  {/* Activation status row */}
                  {(client.activation_eligible || client.activation_status) && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                      {client.activation_eligible && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Eligible for Activation
                        </span>
                      )}
                      {client.activation_status && client.activation_status !== "not_ready" && (
                        <span className="text-xs text-muted-foreground capitalize">
                          Activation: {client.activation_status.replace(/_/g, " ")}
                        </span>
                      )}
                      {client.admin_notes && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-xs">
                          Note: {client.admin_notes}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}