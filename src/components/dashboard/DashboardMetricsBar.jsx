import { Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function DashboardMetricsBar({ activeServices, project, portalState }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchSnapshot, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [project?.order_id]);

  // Phase A.5: Gate all success metrics behind PortalStateEngine proof
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  // Use snapshot data if available, fall back to activeServices
  const totalServices = activeServices.length;
  const completedServices = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressServices = activeServices.filter(s => ["Configuring", "Testing"].includes(s.installStatus)).length;

  // When proof not validated, show safe pending values instead of raw numbers
  const safeLeadsCaptured = isProofLive ? (snapshot?.leads_captured_total || 0) : "Pending";
  const safeAutomationsActive = isProofLive ? (snapshot?.automations_active || completedServices) : "Pending";
  const safeSystemHealth = isProofLive
    ? (snapshot?.system_health_status === "healthy" ? "✓" : "⚠")
    : "Syncing";
  const systemHealthColor = isProofLive
    ? (snapshot?.system_health_status === "healthy" ? "#22c55e" : "#ef4444")
    : "#D4AF37";
  const systemHealthBg = isProofLive
    ? (snapshot?.system_health_status === "healthy" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)")
    : "rgba(212,175,55,0.08)";

  const metrics = [
    { icon: TrendingUp, label: "Leads Captured", value: safeLeadsCaptured, color: "#9a5c2e", bgColor: "rgba(154,92,46,0.08)" },
    { icon: CheckCircle2, label: "Automations Active", value: safeAutomationsActive, color: "#22c55e", bgColor: "rgba(34,197,94,0.08)" },
    { icon: Clock, label: "In Progress", value: inProgressServices, color: "#3b82f6", bgColor: "rgba(59,130,246,0.08)" },
    { icon: AlertCircle, label: "System Health", value: safeSystemHealth, color: systemHealthColor, bgColor: systemHealthBg, hidden: false },
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
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}