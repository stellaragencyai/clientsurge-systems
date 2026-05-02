import React, { useState } from "react";
import ServiceCardHeader from "./ServiceCardHeader";
import ServiceCardProgressBar from "./ServiceCardProgressBar";
import ServiceCardTimeline from "./ServiceCardTimeline";
import ServiceCardActions from "./ServiceCardActions";

export default function ResponsiveServiceCard({ service }) {
  const { serviceKey, stageIndex = 0 } = service;
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      borderRadius: "16px",
      background: "rgba(255,255,255,0.95)",
      border: "1.5px solid rgba(154,92,46,0.12)",
      boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      if (window.innerWidth > 768) {
        e.currentTarget.style.boxShadow = "0 12px 36px rgba(15,23,42,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }
    }}
    onMouseLeave={(e) => {
      if (window.innerWidth > 768) {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }
    }}
    >
      {/* Top accent bar */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, rgba(154,92,46,0.5), rgba(200,150,92,0.8), rgba(154,92,46,0.3))` }} />

      <div style={{ padding: "20px" }}>
        <ServiceCardHeader service={service} />
        <ServiceCardProgressBar stageIndex={stageIndex} totalStages={5} />

        {/* Collapsible timeline on mobile, always visible on desktop */}
        <div style={{ display: window.innerWidth < 768 ? (expanded ? "block" : "none") : "block" }}>
          <ServiceCardTimeline serviceKey={serviceKey} currentStage={stageIndex} />
          <ServiceCardActions serviceKey={serviceKey} orderId={service.orderId} />
        </div>

        {/* Mobile expand button */}
        {window.innerWidth < 768 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%",
              borderRadius: "10px",
              border: "1px solid rgba(154,92,46,0.2)",
              background: "rgba(154,92,46,0.06)",
              padding: "10px 12px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#9a5c2e",
              cursor: "pointer",
              marginTop: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.06)";
            }}
          >
            {expanded ? "−  Collapse Details" : "+  Show Details"}
          </button>
        )}
      </div>
    </div>
  );
}