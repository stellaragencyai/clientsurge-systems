import { CheckCircle, Clock, MessageSquare } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

// Plain-English label map — no technical jargon exposed to clients
const PLAIN_STATUS = {
  "Paid": "Payment Confirmed",
  "Ready for Install": "Queued for Setup",
  "Configuring": "Being Configured",
  "Testing": "Being Tested",
  "Live": "Live & Active",
  "Error": "Needs Attention",
};

export default function DashboardHeader({ activeServices, project, order, portalState }) {
  // Phase A.6: Gate "Live & Running" count behind PortalStateEngine proof
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  const rawLiveCount = activeServices.filter(s => s.installStatus === "Live").length;
  const inProgressCount = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install"].includes(s.installStatus)).length;
  const totalServices = activeServices.length;

  // When proof not validated, suppress live count — show "Syncing" instead
  const liveCount = isProofLive ? rawLiveCount : 0;
  const syncCount = isProofLive ? 0 : rawLiveCount;
  const liveLabel = isProofLive ? "Live & Running" : "Verifying";
  const liveSub = isProofLive ? "capturing leads now" : "final checks in progress";
  const liveColor = isProofLive ? "#16a34a" : "#D4AF37";

  if (totalServices === 0) return null;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px",
    }}>
      {[
        { icon: MessageSquare, label: "Automation Systems", value: totalServices, sub: "in your account", color: "#0a1628" },
        { icon: CheckCircle, label: liveLabel, value: isProofLive ? liveCount : (syncCount > 0 ? syncCount : "—"), sub: liveSub, color: liveColor },
        { icon: Clock, label: "Being Set Up", value: inProgressCount + (isProofLive ? 0 : syncCount), sub: "our team is on it", color: "#0088CC" },
      ].map(({ icon: Icon, label, value, sub, color }) => (
        <div key={label} style={{
          background: "#ffffff", border: "1px solid rgba(0,174,239,0.14)",
          borderRadius: "16px", padding: "18px 20px",
          boxShadow: "0 2px 12px rgba(0,59,143,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Icon style={{ width: "14px", height: "14px", color: "rgba(0,174,239,0.6)" }} />
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: "900", color, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.4)", margin: 0 }}>{sub}</p>
        </div>
      ))}
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}