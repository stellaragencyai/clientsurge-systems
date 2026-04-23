import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Flame,
  Mail,
  MessageSquare,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const PIPELINE_COLORS = {
  New: "#3b82f6",
  Contacted: "#8b5cf6",
  Replied: "#6366f1",
  Qualified: "#10b981",
  "Booking Prompt Sent": "#f59e0b",
  Booked: "#059669",
  Closed: "#6b7280",
};

const EVENT_ICONS = {
  sms: MessageSquare,
  email: Mail,
  webhook: Zap,
  internal: Activity,
};

const STATUS_BADGE = {
  sent: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  received: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  processed: "bg-purple-100 text-purple-700",
};

function formatTimeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MetricCard({ icon: Icon, label, value, sub, color = "blue", trend }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        <Icon className="h-4 w-4 opacity-60" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1.5 text-xs opacity-70">{sub}</p>}
      {trend != null && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold">
          <ArrowUpRight className="h-3 w-3" />
          {trend} this month
        </p>
      )}
    </div>
  );
}

function ActivityRow({ event }) {
  const Icon = EVENT_ICONS[event.channel] || Activity;
  const badge = STATUS_BADGE[event.status] || "bg-gray-100 text-gray-700";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">
            {event.subject || event.event_type?.replace(/_/g, " ") || "Event"}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge}`}>
            {event.status}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
            {event.channel}
          </span>
        </div>
        {event.message_body && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-sm">
            {event.message_body}
          </p>
        )}
      </div>
      <p className="flex-shrink-0 text-[11px] text-muted-foreground pt-0.5">
        {formatTimeAgo(event.created_date)}
      </p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getAdminAnalytics", {});
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        {error}
      </div>
    );
  }

  const { users, leads, last30Days, recent_activity } = data || {};

  const pipelineData = Object.entries(leads?.status_counts || {}).map(([name, value]) => ({
    name,
    value,
    fill: PIPELINE_COLORS[name] || "#94a3b8",
  }));

  const totalPipeline = pipelineData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Key performance metrics, user activity, and 30-day lead volume.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Active Users"
          value={users?.active ?? 0}
          sub={`${users?.admins ?? 0} admin · ${users?.total ?? 0} total registered`}
          color="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Leads This Month"
          value={leads?.new_last_30_days ?? 0}
          sub={`${leads?.total ?? 0} all-time in pipeline`}
          trend={leads?.new_last_30_days ?? 0}
          color="green"
        />
        <MetricCard
          icon={Star}
          label="Avg Lead Score"
          value={leads?.avg_score ?? 0}
          sub={`${leads?.high_intent_count ?? 0} high-intent (score ≥ 60)`}
          color="amber"
        />
        <MetricCard
          icon={Flame}
          label="Booked"
          value={leads?.status_counts?.Booked ?? 0}
          sub={`${leads?.status_counts?.Qualified ?? 0} qualified · ${
            leads?.total > 0
              ? Math.round(((leads?.status_counts?.Booked ?? 0) / leads.total) * 100)
              : 0
          }% book rate`}
          color="emerald"
        />
      </div>

      {/* ── 30-Day Chart + Pipeline ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* 30-Day Lead Volume */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-1 font-semibold text-foreground">Lead Volume — Last 30 Days</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {leads?.new_last_30_days ?? 0} new leads captured over the past 30 days
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={last30Days || []} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Status Donut */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-1 font-semibold text-foreground">Pipeline Status</h3>
          <p className="mb-4 text-xs text-muted-foreground">{totalPipeline} total leads across all stages</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {pipelineData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {pipelineData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground truncate">{item.name}</span>
                <span className="ml-auto font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secondary KPIs ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard icon={Target} label="Qualified" value={leads?.status_counts?.Qualified ?? 0} color="purple" />
        <MetricCard icon={MessageSquare} label="Contacted" value={leads?.status_counts?.Contacted ?? 0} color="slate" />
        <MetricCard icon={Zap} label="Replied" value={leads?.status_counts?.Replied ?? 0} color="blue" />
        <MetricCard icon={Activity} label="High Intent" value={leads?.high_intent_count ?? 0} sub="Score ≥ 60" color="amber" />
      </div>

      {/* ── Recent Activity Log ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Recent Activity Log</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest 30 communication events across all leads</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {recent_activity?.length ?? 0} events
          </span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {(recent_activity || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No activity logged yet.</p>
          ) : (
            (recent_activity || []).map((ev) => <ActivityRow key={ev.id} event={ev} />)
          )}
        </div>
      </div>
    </div>
  );
}