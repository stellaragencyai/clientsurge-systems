import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  Wrench, Server, Mail, Smartphone, Activity, ArrowRight,
  RefreshCw, FileWarning, Layers, Trash2, Search,
} from "lucide-react";

const CATEGORY_CONFIG = {
  core: { label: "Core", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2 },
  testOnly: { label: "Test Only", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Wrench },
  duplicateStale: { label: "Duplicate / Stale", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Layers },
  broken: { label: "Broken", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
  unclassified: { label: "Unclassified", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: Search },
};

const STATUS_MAP = {
  ready: { label: "Ready", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  degraded: { label: "Degraded", color: "text-amber-600", bg: "bg-amber-50", icon: AlertTriangle },
  blocked: { label: "Blocked", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
};

function StatCard({ icon: Icon, label, value, status, colorClass }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {status && <p className={`text-xs font-medium mt-1 ${status.color}`}>{status.label}</p>}
    </div>
  );
}

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.unclassified;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function FunctionAudit() {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterCategory, setFilterCategory] = useState(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getFunctionAudit", {});
      setAudit(res.data);
    } catch (e) {
      setError(e.message || "Failed to load audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAudit(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading audit data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <FileWarning className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Audit Unavailable</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button onClick={fetchAudit} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!audit) return null;

  const { communication_health: ch, classification_counts: counts, function_classifications: fns,
    entity_observability: entities, stale_automation_notes: staleNotes,
    failed_flow_categories: failedFlows, remaining_risks: risks, summary } = audit;

  const msgStatus = STATUS_MAP[ch?.event_triggered_messaging_status] || STATUS_MAP.blocked;
  const StatusIcon = msgStatus.icon;

  const filteredFns = filterCategory
    ? Object.entries(fns).filter(([, cat]) => cat === filterCategory)
    : Object.entries(fns);

  const tabs = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "messaging", label: "Messaging Health", icon: Mail },
    { key: "functions", label: "Function Classifications", icon: Layers },
    { key: "risks", label: "Risks & Gaps", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Function & Automation Audit</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Generated {audit.generated_at ? new Date(audit.generated_at).toLocaleString() : "—"}
            {" · "}Internal admin-only report
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border pb-0 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] ${
                activeTab === key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle2} label="Core Functions" value={counts?.core || 0} colorClass="text-green-500" />
              <StatCard icon={Wrench} label="Test Only" value={counts?.testOnly || 0} colorClass="text-blue-500" />
              <StatCard icon={Layers} label="Duplicate / Stale" value={counts?.duplicateStale || 0} colorClass="text-amber-500" />
              <StatCard icon={XCircle} label="Broken" value={counts?.broken || 0} colorClass="text-red-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Messaging Status */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Event-Triggered Messaging
                </h3>
                <div className={`flex items-center gap-3 p-4 rounded-lg ${msgStatus.bg}`}>
                  <StatusIcon className={`w-8 h-8 ${msgStatus.color}`} />
                  <div>
                    <p className={`text-lg font-bold ${msgStatus.color}`}>{msgStatus.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SMS: {ch?.event_triggered_sms_confirmed ? "Confirmed" : "Not configured"} · Email: {ch?.event_triggered_email_confirmed ? "Confirmed" : "Not configured"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication Stats */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Communication Events (30 Days)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Last SMS OK", value: ch?.last_sms_success ? new Date(ch.last_sms_success).toLocaleDateString() : "None" },
                    { label: "Last SMS Failed", value: ch?.last_sms_failed ? new Date(ch.last_sms_failed).toLocaleDateString() : "None" },
                    { label: "Last Email OK", value: ch?.last_email_success ? new Date(ch.last_email_success).toLocaleDateString() : "None" },
                    { label: "Failed (30d)", value: ch?.failed_communication_count_30d || 0, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="text-center">
                      <p className={`text-2xl font-bold ${highlight ? "text-red-500" : "text-foreground"}`}>{value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Observability Entities */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Observability Entities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {entities && Object.entries(entities).map(([name, info]) => (
                  <div key={name} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className={`text-xs mt-1 font-medium ${info.hasRecords ? "text-green-600" : "text-amber-600"}`}>
                      {info.status === "in_use" ? "In use" : info.status === "empty_not_fully_wired" ? "Empty — not fully wired" : info.status}
                    </p>
                    {info.recordCount > 0 && <p className="text-xs text-muted-foreground mt-0.5">{info.recordCount}+ records</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Messaging Tab ── */}
        {activeTab === "messaging" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Provider Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Twilio SMS</span>
                    {ch?.twilio_enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">From: {ch?.twilio_from_number}</p>
                  <p className="text-xs text-muted-foreground">Credentials: {ch?.has_twilio_creds ? "Present" : "Missing"}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Resend Email</span>
                    {ch?.resend_enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">From: {ch?.resend_from_email}</p>
                  <p className="text-xs text-muted-foreground">API Key: {ch?.has_resend_creds ? "Present" : "Missing"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Voice Calls</span>
                    {ch?.voice_calls_enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Gmail</span>
                    {ch?.gmail_enabled ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Failed flows */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Failed Communication Events by Type</h3>
              {failedFlows && failedFlows.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {failedFlows.map(({ event_type, failure_count }) => (
                    <div key={event_type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{event_type}</span>
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{failure_count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No failed events found.</p>
              )}
            </div>

            {/* Service name mappings */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Canonical Service Name Mappings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {audit.service_name_mappings && Object.entries(audit.service_name_mappings).map(([key, name]) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                    <code className="text-xs text-muted-foreground">{key}</code>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Functions Tab ── */}
        {activeTab === "functions" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {[null, "core", "testOnly", "duplicateStale", "broken"].map((cat) => {
                const cfg = cat ? CATEGORY_CONFIG[cat] : { label: "All", color: "text-gray-600", icon: Layers };
                const Icon = cfg.icon || Layers;
                const count = cat ? (counts?.[cat] || 0) : Object.keys(fns || {}).length;
                return (
                  <button
                    key={cat || "all"}
                    onClick={() => setFilterCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      filterCategory === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Function list */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Function</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase w-32">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFns.map(([name, category]) => (
                      <tr key={name} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4">
                          <code className="text-sm text-foreground">{name}</code>
                        </td>
                        <td className="py-2.5 px-4">
                          <CategoryBadge category={category} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stale automations */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Stale / Failing Automations
              </h3>
              <div className="space-y-2">
                {staleNotes?.map(({ name, reason }) => (
                  <div key={name} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Risks Tab ── */}
        {activeTab === "risks" && (
          <div className="space-y-6">
            {risks?.map(({ category, items }) => (
              <div key={category} className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {category}
                </h3>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-amber-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}