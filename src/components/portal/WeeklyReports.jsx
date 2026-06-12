import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart3, Mail, RefreshCw, Loader2, CheckCircle2,
  TrendingUp, Users, Calendar, Zap, AlertCircle,
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { BUILD_STEPS } from "@/utils/weeklyReportsBuildSteps";

const STATUS_COLORS = {
  New: "#3b82f6",
  Contacted: "#8b5cf6",
  Replied: "#6366f1",
  Qualified: "#f59e0b",
  "Booking Prompt Sent": "#f97316",
  Booked: "#10b981",
  Closed: "#9ca3af",
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    green: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || "bg-white border-border"}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

function BuildProgressChart({ project }) {
  const steps = Object.values(BUILD_STEPS).map((step) => ({
    label: step.label,
    status: project?.[step.field] ? "complete" : "pending",
  }));
  const completed = steps.filter(s => s.status === "complete").length;
  const pct = Math.round((completed / steps.length) * 100);

  const chartData = [{ name: "Progress", value: pct, fill: "#9a5c2e" }];

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" /> Build Progress
      </h3>
      <div className="flex items-center gap-6">
        {/* Radial chart */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="65%" outerRadius="95%"
              startAngle={90} endAngle={-270}
              data={[{ value: 100, fill: "#f3f4f6" }, ...chartData]}
            >
              <RadialBar dataKey="value" cornerRadius={8} background={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">{pct}%</span>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 space-y-1.5">
          {steps.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                s.status === "complete" ? "bg-green-500" :
                s.status === "in_progress" ? "bg-amber-500" : "bg-gray-200"
              }`} />
              <span className={`text-xs ${s.status === "complete" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {s.status === "complete" && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelineChart({ leads }) {
  const statuses = ["New","Contacted","Replied","Qualified","Booking Prompt Sent","Booked","Closed"];
  const total = leads.length || 1;
  const bars = statuses.map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(b => b.count > 0);

  if (!bars.length) return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" /> Pipeline Status
      </h3>
      <p className="text-sm text-muted-foreground py-6 text-center">No leads yet.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" /> Pipeline Status
      </h3>
      <div className="space-y-3">
        {bars.map(b => {
          const pct = Math.round((b.count / total) * 100);
          return (
            <div key={b.status} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-32 flex-shrink-0 truncate">{b.status}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: b.color }}
                />
              </div>
              <span className="text-xs font-bold text-foreground w-6 text-right">{b.count}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} total leads</span>
        <span>{leads.filter(l => l.status === "Booked").length} booked ({Math.round((leads.filter(l => l.status === "Booked").length / total) * 100)}% rate)</span>
      </div>
    </div>
  );
}

export default function WeeklyReports({ project }) {
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState({ total: 0, new_this_week: 0, qualified: 0, booked: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const loadLeads = useCallback(async () => {
    if (!project?.id) {
      setLeads([]);
      setSummary({ total: 0, new_this_week: 0, qualified: 0, booked: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getClientPortalLeads", { limit: 500 });
      setLeads(res.data?.leads || []);
      setSummary(res.data?.summary || { total: 0, new_this_week: 0, qualified: 0, booked: 0 });
    } catch {
      setLeads([]);
      setSummary({ total: 0, new_this_week: 0, qualified: 0, booked: 0 });
      setError("Unable to load report data right now.");
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const newThisWeek = summary.new_this_week || 0;
  const booked = summary.booked || 0;
  const qualified = summary.qualified || 0;

  const handleSendReport = async () => {
    setSending(true);
    setError("");
    setSent(false);
    try {
      await base44.functions.invoke("generateWeeklyReport", {
        project_id: project.id,
        send_email: true,
      });
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err?.data?.error || "Failed to send report.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Weekly Performance Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Summary of your lead pipeline and system build progress for the last 7 days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLeads}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSendReport}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sending ? "Sending…" : "Email Report to Me"}
          </button>
        </div>
      </div>

      {sent && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Report sent successfully to <strong className="ml-1">{project.client_email}</strong>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Week label */}
      <div
        className="rounded-xl px-5 py-3 flex items-center gap-2 text-sm font-medium"
        style={{ background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.15)", color: "#7a4825" }}
      >
        <Calendar className="w-4 h-4" />
        Reporting period: {weekStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading report data…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Leads" value={summary.total || leads.length} sub="All time" color="blue" />
            <StatCard icon={TrendingUp} label="New This Week" value={newThisWeek} sub="Last 7 days" color="purple" />
            <StatCard icon={BarChart3} label="Qualified" value={qualified} sub="High-intent" color="amber" />
            <StatCard icon={CheckCircle2} label="Booked" value={booked} sub="Appointments" color="green" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BuildProgressChart project={project} />
            <PipelineChart leads={leads} />
          </div>

          {/* Automated schedule note */}
          <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Automated Weekly Emails</p>
              <p className="text-xs text-muted-foreground mt-1">
                This report is automatically emailed to <strong>{project.client_email}</strong> every Monday morning. You can also send it manually anytime using the button above.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
