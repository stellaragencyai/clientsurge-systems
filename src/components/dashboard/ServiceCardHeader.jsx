import ServiceIcon from "./ServiceIcon";
import ServiceStatusBadge from "./ServiceStatusBadge";

export default function ServiceCardHeader({ service }) {
  const { serviceKey, productName, orderId, installStatus, stageIndex } = service;
  const percentComplete = Math.round((stageIndex / 5) * 100);

  const descriptionMap = {
    instant_lead_response: "SMS & Email automation • AI instant responses",
    missed_call_text_back: "Missed call recovery • Automatic text follow-up",
    nurture_sequence_14d: "14-day email sequences • Lead nurturing",
    ai_booking_agent: "AI booking assistant • Calendar integration",
    lead_reactivation: "Dormant lead reactivation • Win-back sequences",
    review_request: "Review request automation • Reputation management",
  };

  const description = descriptionMap[serviceKey] || "Automation service";

  return (
    <div style={{ marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid rgba(0,174,239,0.12)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
        <ServiceIcon serviceKey={serviceKey} size={40} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0a1628", margin: "0 0 2px", lineHeight: 1.2 }}>
            {productName}
          </h3>
          <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.55)", margin: 0, lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
        <ServiceStatusBadge installStatus={installStatus} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(10,22,40,0.45)", fontFamily: "monospace", background: "rgba(0,174,239,0.06)", padding: "4px 8px", borderRadius: "6px" }}>
            Order #{orderId.slice(0, 8).toUpperCase()}
          </span>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#0088CC", background: "rgba(0,174,239,0.08)", padding: "4px 10px", borderRadius: "6px" }}>
            {percentComplete}% Complete
          </span>
        </div>
      </div>
    </div>
  );
}