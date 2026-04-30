import ServiceIcon from "./ServiceIcon";
import ServiceStatusBadge from "./ServiceStatusBadge";
import ServiceProgressRing from "./ServiceProgressRing";
import SystemProgressTracker from "./SystemProgressTracker";
import NextActionsPanel from "./NextActionsPanel";

const stageCounts = {
  instant_lead_response: 5, missed_call_text_back: 5, nurture_sequence_14d: 5,
  ai_booking_agent: 5, lead_reactivation: 5, review_request: 5,
};

function getGoLiveLabel(orderStatus) {
  if (orderStatus === "active") return { text: "Live", color: "#22c55e" };
  if (orderStatus === "in_progress") return { text: "Est. 3–5 days", color: "#f59e0b" };
  return { text: "Est. 5–7 days", color: "#9a5c2e" };
}

export default function ServiceCard({ service }) {
  const { serviceKey, productName, orderId, orderStatus, paymentStatus } = service;
  const currentStage = orderStatus === "active" ? 4 : orderStatus === "in_progress" ? 2 : paymentStatus === "paid" ? 1 : 0;
  const totalStages = stageCounts[serviceKey] || 5;
  const goLive = getGoLiveLabel(orderStatus);

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
              <ServiceStatusBadge orderStatus={orderStatus} paymentStatus={paymentStatus} />
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

        {/* Stage progress */}
        <SystemProgressTracker serviceKey={serviceKey} currentStage={currentStage} />

        {/* Next actions */}
        <NextActionsPanel serviceKey={serviceKey} />
      </div>
    </div>
  );
}