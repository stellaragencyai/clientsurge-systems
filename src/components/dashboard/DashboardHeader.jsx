import { CheckCircle, Clock, MessageSquare, ShieldCheck } from "lucide-react";
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
  const liveSub = isProofLive ? "backed by system evidence" : "not shown live until verified";
  const liveColor = isProofLive ? "#16a34a" : "#B8941F";

  if (totalServices === 0) return null;

  const cards = [
    { icon: MessageSquare, label: "Automation Systems", value: totalServices, sub: "linked to this account", color: "#0A1628", accent: "#00AEEF" },
    { icon: CheckCircle, label: liveLabel, value: liveValue, sub: liveSub, color: liveColor, accent: liveColor },
    { icon: Clock, label: "Being Set Up", value: inProgressCount, sub: "configuration or verification in progress", color: "#0088CC", accent: "#0088CC" },
    { icon: ShieldCheck, label: "Truth Gate", value: isProofLive ? "Passed" : "Active", sub: "prevents fake live status", color: isProofLive ? "#16a34a" : "#003B8F", accent: "#003B8F" },
  ];

  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
        gap: "14px",
      }}>
        {cards.map(({ icon: Icon, label, value, sub, color, accent }) => (
          <div key={label} style={{
            background: "linear-gradient(180deg,#ffffff 0%,#F8FCFF 100%)",
            border: "1px solid rgba(0,174,239,0.14)",
            borderRadius: "20px",
            padding: "18px 20px",
            boxShadow: "0 12px 34px rgba(0,59,143,0.07)",
            position: "relative",
            overflow: "hidden",
            minHeight: "118px",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${accent}, rgba(0,174,239,0.12))` }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}12`, border: `1px solid ${accent}28` }}>
                  <Icon style={{ width: "15px", height: "15px", color: accent }} aria-hidden="true" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "900", color: "rgba(10,22,40,0.55)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</span>
              </div>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: accent, boxShadow: `0 0 12px ${accent}66`, flexShrink: 0 }} />
            </div>
            <p style={{ fontSize: typeof value === "number" ? "32px" : "17px", fontWeight: "950", color, margin: "0 0 5px", lineHeight: 1, letterSpacing: "-0.04em" }}>{value}</p>
            <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.52)", margin: 0, lineHeight: 1.45 }}>{sub}</p>
          </div>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}
