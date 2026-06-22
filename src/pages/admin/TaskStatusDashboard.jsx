// Admin task status dashboard — tracks all ProjectTask progress
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Clock, AlertTriangle, Loader2, RefreshCw, Filter } from "lucide-react";

const STATUS_MAP = {
  completed: { label: "Done", color: "bg-green-100 text-green-700 border-green-200" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700 border-red-200" },
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function TaskStatusDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const t = await base44.asServiceRole.entities.ProjectTask.list("-created_date", 200);
      setTasks(t || []);
    } catch {}
    setLoading(false);
  };

  const filtered = tasks.filter(t => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = !search || (t.title || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Task Status Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">{tasks.length} total tasks tracked</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-60">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "completed", label: "Completed", icon: CheckCircle, color: "text-green-600" },
          { key: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-600" },
          { key: "blocked", label: "Blocked", icon: AlertTriangle, color: "text-red-600" },
          { key: "pending", label: "Pending", icon: Clock, color: "text-gray-500" },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={`rounded-xl border p-4 text-left transition-colors hover:shadow-sm ${filter === s.key ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <p className="text-2xl font-bold text-foreground">{counts[s.key] || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-1">
          {["all", "completed", "in_progress", "blocked", "pending"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading tasks...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="font-semibold">No tasks match your filter</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                {["Title", "Status", "Priority", "Assigned To", "Updated"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const st = STATUS_MAP[task.status] || STATUS_MAP.pending;
                return (
                  <tr key={task.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{task.title || "Untitled"}</p>
                      {task.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{task.priority || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{task.assigned_to || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{task.updated_date ? new Date(task.updated_date).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}