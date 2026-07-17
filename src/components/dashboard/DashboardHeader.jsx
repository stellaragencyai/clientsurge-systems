import { CheckCircle, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function DashboardHeader({ activeServices, portalState }) {
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  const rawLiveCount = activeServices.filter(s => s.installStatus === "Live").length;
  const buildInProgressCount = activeServices.filter(s => ["Configuring", "Testing", "Ready for Install", "Pending Review", "Status Pending"].includes(s.installStatus)).length;
  const verificationInProgressCount = isProofLive ? 0 : rawLiveCount;
  const inProgressCount = buildInProgressCount + verificationInProgressCount;
  const totalServices = activeServices.length;

  const liveLabel = isProofLive ? "Live & Verified" : "Live Status";
  const liveValue = isProofLive ? rawLiveCount : "Pending proof";
  const liveSub = isProofLive ? "backed by system evidence" : "not shown live until verified";
  const liveColor = isProofLive ? "#16a34a" : "#B8941F";
  const progressLabel = verificationInProgressCount > 0 ? "Verification Running" : "Being Set Up";
  const progressSub = verificationInProgressCount > 0
    ? "systems awaiting verified launch proof"
    : "configuration or verification in progress";

  if (totalServices === 0) return null;

  const cards = [
    {
      icon: MessageSquare,
      label: "Automation Systems",
      value: totalServices,
      sub: "linked to this account",
      color: "#0A1628",
      accent: "#00AEEF",
      badge: "Connected",
      progress: 100,
    },
    {
      icon: CheckCircle,
      label: liveLabel,
      value: liveValue,
      sub: liveSub,
      color: liveColor,
      accent: liveColor,
      badge: isProofLive ? "Verified" : "Awaiting proof",
      progress: isProofLive ? 100 : 68,
    },
    {
      icon: Clock,
      label: progressLabel,
      value: inProgressCount,
      sub: progressSub,
      color: "#0088CC",
      accent: "#0088CC",
      badge: verificationInProgressCount > 0 ? "Verification" : inProgressCount > 0 ? "In progress" : "Clear",
      progress: verificationInProgressCount > 0 ? 68 : inProgressCount > 0 ? 52 : 100,
    },
    {
      icon: ShieldCheck,
      label: "Verification Safeguard",
      value: isProofLive ? "Verified" : "Active",
      sub: isProofLive
        ? "live status confirmed by verified checks"
        : "marks systems live only after checks pass",
      color: isProofLive ? "#16a34a" : "#003B8F",
      accent: isProofLive ? "#16a34a" : "#003B8F",
      badge: "Protected",
      progress: 100,
    },
  ];

  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
        gap: "14px",
      }}>
        {cards.map(({ icon: Icon, label, value, sub, color, accent, badge, progress }) => (
          <div key={label} style={{
            background: "linear-gradient(180deg,#ffffff 0%,#F7FBFF 100%)",
            border: "1px solid rgba(0,174,239,0.16)",
            borderRadius: "20px",
            padding: "18px 20px 16px",
            boxShadow: "0 14px 38px rgba(0,59,143,0.09)",
            position: "relative",
            overflow: "hidden",
            minHeight: "136px",
          }}>
            <div style={{
              position: "absolute",
              inset: "0 auto auto 0",
              width: "100%",
              height: "4px",
              background: `linear-gradient(90deg, ${accent}, ${accent}55 58%, transparent)`,
            }} />
            <div style={{
              position: "absolute",
              right: "-24px",
              top: "-30px",
              width: "96px",
              height: "96px",
              borderRadius: "999px",
              background: `radial-gradient(circle, ${accent}18 0%, transparent 72%)`,
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "13px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${accent}14`,
                  border: `1px solid ${accent}30`,
                  boxShadow: `0 6px 16px ${accent}18`,
                  flexShrink: 0,
                }}>
                  <Icon style={{ width: "16px", height: "16px", color: accent }} aria-hidden="true" />
                </div>
                <span style={{ fontSize: "10px", fontWeight: "900", color: "rgba(10,22,40,0.58)", textTransform: "uppercase", letterSpacing: "0.12em", lineHeight: 1.2 }}>{label}</span>
              </div>
              <span style={{
                fontSize: "9px",
                fontWeight: "850",
                color: accent,
                background: `${accent}10`,
                border: `1px solid ${accent}24`,
                borderRadius: "999px",
                padding: "4px 7px",
                whiteSpace: "nowrap",
              }}>{badge}</span>
            </div>

            <p style={{ fontSize: typeof value === "number" ? "34px" : "18px", fontWeight: "950", color, margin: "0 0 5px", lineHeight: 1, letterSpacing: "-0.04em", position: "relative" }}>{value}</p>
            <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.54)", margin: "0 0 12px", lineHeight: 1.45, minHeight: "16px", position: "relative" }}>{sub}</p>

            <div style={{ height: "5px", borderRadius: "999px", background: "rgba(0,59,143,0.07)", overflow: "hidden", position: "relative" }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "inherit",
                background: `linear-gradient(90deg, ${accent}, ${accent}AA)`,
                boxShadow: `0 0 12px ${accent}44`,
              }} />
            </div>
          </div>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}
