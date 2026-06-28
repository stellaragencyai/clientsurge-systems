import { Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/ui/PullToRefresh";

export default function DashboardMetricsBar({ activeServices, project }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        if (project?.order_id) {
          const snapshots = await base44.entities.MetricsSnapshot.filter(
            { order_id: project.order_id },
            "-snapshot_date",
            1
          );
          if (snapshots?.length > 0) {
            setSnapshot(snapshots[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load metrics snapshot:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 60000);
    return () => clearInterval(interval);
  }, [project?.order_id, refreshTick]);

  const handleRefresh = useCallback(async () => {
    setRefreshTick((t) => t + 1);
  }, []);

  // Use snapshot data if available, fall back to activeServices
  const totalServices = activeServices.length;
  const completedServices = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressServices = activeServices.filter(s => ["Configuring", "Testing"].includes(s.installStatus)).length;
  const errorServices = activeServices.filter(s => s.installStatus === "Error").length;

  const metrics = [
    { icon: TrendingUp, label: "Leads Captured", value: snapshot?.leads_captured_total || 0, color: "#9a5c2e", bgColor: "rgba(154,92,46,0.08)" },
    { icon: CheckCircle2, label: "Automations Active", value: snapshot?.automations_active || completedServices, color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
    { icon: Clock, label: "In Progress", value: inProgressServices, color: "#3b82f6", bgColor: "rgba(59,130,246,0.08)" },
    { icon: AlertCircle, label: "System Health", value: snapshot?.system_health_status === "healthy" ? "✓" : "⚠", color: snapshot?.system_health_status === "healthy" ? "#22c55e" : "#ef4444", bgColor: snapshot?.system_health_status === "healthy" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", hidden: false },
  ];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
      gap: "12px",
      marginBottom: "28px",
    }}>
      {metrics.map((metric, idx) => {
        if (metric.hidden) return null;
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            style={{
              borderRadius: "14px",
              background: "rgba(255,255,255,0.9)",
              border: `1.5px solid ${metric.color}20`,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: metric.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon style={{ width: "18px", height: "18px", color: metric.color }} />
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "rgba(27,20,13,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {metric.label}
              </p>
              <p style={{ fontSize: "20px", fontWeight: "800", color: metric.color, margin: "2px 0 0" }}>
                {metric.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
    </PullToRefresh>
  );
}