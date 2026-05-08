/**
 * AdminFailedJobsPanel — #182
 * Shows AutomationJob failures with Retry button.
 */
import { useState, useEffect } from "react";

export default function AdminFailedJobsPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState({});

  useEffect(() => { loadFailed(); }, []);

  const loadFailed = async () => {
    setLoading(true);
    try {
      const { AutomationJob } = await import("@/api/entities");
      const data = await AutomationJob.filter({ status: "failed" }, "-updated_date", 50);
      setJobs(data || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  };

  const retry = async (job) => {
    setRetrying(r => ({ ...r, [job.id]: true }));
    try {
      const res = await fetch("/api/functions/processAutomationJobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retry_job_id: job.id }),
      });
      if (res.ok) {
        setJobs(j => j.filter(x => x.id !== job.id));
      }
    } catch { /* show nothing — let them try again */ }
    finally { setRetrying(r => ({ ...r, [job.id]: false })); }
  };

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "#EF4444", fontWeight: 700, fontSize: 16, margin: 0 }}>
          ⚠️ Failed Jobs <span style={{ color: "#6B7280", fontWeight: 400 }}>({jobs.length})</span>
        </h3>
        <button onClick={loadFailed} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#9CA3AF", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", fontSize: 13 }}>Loading...</div>
      ) : jobs.length === 0 ? (
        <div style={{ color: "#00FFB3", fontSize: 13, padding: "16px 0" }}>✅ No failed jobs — all clear.</div>
      ) : jobs.map(job => (
        <div key={job.id} style={{
          background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "14px 16px", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#FCA5A5", fontWeight: 600, fontSize: 13, margin: "0 0 3px" }}>
              {job.job_type || "Unknown"} — {job.lead_id || job.order_id || job.id}
            </p>
            <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>
              Failed: {job.updated_date ? new Date(job.updated_date).toLocaleString() : "—"} · Attempts: {job.attempts || 1}
            </p>
            {job.error_message && (
              <p style={{ color: "#EF4444", fontSize: 11, margin: "4px 0 0", fontFamily: "monospace" }}>
                {job.error_message.slice(0, 120)}
              </p>
            )}
          </div>
          <button onClick={() => retry(job)} disabled={retrying[job.id]} style={{
            background: "#EF4444", color: "#fff", border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            cursor: retrying[job.id] ? "not-allowed" : "pointer",
            opacity: retrying[job.id] ? 0.6 : 1,
          }}>
            {retrying[job.id] ? "..." : "Retry"}
          </button>
        </div>
      ))}
    </div>
  );
}
