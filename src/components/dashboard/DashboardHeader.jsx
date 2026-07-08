import { CheckCircle, Clock, MessageSquare } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function DashboardHeader({ activeServices, portalState }) {
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  const rawLiveCount = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressCount = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install", "Pending Review", "Status Pending"].includes(s.installStatus)).length;
  const totalServices = activeServices.length;

  const liveLabel = isProofLive ? "Live & Verified" : "Live Status";
  const liveValue = isProofLive ? rawLiveCount : "Pending proof";
  const liveSub = isProofLive ? "verified by system evidence" : "not shown as live until verified";
  const liveColor = isProofLive ? "#16a34a" : "#B8941F";

  if (totalServices === 0) return null;

  const cards = [
    { icon: MessageSquare, label: "Automation Systems", value: totalServices, sub: "linked to this account", color: "#0a1628" },
    { icon: CheckCircle, label: liveLabel, value: liveValue, sub: liveSub, color: liveColor },
    { icon: Clock, label: "Being Set Up", value: inProgressCount, sub: "configuration or verification in progress", color: "#0088CC" },
  ];

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: "12px",
      }}>
        {cards.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} style={{
            background: "#ffffff", border: "1px solid rgba(0,174,239,0.14)",
            borderRadius: "16px", padding: "18px 20px",
            boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Icon style={{ width: "14px", height: "14px", color: "rgba(0,174,239,0.6)" }} aria-hidden="true" />
              <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            </div>
            <p style={{ fontSize: typeof value === "number" ? "28px" : "15px", fontWeight: "900", color, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.4)", margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}
