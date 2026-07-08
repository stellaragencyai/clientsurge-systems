import { Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function DashboardMetricsBar({ activeServices, project, portalState }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSnapshot = async () => {
      try {
        if (!project?.order_id) {
          if (!cancelled) setSnapshot(null);
          return;
        }
        const snapshots = await base44.entities.MetricsSnapshot.filter(
          { order_id: project.order_id },
          "-snapshot_date",
          1
        );
        if (!cancelled) setSnapshot(snapshots?.[0] || null);
      } catch (err) {
        console.warn("Failed to load metrics snapshot:", err.message);
        if (!cancelled) setSnapshot(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [project?.order_id]);

  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  const completedServices = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressServices = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install"].includes(s.installStatus)).length;
  const hasSnapshot = Boolean(snapshot);

  const safeLeadsCaptured = isProofLive && hasSnapshot ? (snapshot.leads_captured_total || 0) : "No verified data yet";
  const safeAutomationsActive = isProofLive && hasSnapshot ? (snapshot.automations_active ?? completedServices) : "Pending proof";
  const safeSystemHealth = isProofLive && hasSnapshot
    ? (snapshot.system_health_status === "healthy" ? "Verified" : "Needs review")
    : loading ? "Checking" : "Awaiting proof";
  const systemHealthColor = isProofLive && hasSnapshot
    ? (snapshot.system_health_status === "healthy" ? "#16a34a" : "#dc2626")
    : "#B8941F";
  const systemHealthBg = isProofLive && hasSnapshot
    ? (snapshot.system_health_status === "healthy" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)")
    : "rgba(212,175,55,0.08)";

  const metrics = [
    { icon: TrendingUp, label: "Leads Captured", value: safeLeadsCaptured, color: isProofLive && hasSnapshot ? "#0088CC" : "#B8941F", bgColor: isProofLive && hasSnapshot ? "rgba(0,136,204,0.08)" : "rgba(212,175,55,0.08)" },
    { icon: CheckCircle2, label: "Automations Active", value: safeAutomationsActive, color: isProofLive && hasSnapshot ? "#16a34a" : "#B8941F", bgColor: isProofLive && hasSnapshot ? "rgba(34,197,94,0.08)" : "rgba(212,175,55,0.08)" },
    { icon: Clock, label: "Being Set Up", value: inProgressServices, color: "#3b82f6", bgColor: "rgba(59,130,246,0.08)" },
    { icon: AlertCircle, label: "System Health", value: safeSystemHealth, color: systemHealthColor, bgColor: systemHealthBg },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
      gap: "12px",
      marginBottom: "28px",
    }}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            aria-label={`${metric.label}: ${metric.value}`}
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
              <Icon style={{ width: "18px", height: "18px", color: metric.color }} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "rgba(27,20,13,0.5)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {metric.label}
              </p>
              <p style={{ fontSize: typeof metric.value === "number" ? "20px" : "13px", fontWeight: "800", color: metric.color, margin: "2px 0 0" }}>
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
