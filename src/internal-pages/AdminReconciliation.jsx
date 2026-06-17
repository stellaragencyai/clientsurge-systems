import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  ArrowRight, Search, ChevronDown, ChevronUp, Filter,
  Eye, Wrench, Zap, Clock, FileWarning, Layers,
  ShieldAlert, Play, Pause,
} from "lucide-react";

// ── Severity config ──
const SEVERITY = {
  critical_blocker: { label: "Critical", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
  launch_blocker: { label: "Launch Blocker", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle },
  advisory: { label: "Advisory", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: FileWarning },
};

// ── Summary card ──
function StatCard({ icon: Icon, label, value, colorClass, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── Blocker detail row ──
function BlockerRow({ blocker, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sev = SEVERITY[blocker.severity] || SEVERITY.advisory;
  const SevIcon = sev.icon;

  return (
    <div className="border border-border rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <SevIcon className={`w-4 h-4 shrink-0 ${sev.color}`} />
        <code className="text-xs font-mono text-foreground/70 shrink-0">{blocker.code}</code>
        <span className="flex-1 text-sm text-foreground truncate">{blocker.message}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Entity</span>
              <p className="font-semibold text-foreground">{blocker.entity_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Record ID</span>
              <p className="font-mono text-foreground truncate">{blocker.record_id || "—"}</p>
            </div>
            {(blocker.order_id || blocker.client_project_id) && (
              <div>
                <span className="text-muted-foreground">{blocker.order_id ? "Order ID" : "Project ID"}</span>
                <p className="font-mono text-foreground truncate">{blocker.order_id || blocker.client_project_id}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Environment Guess</span>
              <p className="font-semibold text-foreground">{blocker.environment_guess || "—"}</p>
            </div>
            {blocker.customer_email && (
              <div>
                <span className="text-muted-foreground">Customer</span>
                <p className="text-foreground truncate">{blocker.customer_email}</p>
              </div>
            )}
            {blocker.business_name && (
              <div>
                <span className="text-muted-foreground">Business</span>
                <p className="text-foreground truncate">{blocker.business_name}</p>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-muted-foreground">Fix Action</span>
              <p className="text-foreground">{blocker.fix_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Grouped table ──
function GroupedTable({ title, blockers, icon: Icon }) {
  if (!blockers || blockers.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="ml-auto text-xs font-semibold text-muted-foreground">{blockers.length} item{blockers.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto p-3">
        {blockers.map((b, i) => <BlockerRow key={i} blocker={b} defaultExpanded={blockers.length <= 5} />)}
      </div>
    </div>
  );
}

// ── By-code table ──
function ByCodeTable({ byCode }) {
  if (!byCode || Object.keys(byCode).length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-bold text-foreground">Blocker &amp; Warning Counts by Code</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground uppercase">Code</th>
              <th className="text-right py-2 px-4 text-xs font-semibold text-muted-foreground uppercase w-20">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byCode).sort(([, a], [, b]) => b - a).map(([code, count]) => (
              <tr key={code} className="border-t border-border hover:bg-muted/30">
                <td className="py-2 px-4">
                  <code className="text-xs font-mono text-foreground">{code}</code>
                </td>
                <td className="py-2 px-4 text-right">
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Top actions ──
function TopActions({ actions }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Top Next Actions
      </h3>
      <ol className="space-y-1.5">
        {actions.map((action, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
            {action}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Missing details warning ──
function MissingDetailsWarning() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <ShieldAlert className="w-6 h-6 text-amber-600" />
        <div>
          <p className="text-sm font-bold text-amber-800">Incomplete Reconciliation Details</p>
          <p className="text-xs text-amber-700 mt-0.5">
            The reconciliation summary exists, but blocker details were not written. Re-run reconciliation after patching the reconciliation writer.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──
export default function AdminReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState(null);
  const [latestRun, setLatestRun] = useState(null);
  const [detailsJson, setDetailsJson] = useState(null);
  const [detailsMissing, setDetailsMissing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);

  const fetchLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const runs = await base44.entities.ReconciliationRun.list("-created_date", 5);
      if (runs.length > 0) {
        const run = runs[0];
        setLatestRun(run);
        // Parse details_json
        if (run.details_json && run.details_json.length > 10) {
          try {
            const parsed = JSON.parse(run.details_json);
            setDetailsJson(parsed);
            setDetailsMissing(!parsed.blockers && !parsed.warnings);
          } catch {
            setDetailsMissing(true);
            setDetailsJson(null);
          }
        } else {
          setDetailsMissing(true);
          setDetailsJson(null);
        }
      }
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLatest(); }, []);

  const runReconciliation = async (applyMode) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("runDashboardReconciliation", {
        run_type: "full_audit",
        dry_run: !applyMode,
      });
      setResult(res.data);
      // Refresh after a short delay
      setTimeout(() => fetchLatest(), 1500);
    } catch (e) {
      setError(e.message || "Reconciliation failed");
    } finally {
      setRunning(false);
      setShowConfirm(false);
    }
  };

  // Group blockers by code
  const groupedBlockers = useMemo(() => {
    if (!detailsJson?.blockers) return {};
    const groups = {};
    for (const b of detailsJson.blockers) {
      if (!groups[b.code]) groups[b.code] = [];
      groups[b.code].push(b);
    }
    return groups;
  }, [detailsJson]);

  const groupedWarnings = useMemo(() => {
    if (!detailsJson?.warnings) return {};
    const groups = {};
    for (const w of detailsJson.warnings) {
      if (!groups[w.code]) groups[w.code] = [];
      groups[w.code].push(w);
    }
    return groups;
  }, [detailsJson]);

  // Filter helpers
  const paidOrderBlockers = useMemo(() =>
    detailsJson?.blockers?.filter(b => b.code === "PAID_ORDER_MISSING_CLIENT_PROJECT" || b.code === "PAID_ORDER_CLIENT_PROJECT_NOT_FOUND") || [],
  [detailsJson]);

  const missingProjectBlockers = useMemo(() =>
    detailsJson?.blockers?.filter(b => b.code === "PAID_ORDER_CLIENT_PROJECT_NOT_FOUND") || [],
  [detailsJson]);

  const liveChecklistBlockers = useMemo(() =>
    detailsJson?.blockers?.filter(b => b.code === "LIVE_ORDER_MISSING_AUTOMATION_CHECKLIST" || b.code === "LIVE_ORDER_PENDING_AUTOMATION_CHECKLIST") || [],
  [detailsJson]);

  const missingFunnelBlockers = useMemo(() =>
    detailsJson?.blockers?.filter(b => b.code === "MISSING_CONVERSION_FUNNEL") || [],
  [detailsJson]);

  const staleMetricsWarnings = useMemo(() =>
    detailsJson?.warnings?.filter(w => w.code === "STALE_METRICS_SNAPSHOT") || [],
  [detailsJson]);

  const nonProdBlockers = useMemo(() =>
    detailsJson?.blockers?.filter(b => b.code === "QA_SMOKE_DEMO_RECORD_INCLUDED") || [],
  [detailsJson]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading reconciliation data…</span>
        </div>
      </div>
    );
  }

  // ── Render ──
  const tabs = [
    { key: "overview", label: "Overview", icon: Shield },
    { key: "blockers", label: "All Blockers", icon: XCircle, count: detailsJson?.blockers?.length },
    { key: "warnings", label: "All Warnings", icon: AlertTriangle, count: detailsJson?.warnings?.length },
    { key: "byCode", label: "By Code", icon: Layers },
  ];

  const hasDetails = detailsJson && !detailsMissing;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Dashboard Truth &amp; Reconciliation</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {latestRun
              ? `Last run: ${new Date(latestRun.created_at).toLocaleString()} · Status: ${latestRun.status} · Triggered by: ${latestRun.triggered_by}`
              : "No reconciliation run found."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 text-sm font-semibold">
              <XCircle className="w-4 h-4" /> Error
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Result flash */}
        {result && (
          <div className={`rounded-lg border p-4 mb-6 ${result.blockers_found > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
            <p className="text-sm font-semibold">
              {result.dry_run ? "Dry Run Complete" : "Reconciliation Applied"}
            </p>
            <p className="text-xs mt-1">{result.summary}</p>
          </div>
        )}

        {/* Missing details warning */}
        {detailsMissing && latestRun && (
          <MissingDetailsWarning />
        )}

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Dry Run (no writes)
          </label>
          <button
            onClick={() => { if (dryRun) { runReconciliation(false); } else { setShowConfirm(true); } }}
            disabled={running}
            className="cs-btn-primary"
            style={{ minHeight: "40px", fontSize: "0.8125rem" }}
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {dryRun ? "Run Dry Reconciliation" : "Apply Reconciliation"}
          </button>
          <button
            onClick={fetchLatest}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            style={{ minHeight: "40px" }}
          >
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {latestRun && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard icon={Layers} label="Records Checked" value={latestRun.total_records_checked} colorClass="text-blue-400" />
            <StatCard icon={XCircle} label="Blockers" value={latestRun.blockers_found} colorClass="text-red-500" sub={detailsJson ? `${detailsJson.summary?.non_production_records || 0} non-prod, ${detailsJson.summary?.production_records || 0} prod` : ""} />
            <StatCard icon={AlertTriangle} label="Warnings" value={latestRun.warnings_found} colorClass="text-amber-500" />
            <StatCard icon={Wrench} label="Records Updated" value={latestRun.records_updated} colorClass="text-green-500" />
            <StatCard icon={Clock} label="Status" value={latestRun.status === "completed" ? "Clean" : "Issues"} colorClass={latestRun.status === "completed" ? "text-green-500" : "text-red-500"} />
          </div>
        )}

        {/* Tabs */}
        {hasDetails && (
          <>
            <div className="flex gap-1 mb-6 border-b border-border flex-wrap">
              {tabs.map(({ key, label, icon: Icon, count }) => (
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
                  {count != null && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${count > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <TopActions actions={detailsJson.top_next_actions} />
                <ByCodeTable byCode={detailsJson.by_code} />

                {/* Key sections preview */}
                <GroupedTable title="Blocked Paid Orders (Missing ClientProject)" blockers={paidOrderBlockers} icon={XCircle} />
                <GroupedTable title="Live Orders — Missing/Pending Checklists" blockers={liveChecklistBlockers} icon={AlertTriangle} />
                <GroupedTable title="Missing ConversionFunnel" blockers={missingFunnelBlockers} icon={Layers} />
                <GroupedTable title="Non-Production Records Included" blockers={nonProdBlockers} icon={FileWarning} />
                <GroupedTable title="Stale Metrics" blockers={staleMetricsWarnings} icon={Clock} />
              </div>
            )}

            {/* ── Blockers Tab ── */}
            {activeTab === "blockers" && (
              <div>
                {Object.entries(groupedBlockers).map(([code, items]) => (
                  <GroupedTable key={code} title={`${code} (${items.length})`} blockers={items} icon={XCircle} />
                ))}
              </div>
            )}

            {/* ── Warnings Tab ── */}
            {activeTab === "warnings" && (
              <div>
                {Object.keys(groupedWarnings).length > 0 ? (
                  Object.entries(groupedWarnings).map(([code, items]) => (
                    <GroupedTable key={code} title={`${code} (${items.length})`} blockers={items} icon={AlertTriangle} />
                  ))
                ) : (
                  <div className="rounded-xl border border-border p-8 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                    <p className="text-sm font-semibold text-muted-foreground">No warnings</p>
                  </div>
                )}
              </div>
            )}

            {/* ── By Code Tab ── */}
            {activeTab === "byCode" && (
              <div>
                <ByCodeTable byCode={detailsJson.by_code} />
                {/* Records scanned */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground mb-3">Records Scanned</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {detailsJson.records_scanned && Object.entries(detailsJson.records_scanned).map(([entity, count]) => (
                      <div key={entity} className="text-center py-2 px-3 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">{count}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{entity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state — no run yet */}
        {!latestRun && !detailsMissing && (
          <div className="rounded-xl border border-border p-12 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground mb-2">No Reconciliation Data</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
              Run a dry reconciliation scan to classify QA/demo records, find paid orders missing client links, normalize service keys, and verify launch readiness.
            </p>
            <button
              onClick={() => runReconciliation(false)}
              disabled={running}
              className="cs-btn-primary"
              style={{ minHeight: "40px", fontSize: "0.8125rem" }}
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              Run Dry Reconciliation
            </button>
          </div>
        )}
      </div>

      {/* Apply confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl border border-border shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Apply Reconciliation?</h3>
                <p className="text-xs text-muted-foreground">This will write changes to production records.</p>
              </div>
            </div>
            <div className="text-sm text-foreground/80 mb-6 space-y-2">
              <p>This will:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Set environment &amp; dashboard_excluded on QA/demo Orders</li>
                <li>Write dashboard_truth_status on paid/live Orders</li>
                <li>Normalize legacy service keys on AutomationChecklists</li>
                <li>Reset non-canonical activation_statuses on ClientInstallationOS</li>
                <li>Create DashboardTruthCheck rows per order</li>
                <li>Write AuditLog entries for every mutation</li>
              </ul>
              <p className="text-amber-600 font-semibold mt-3">Will NOT: delete records, send email/SMS, touch Stripe, or mark records Live.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => runReconciliation(true)}
                disabled={running}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}