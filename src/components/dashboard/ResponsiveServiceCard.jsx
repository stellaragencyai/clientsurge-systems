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
      background: "rgba(255,255,255,0.98)",
      border: "1px solid rgba(0,174,239,0.13)",
      boxShadow: "0 2px 16px rgba(0,59,143,0.05), 0 1px 3px rgba(0,0,0,0.03)",
      overflow: "hidden",
      transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
    }}
    onMouseEnter={(e) => {
      if (window.innerWidth > 768) {
        e.currentTarget.style.boxShadow = "0 16px 44px rgba(0,59,143,0.12), 0 0 0 1px rgba(0,174,239,0.08)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }
    }}
    onMouseLeave={(e) => {
      if (window.innerWidth > 768) {
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,59,143,0.05), 0 1px 3px rgba(0,0,0,0.03)";
        e.currentTarget.style.transform = "translateY(0)";
      }
    }}
    >
      {/* Top accent bar — electric blue pulse */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, #00AEEF, transparent)` }} />

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
              border: "1px solid rgba(0,174,239,0.22)",
              background: "rgba(0,174,239,0.05)",
              padding: "10px 12px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#0088CC",
              cursor: "pointer",
              marginTop: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,174,239,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,174,239,0.05)";
            }}
          >
            {expanded ? "−  Collapse Details" : "+  Show Details"}
          </button>
        )}
      </div>
    </div>
  );
}