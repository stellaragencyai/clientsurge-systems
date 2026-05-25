import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

function formatTimestamp(value) {
  if (!value) {
    return "Unknown";
  }
  return new Date(value).toLocaleString();
}

export default function AuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const records = await base44.entities.AuditLog.list("-timestamp", 100);
      setLogs(records || []);
      setError("");
    } catch (err) {
      setError(err?.message || "Unable to load audit logs right now.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Recent admin actions captured in the canonical AuditLog entity.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading audit activity...
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-sm text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">
            No admin actions logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">When</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Record</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-4 py-3 text-foreground">{formatTimestamp(log.timestamp || log.created_date)}</td>
                    <td className="px-4 py-3 text-foreground">{log.admin_email || "Unknown"}</td>
                    <td className="px-4 py-3 text-foreground">{log.action || "Unknown"}</td>
                    <td className="px-4 py-3 text-foreground">{log.entity_name || "Unknown"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.record_id || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
