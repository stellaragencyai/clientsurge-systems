import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const DOMAINS = [
  { key: "D01_Stripe", label: "D01 · Stripe" },
  { key: "D02_Lead_Pipeline", label: "D02 · Lead Pipeline" },
  { key: "D03_Automation", label: "D03 · Automation" },
  { key: "D04_Security_Legal", label: "D04 · Security & Legal" },
  { key: "D05_SEO_Marketing", label: "D05 · SEO & Marketing" },
  { key: "D06_Performance", label: "D06 · Performance" },
  { key: "D07_Frontend_Visuals", label: "D07 · Frontend & Visuals" },
  { key: "D08_Client_Portal_Admin", label: "D08 · Client Portal & Admin" },
  { key: "D09_DevOps_Monitoring", label: "D09 · DevOps & Monitoring" },
  { key: "D10_Launch_Checklist", label: "D10 · Launch Checklist" },
];

const STATUS_CONFIG = {
  done: { label: "Done", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  pending: { label: "Pending", icon: Circle, color: "text-gray-400", bg: "bg-gray-50 border-gray-200" },
  blocked: { label: "Blocked", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

const PRIORITY_COLOR = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function TaskBoardPanel() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [collapsedDomains, setCollapsedDomains] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ProjectTask.list("-task_number", 500);
      setTasks(data || []);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const cycleStatus = async (task) => {
    const cycle = ["pending", "in_progress", "done", "blocked"];
    const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
    setUpdatingId(task.id);
    try {
      await base44.entities.ProjectTask.update(task.id, { status: next });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tasks.filter(t => {
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchDomain = filterDomain === "all" || t.domain === filterDomain;
    return matchStatus && matchDomain;
  });

  // Group by domain
  const grouped = DOMAINS.map(d => ({
    ...d,
    tasks: filtered.filter(t => t.domain === d.key).sort((a, b) => (a.task_number || 0) - (b.task_number || 0)),
  })).filter(d => d.tasks.length > 0);

  // Summary counts
  const counts = {
    done: tasks.filter(t => t.status === "done").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    pending: tasks.filter(t => t.status === "pending").length,
    blocked: tasks.filter(t => t.status === "blocked").length,
  };
  const total = tasks.length;
  const pct = total ? Math.round((counts.done / total) * 100) : 0;

  const toggleDomain = (key) => {
    setCollapsedDomains(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Task Board</h2>
          <p className="text-sm text-muted-foreground mt-1">{total} tasks · {pct}% complete</p>
        </div>
        <button onClick={loadTasks} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-foreground">Overall Progress</span>
          <span className="font-bold text-foreground">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className={`font-medium ${cfg.color}`}>
              {counts[key]} {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterDomain}
          onChange={e => setFilterDomain(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
        >
          <option value="all">All Domains</option>
          {DOMAINS.map(d => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Task Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No tasks match your filters.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(domain => {
            const collapsed = collapsedDomains[domain.key];
            const domainDone = domain.tasks.filter(t => t.status === "done").length;
            return (
              <div key={domain.key} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Domain header */}
                <button
                  onClick={() => toggleDomain(domain.key)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-sm">{domain.label}</span>
                    <span className="text-xs text-muted-foreground">{domainDone}/{domain.tasks.length} done</span>
                  </div>
                  {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                </button>

                {!collapsed && (
                  <div className="divide-y divide-border">
                    {domain.tasks.map(task => {
                      const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      const isUpdating = updatingId === task.id;
                      return (
                        <div key={task.id} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                          {/* Status toggle */}
                          <button
                            onClick={() => cycleStatus(task)}
                            disabled={isUpdating}
                            className={`mt-0.5 flex-shrink-0 rounded-full p-1 border ${cfg.bg} transition-colors`}
                            title="Click to cycle status"
                          >
                            <Icon className={`w-4 h-4 ${cfg.color} ${isUpdating ? "animate-spin" : ""}`} />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className="text-xs font-mono text-muted-foreground">#{task.task_number}</span>
                              <span className={`text-sm font-medium text-foreground ${task.status === "done" ? "line-through opacity-50" : ""}`}>
                                {task.title}
                              </span>
                            </div>
                            {task.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">{task.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.priority && (
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority] || "bg-gray-100 text-gray-600"}`}>
                                {task.priority}
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}