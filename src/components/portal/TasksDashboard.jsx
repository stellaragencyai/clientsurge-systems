import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Zap, ScrollText, AlertCircle } from "lucide-react";
import TaskStatsRow from "./tasks/TaskStatsRow";
import TaskJobRow from "./tasks/TaskJobRow";
import ActivityLogRow from "./tasks/ActivityLogRow";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const FILTERS = ["all", "queued", "processing", "completed", "failed"];

export default function TasksDashboard({ project, portalState, isAdmin = false }) {
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("jobs");
  const [retriggering, setRetriggering] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [tickNow, setTickNow] = useState(Date.now());

  // Phase A.4: Proof gate — success-metric stats suppressed until proof-validated
  const cardState = getCardState(portalState, "activity_log");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await base44.functions.invoke("getClientTaskJobs", { project_id: project?.id });
      setJobs(res.data.jobs || []);
      setEvents(res.data.events || []);
      setStats(res.data.stats || {});
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err?.data?.error || err?.message || "Failed to load task data.");
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    const tickInterval = setInterval(() => setTickNow(Date.now()), 1000);
    return () => { clearInterval(interval); clearInterval(tickInterval); };
  }, [load]);

  const handleRetrigger = async (jobId) => {
    setRetriggering(jobId);
    try {
      await base44.functions.invoke("retriggerTaskJob", { job_id: jobId });
      await load();
    } catch (err) {
      setError(err?.data?.error || "Failed to re-trigger job.");
    } finally {
      setRetriggering(null);
    }
  };

  const filteredJobs = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  const failedCount = stats?.failed || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Automated Tasks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of AI service jobs running for your business.
            {lastRefreshed && (
              <span className="ml-2 text-xs opacity-60">
                Updated {Math.floor((tickNow - lastRefreshed) / 1000)}s ago
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Alert if failed jobs */}
      {failedCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>{failedCount} job{failedCount > 1 ? "s" : ""} failed.</strong> Click "Run" on any failed job below to retry it manually.
          </span>
        </div>
      )}

      {/* Phase A.4: Stats — suppressed when proof not Live (success metrics) */}
      {isProofLive && stats && <TaskStatsRow stats={stats} />}
      {!isProofLive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-700 font-medium">
          {cardState.display_text}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "jobs", label: "Task Jobs", icon: Zap },
          { id: "log",  label: "Activity Log", icon: ScrollText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Jobs tab */}
      {activeTab === "jobs" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex gap-2 px-5 py-3 border-b border-border overflow-x-auto">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="px-5">
            {loading && jobs.length === 0 ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks…
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No {filter === "all" ? "" : filter} jobs yet.
                <p className="text-xs mt-1 opacity-70">Jobs are created automatically when leads enter your pipeline.</p>
              </div>
            ) : (
              filteredJobs.map(job => (
                <TaskJobRow
                  key={job.id}
                  job={job}
                  onRetrigger={handleRetrigger}
                  retriggering={retriggering === job.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Activity log tab */}
      {activeTab === "log" && (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Last {events.length} communication events
            </p>
          </div>
          <div className="px-5">
            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading activity…
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                No activity logged yet.
              </div>
            ) : (
              events.map(event => (
                <ActivityLogRow key={event.id} event={event} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Auto-refreshes every 15 seconds.</strong> Jobs are queued automatically when leads interact with your system. Failed jobs can be manually re-triggered using the "Run" button.
      </div>

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}