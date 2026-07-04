import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Gauge,
  Target,
  BarChart3,
  Database,
  FileWarning,
  Lightbulb,
} from "lucide-react";
import { AUDIT_SECTIONS, TARGET_SCORE } from "@/lib/auditScoring";

const STATUS_STYLES = {
  Trusted: {
    color: "#16a34a",
    bg: "rgba(22,163,74,0.1)",
    border: "rgba(22,163,74,0.3)",
    Icon: CheckCircle2,
  },
  "Needs Proof": {
    color: "#d97706",
    bg: "rgba(217,119,6,0.1)",
    border: "rgba(217,119,6,0.3)",
    Icon: AlertCircle,
  },
  Blocked: {
    color: "#dc2626",
    bg: "rgba(220,38,38,0.1)",
    border: "rgba(220,38,38,0.3)",
    Icon: XCircle,
  },
};

const GO_LABELS = {
  go: { label: "GO", color: "#16a34a", bg: "rgba(22,163,74,0.15)" },
  conditional_go: { label: "CONDITIONAL GO", color: "#d97706", bg: "rgba(217,119,6,0.15)" },
  no_go: { label: "NO GO", color: "#dc2626", bg: "rgba(220,38,38,0.15)" },
};

function ScoreRing({ score, status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Needs Proof"];
  const Icon = style.Icon;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke={style.color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>{score}</span>
        <span className="text-[8px] text-muted-foreground font-semibold">/100</span>
      </div>
    </div>
  );
}

function SectionCard({ section, defaultOpen }) {
  const [expanded, setExpanded] = useState(defaultOpen || false);
  const style = STATUS_STYLES[section.status] || STATUS_STYLES["Needs Proof"];

  return (
    <div
      className="rounded-2xl border bg-white overflow-hidden"
      style={{ borderColor: style.border, boxShadow: "0 2px 12px rgba(0,59,143,0.04)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <ScoreRing score={section.total} status={section.status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {section.label}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: style.bg, color: style.color }}
            >
              <style.Icon className="w-3 h-3" />
              {section.status}
            </span>
            <span className="text-[11px] font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              Grade: {section.grade}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{section.evidence_summary}</p>
        </div>

        {expanded ? <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          {/* Score breakdown */}
          {section.components && section.components.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Score Breakdown</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {section.components.map((comp) => (
                  <div key={comp.key} className="rounded-lg border border-border p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground truncate">{comp.label}</span>
                      <span className="text-[11px] font-bold text-foreground flex-shrink-0 ml-2">{comp.points}/{comp.maxPoints}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(comp.points / comp.maxPoints) * 100}%`, background: style.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checks */}
          {section.checks && section.checks.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Proof Checks</p>
              <div className="space-y-1.5">
                {section.checks.map((check) => {
                  const checkStyle = check.status === "passed"
                    ? STATUS_STYLES.Trusted
                    : check.status === "needs_proof"
                    ? STATUS_STYLES["Needs Proof"]
                    : STATUS_STYLES.Blocked;
                  const CheckIcon = checkStyle.Icon;
                  return (
                    <div key={check.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30">
                      <CheckIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: checkStyle.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{check.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{check.evidence}</p>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: checkStyle.bg, color: checkStyle.color }}>
                        {check.status === "passed" ? "PASS" : check.status === "needs_proof" ? "NEEDS PROOF" : "FAIL"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blockers */}
          {section.blockers && section.blockers.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: STATUS_STYLES.Blocked.color }}>
                <XCircle className="w-3.5 h-3.5" /> Blockers ({section.blockers.length})
              </p>
              <div className="space-y-2">
                {section.blockers.map((b, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: STATUS_STYLES.Blocked.bg, border: `1px solid ${STATUS_STYLES.Blocked.border}` }}>
                    <p className="text-xs font-bold text-foreground mb-0.5">{b.code}</p>
                    <p className="text-[11px] text-muted-foreground mb-1.5">{b.message}</p>
                    <div className="flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-foreground">{b.fix_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {section.warnings && section.warnings.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: STATUS_STYLES["Needs Proof"].color }}>
                <AlertCircle className="w-3.5 h-3.5" /> Warnings ({section.warnings.length})
              </p>
              <div className="space-y-2">
                {section.warnings.map((w, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: STATUS_STYLES["Needs Proof"].bg, border: `1px solid ${STATUS_STYLES["Needs Proof"].border}` }}>
                    <p className="text-xs font-bold text-foreground mb-0.5">{w.code}</p>
                    <p className="text-[11px] text-muted-foreground mb-1.5">{w.message}</p>
                    <div className="flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-foreground">{w.fix_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next actions */}
          {section.blockers.length === 0 && section.warnings.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: STATUS_STYLES.Trusted.bg }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: STATUS_STYLES.Trusted.color }} />
              <p className="text-xs font-semibold" style={{ color: STATUS_STYLES.Trusted.color }}>All checks passed — no remediation needed.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoNoGoBanner({ goNoGo, overallScore, blockerCount, warningCount, lastChecked }) {
  const goStyle = GO_LABELS[goNoGo] || GO_LABELS.no_go;

  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 flex-wrap"
      style={{ background: goStyle.bg, border: `1px solid ${goStyle.color}30` }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: goStyle.color }}
      >
        <Gauge className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-black" style={{ color: goStyle.color, fontFamily: "Montserrat, sans-serif" }}>
            {goStyle.label}
          </span>
          <span className="text-sm font-bold text-foreground">· {overallScore}/100</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {blockerCount} blocker{blockerCount !== 1 ? "s" : ""} · {warningCount} warning{warningCount !== 1 ? "s" : ""}
          {lastChecked && ` · Last checked: ${new Date(lastChecked).toLocaleString()}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target</p>
        <p className="text-sm font-bold text-foreground">{TARGET_SCORE}+</p>
      </div>
    </div>
  );
}

export default function AuditCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("runAuditProofCheck", { persist: true });
      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.error || "Failed to run audit checks.");
      }
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to run audit proof check.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleReRun = async () => {
    setRunning(true);
    await fetchResults();
    setRunning(false);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Running audit proof checks…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">Audit Check Failed</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <button
          onClick={handleReRun}
          className="cs-btn-primary inline-flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const sections = data?.sections || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Audit Command Center
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time proof checks for Homepage Conversion, Analytics Tracking, and Dashboard Truth.
            Scores are calculated dynamically from evidence — not hardcoded.
          </p>
        </div>
        <button
          onClick={handleReRun}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-primary text-xs font-semibold transition-opacity disabled:opacity-40 cursor-pointer"
          style={{ background: "rgba(0,174,239,0.07)", border: "1px solid rgba(0,174,239,0.15)" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          {running ? "Running checks…" : "Re-run Audit"}
        </button>
      </div>

      {/* Go / No-Go Banner */}
      <GoNoGoBanner
        goNoGo={data?.go_no_go || "no_go"}
        overallScore={data?.overall_score || 0}
        blockerCount={data?.blocker_count || 0}
        warningCount={data?.warning_count || 0}
        lastChecked={data?.timestamp}
      />

      {/* Section Cards */}
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <SectionCard key={section.key} section={section} defaultOpen={idx === 0} />
        ))}
      </div>

      {/* Analytics Detail Panel */}
      {data?.analytics_detail && (
        <AnalyticsDetailPanel detail={data.analytics_detail} />
      )}

      {/* Admin Truth Detail Panel */}
      {data?.admin_detail && (
        <AdminTruthDetailPanel detail={data.admin_detail} />
      )}

      {/* Environment filter notice */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-2.5">
          <FileWarning className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-0.5">Environment Separation</p>
            <p className="text-[11px] text-muted-foreground">
              All metrics shown are production-trusted only by default. Test, smoke, internal, demo, and unknown records are excluded from scoring.
              Records with <code className="font-mono text-[10px]">environment=unknown</code> trigger warnings and never receive green/healthy status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDetailPanel({ detail }) {
  const eventTypeData = Object.entries(detail.events_by_type || {}).map(([type, count]) => ({ type, count }));
  const pageKeyData = Object.entries(detail.events_by_page_key || {}).map(([key, count]) => ({ key, count }));

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Analytics Detail
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* GA4 Status */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">GA4 Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-xs font-bold" style={{ color: detail.ga4_active ? "#16a34a" : "#dc2626" }}>
                {detail.ga4_active ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Measurement ID</span>
              <span className="text-xs font-mono text-foreground">{detail.ga4_measurement_id || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conversion Events</span>
              <span className="text-xs font-bold" style={{ color: detail.ga4_has_conversion_events ? "#16a34a" : "#d97706" }}>
                {detail.ga4_has_conversion_events ? "Marked" : "Needs GA4 conversion marking"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Internal Analytics Trust</span>
              <span className="text-xs font-bold" style={{ color: detail.total_events >= 20 ? "#16a34a" : "#d97706" }}>
                {detail.total_events >= 20 ? "Trusted" : "Needs Proof"}
              </span>
            </div>
          </div>
        </div>

        {/* Event Stats */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Event Stats</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Events (24h)</span>
              <span className="text-xs font-bold text-foreground">{detail.events_last_24h || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Events</span>
              <span className="text-xs font-bold text-foreground">{detail.total_events || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">LandingPageAnalytics Rows</span>
              <span className="text-xs font-bold text-foreground">{detail.landing_page_analytics_count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last Analytics Rebuild</span>
              <span className="text-xs font-bold text-foreground">{detail.last_landing_analytics_rebuild ? new Date(detail.last_landing_analytics_rebuild).toLocaleDateString() : "Never"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pages with zero analytics */}
      {detail.pages_with_zero_analytics && detail.pages_with_zero_analytics.length > 0 && (
        <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#d97706" }}>
            Landing pages with zero analytics records ({detail.pages_with_zero_analytics.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.pages_with_zero_analytics.map((page) => (
              <span key={page} className="text-[11px] px-2 py-0.5 rounded-full bg-white font-mono" style={{ color: "#d97706" }}>
                {page}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Events by type */}
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Events by Type</p>
          <div className="space-y-1">
            {eventTypeData.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-32 truncate">{type}</span>
                <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded bg-primary transition-all"
                    style={{ width: `${detail.total_events > 0 ? (count / detail.total_events) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Events by Page Key</p>
          <div className="space-y-1">
            {pageKeyData.map(({ key, count }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-32 truncate">{key}</span>
                <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full rounded bg-primary transition-all"
                    style={{ width: `${detail.total_events > 0 ? (count / detail.total_events) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminTruthDetailPanel({ detail }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Dashboard Truth Layer
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Truth Status</p>
          <p className="text-sm font-bold" style={{ color: detail.truth_status === "trusted" ? "#16a34a" : detail.truth_status === "blocked" ? "#dc2626" : "#d97706" }}>
            {detail.truth_status || "unknown"}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Blockers</p>
          <p className="text-sm font-bold text-foreground">{detail.truth_blocker_count || 0}</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Warnings</p>
          <p className="text-sm font-bold text-foreground">{detail.truth_warning_count || 0}</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Go/No-Go</p>
          <p className="text-sm font-bold" style={{ color: detail.go_no_go === "go" ? "#16a34a" : detail.go_no_go === "no_go" ? "#dc2626" : "#d97706" }}>
            {detail.go_no_go || "no_go"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Safe to Show Admin</p>
          <p className="text-sm font-bold" style={{ color: detail.safe_to_show_admin ? "#16a34a" : "#dc2626" }}>
            {detail.safe_to_show_admin ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Safe to Show Client</p>
          <p className="text-sm font-bold" style={{ color: detail.safe_to_show_client ? "#16a34a" : "#dc2626" }}>
            {detail.safe_to_show_client ? "Yes" : "No"}
          </p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Safe to Launch</p>
          <p className="text-sm font-bold" style={{ color: detail.safe_to_launch ? "#16a34a" : "#dc2626" }}>
            {detail.safe_to_launch ? "Yes" : "No"}
          </p>
        </div>
      </div>

      {detail.missing_gates && detail.missing_gates.length > 0 && (
        <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#d97706" }}>Missing LaunchGate records:</p>
          <div className="flex flex-wrap gap-1.5">
            {detail.missing_gates.map((g) => (
              <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-white font-mono" style={{ color: "#d97706" }}>{g}</span>
            ))}
          </div>
        </div>
      )}

      {detail.unknown_env_count > 0 && (
        <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <p className="text-xs font-bold" style={{ color: "#dc2626" }}>
            ⚠ {detail.unknown_env_count} record(s) with environment=unknown — these are excluded from production metrics and never show green/healthy status.
          </p>
        </div>
      )}
    </div>
  );
}