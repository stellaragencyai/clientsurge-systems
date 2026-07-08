import React, { useEffect, useState } from "react";
import ServiceCardHeader from "./ServiceCardHeader";
import ServiceCardProgressBar from "./ServiceCardProgressBar";
import ServiceCardTimeline from "./ServiceCardTimeline";
import ServiceCardActions from "./ServiceCardActions";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

export default function ResponsiveServiceCard({ service, portalState }) {
  const { serviceKey, stageIndex = 0 } = service;
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;
  const safeInstallStatus = isProofLive
    ? service.installStatus
    : service.installStatus === "Live" ? "Testing" : service.installStatus;
  const safeService = { ...service, installStatus: safeInstallStatus };
  const detailsId = `service-card-details-${serviceKey || "unknown"}`;

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
      if (!isMobile) {
        e.currentTarget.style.boxShadow = "0 16px 44px rgba(0,59,143,0.12), 0 0 0 1px rgba(0,174,239,0.08)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,59,143,0.05), 0 1px 3px rgba(0,0,0,0.03)";
        e.currentTarget.style.transform = "translateY(0)";
      }
    }}
    >
      <div style={{ height: "3px", background: `linear-gradient(90deg, transparent, #00AEEF, transparent)` }} />

      <div style={{ padding: "20px" }}>
        <ServiceCardHeader service={safeService} portalState={portalState} />
        <ServiceCardProgressBar stageIndex={stageIndex} totalStages={5} />

        {!isProofLive && service.installStatus === "Live" && (
          <div style={{
            marginTop: "8px", marginBottom: "12px", padding: "8px 12px",
            borderRadius: "8px", background: "rgba(0,174,239,0.06)",
            border: "1px solid rgba(0,174,239,0.15)",
          }}>
            <p style={{ fontSize: "11px", fontWeight: "600", color: "#0088CC", margin: 0 }}>
              {readinessCard.display_text || "Status is being verified before being marked live."}
            </p>
          </div>
        )}

        <div id={detailsId} style={{ display: isMobile ? (expanded ? "block" : "none") : "block" }}>
          <ServiceCardTimeline serviceKey={serviceKey} currentStage={stageIndex} />
          <ServiceCardActions serviceKey={serviceKey} orderId={service.orderId} />
        </div>

        {isMobile && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
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
            {expanded ? "Collapse Details" : "Show Details"}
          </button>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
