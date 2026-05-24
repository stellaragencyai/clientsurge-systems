import { Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

export default function DashboardMetricsBar({ activeServices, project }) {
  const totalServices = activeServices.length;
  const completedServices = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressServices = activeServices.filter(s => ["Configuring", "Testing"].includes(s.installStatus)).length;
  const errorServices = activeServices.filter(s => s.installStatus === "Error").length;

  const metrics = [
    { icon: TrendingUp, label: "Total Services", value: totalServices, color: "#0077B6", bgColor: "rgba(0,136,204,0.08)" },
    { icon: CheckCircle2, label: "Live & Running", value: completedServices, color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
    { icon: Clock, label: "In Progress", value: inProgressServices, color: "#3b82f6", bgColor: "rgba(59,130,246,0.08)" },
    { icon: AlertCircle, label: "Need Attention", value: errorServices, color: "#ef4444", bgColor: "rgba(239,68,68,0.08)", hidden: errorServices === 0 },
  ];

  return (
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
              <p style={{ fontSize: "11px", fontWeight: "600", color: "rgba(10,22,40,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
  );
}