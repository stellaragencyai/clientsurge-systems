import ServiceIcon from "./ServiceIcon";
import ServiceStatusBadge from "./ServiceStatusBadge";
import ServiceProgressRing from "./ServiceProgressRing";
import SystemProgressTracker from "./SystemProgressTracker";
import NextActionsPanel from "./NextActionsPanel";
import GoLiveCountdown from "./GoLiveCountdown";
import WhatHappensNext from "./WhatHappensNext";
import WhileWeSetUpCard from "./WhileWeSetUpCard";
import ActivityFeed from "./ActivityFeed";
import NotificationPreferences from "./NotificationPreferences";

const TOTAL_STAGES = 5;

function getGoLiveLabel(installStatus) {
  if (installStatus === "Live") return { text: "Live ✦", color: "#22c55e" };
  if (installStatus === "Testing") return { text: "Est. 1–2 days", color: "#3b82f6" };
  if (installStatus === "Configuring") return { text: "Est. 3–4 days", color: "#f59e0b" };
  if (installStatus === "Error") return { text: "Action needed", color: "#ef4444" };
  return { text: "Est. 5–7 days", color: "#9a5c2e" };
}

export default function ServiceCard({ service }) {
  const { serviceKey, productName, orderId, installStatus = "Paid", stageIndex = 0, orderStatus, paymentStatus } = service;
  const currentStage = stageIndex;
  const totalStages = TOTAL_STAGES;
  const goLive = getGoLiveLabel(installStatus);

  return (
    <div style={{
      borderRadius: "18px",
      background: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(154,92,46,0.1)",
      boxShadow: "0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(15,23,42,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(15,23,42,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Card top accent bar */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #9a5c2e, #c8965c, #f5d9a8)" }} />

      <div style={{ padding: "22px 22px 20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
          <ServiceIcon serviceKey={serviceKey} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1b140d", margin: 0, lineHeight: 1.3 }}>
                {productName}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#9a5c2e", background: "rgba(154,92,46,0.08)", padding: "2px 8px", borderRadius: "9999px" }}>
                  {Math.round((currentStage / totalStages) * 100)}%
                </span>
                <ServiceStatusBadge installStatus={installStatus} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "rgba(27,20,13,0.45)", fontFamily: "monospace" }}>
                #{orderId.slice(0, 8)}
              </span>
              <span style={{ fontSize: "11px", color: goLive.color, fontWeight: "600" }}>
                🕐 {goLive.text}
              </span>
            </div>
          </div>
          <ServiceProgressRing currentStage={currentStage} totalStages={totalStages} size={56} />
        </div>

        {/* Go-live countdown */}
        <GoLiveCountdown installStatus={installStatus} />

        {/* Stage progress */}
        <SystemProgressTracker serviceKey={serviceKey} currentStage={currentStage} />

        {/* Read-only installation progress */}
        <NextActionsPanel installStatus={installStatus} />

        {/* What happens next — plain English */}
        <WhatHappensNext installStatus={installStatus} />

        {/* While we set up checklist */}
        <WhileWeSetUpCard installStatus={installStatus} />

        {/* Activity timeline */}
        <ActivityFeed installStatus={installStatus} createdDate={new Date().toISOString()} />

        {/* Notification preferences */}
        <NotificationPreferences orderId={orderId} />
      </div>
    </div>
  );
}