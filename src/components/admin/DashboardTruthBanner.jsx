import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const LABELS = {
  trusted: "Trusted",
  warning: "Warning",
  blocked: "Blocked / Not Trusted",
  unknown: "Unknown",
};

const CLASSES = {
  trusted: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300",
  blocked: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300",
  unknown: "border-border bg-muted/30 text-muted-foreground",
};

function normalizeStatus(value) {
  const status = String(value || "unknown").toLowerCase();
  return Object.prototype.hasOwnProperty.call(CLASSES, status) ? status : "unknown";
}

export default function DashboardTruthBanner() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const rows = await base44.entities.DashboardTruthCheck.filter(
          { scope: "admin_dashboard" },
          "-last_checked_at",
          1
        );
        if (!cancelled) setRecord((rows || [])[0] || null);
      } catch (err) {
        console.error("DashboardTruthBanner load failed", err);
        if (!cancelled) setError("Dashboard truth check could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dashboard Truth Status</p>
        <p className="mt-2 text-sm text-muted-foreground">Loading latest truth check...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
        <p className="text-xs font-semibold uppercase tracking-wide">Dashboard Truth Status</p>
        <p className="mt-2 text-sm font-medium">Needs Instrumentation</p>
        <p className="mt-1 text-xs">{error || "No admin_dashboard truth check record exists yet."}</p>
      </div>
    );
  }

  const status = normalizeStatus(record.truth_status);
  const lastChecked = record.last_checked_at ? new Date(record.last_checked_at).toLocaleString() : "Not checked";
  const blockers = Number(record.blocker_count || 0);
  const warnings = Number(record.warning_count || 0);

  return (
    <div className={`rounded-xl border p-4 ${CLASSES[status]}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Dashboard Truth Status</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-foreground dark:bg-black/20 dark:text-white">
              {LABELS[status]}
            </span>
            <span className="text-xs font-medium">{blockers} blockers · {warnings} warnings</span>
          </div>
          <p className="mt-2 text-sm font-medium">{record.evidence_summary || "No evidence summary recorded."}</p>
          <p className="mt-1 text-xs opacity-80">Last checked: {lastChecked}</p>
        </div>
        <div className="min-w-[190px] rounded-lg bg-white/50 p-3 text-xs dark:bg-black/10">
          <p className="font-semibold">Admin visibility: {record.safe_to_show_admin ? "cleared" : "not cleared"}</p>
          <p className="mt-1 font-semibold">Launch status: {record.safe_to_launch ? "cleared" : "not cleared"}</p>
          <p className="mt-2 opacity-80">Source: DashboardTruthCheck</p>
        </div>
      </div>
    </div>
  );
}
