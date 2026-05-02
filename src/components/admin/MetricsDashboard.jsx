import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Phone,
  Calendar,
  Users,
  Zap,
} from "lucide-react";

export default function MetricsDashboard({ projectId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMetrics();
    // Refresh every 30 minutes
    const interval = setInterval(loadMetrics, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadMetrics = async () => {
    try {
      const snapshots = await base44.entities.MetricsSnapshot.filter(
        { project_id: projectId, period: "today" },
        "-snapshot_date",
        1
      );
      if (snapshots?.length) {
        setMetrics(snapshots[0]);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading metrics...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!metrics)
    return <div className="p-4 text-gray-500">No data yet</div>;

  const stats = [
    {
      label: "Leads Captured",
      value: metrics.leads_captured,
      icon: Phone,
      color: "blue",
    },
    {
      label: "Response Rate",
      value: `${metrics.response_rate_percent}%`,
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Booked",
      value: metrics.leads_booked,
      icon: Calendar,
      color: "purple",
    },
    {
      label: "Close Rate",
      value: `${metrics.booking_rate_percent}%`,
      icon: TrendingUp,
      color: "green",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Today's Metrics</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border border-border p-4 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 text-${stat.color}-500`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Response Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {metrics.avg_response_time_minutes || "—"} min
            </p>
            <p className="text-xs text-muted-foreground mt-1">Goal: &lt;60 min</p>
          </div>

          <div className="rounded-lg border border-border p-4 bg-card">
            <p className="text-sm font-medium text-muted-foreground">Top Closer</p>
            <p className="text-2xl font-bold text-foreground mt-2">
              {metrics.top_closer_name || "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.top_closer_rate || 0}% close rate
            </p>
          </div>
        </div>

        {/* Alerts */}
        {metrics.alerts && metrics.alerts.length > 0 && (
          <div className="rounded-lg border border-border p-4 bg-card">
            <h3 className="font-semibold text-foreground mb-3">Alerts</h3>
            <div className="space-y-2">
              {metrics.alerts.map((alert, i) => {
                const IconComponent =
                  alert.type === "red"
                    ? AlertCircle
                    : alert.type === "yellow"
                    ? AlertTriangle
                    : CheckCircle;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded text-sm"
                    style={{
                      backgroundColor:
                        alert.type === "red"
                          ? "rgba(239, 68, 68, 0.1)"
                          : alert.type === "yellow"
                          ? "rgba(234, 179, 8, 0.1)"
                          : "rgba(34, 197, 94, 0.1)",
                    }}
                  >
                    <IconComponent
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{
                        color:
                          alert.type === "red"
                            ? "#ef4444"
                            : alert.type === "yellow"
                            ? "#eab308"
                            : "#22c55e",
                      }}
                    />
                    <span
                      style={{
                        color:
                          alert.type === "red"
                            ? "#b91c1c"
                            : alert.type === "yellow"
                            ? "#854d0e"
                            : "#166534",
                      }}
                    >
                      {alert.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="rounded-lg border border-border p-4 bg-card mt-6">
          <h3 className="font-semibold text-foreground mb-3">Performance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SLA Misses</span>
              <span className="font-medium text-foreground">
                {metrics.sla_misses || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Churn Risk</span>
              <span className="font-medium text-foreground">
                {metrics.churn_risk_count || 0} customers
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Automations Fired</span>
              <span className="font-medium text-foreground">
                {metrics.automations_fired || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Decisions</span>
              <span className="font-medium text-foreground">
                {metrics.ai_decisions_made || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}