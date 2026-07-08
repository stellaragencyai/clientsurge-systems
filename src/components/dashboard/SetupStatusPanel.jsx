/**
 * CRITICAL ENHANCEMENT #2: User-Visible Resolution Hub
 * Translates opaque system states into human-readable, actionable instructions.
 * Renders prominently in the ClientDashboard above the service cards.
 */
import { AlertCircle, CheckCircle2, Clock, Settings, TestTube, Zap, RefreshCw, ExternalLink } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STATUS_CONFIG = {
  "Paid": {
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    title: "Payment Received — Setting Up Your Account",
    instruction: "Your payment was confirmed. Our team is initializing your automation system. You'll receive an email within 2 hours with next steps.",
    action: null,
  },
  "Ready for Install": {
    icon: Settings,
    color: "#0088CC",
    bg: "rgba(0,136,204,0.07)",
    border: "rgba(0,136,204,0.18)",
    title: "Ready to Install — We Need Your Business Info",
    instruction: "Your service slot is reserved. To proceed, we need your business credentials and configuration details. Check your email for the setup link.",
    action: { label: "Complete Setup", href: "/client-portal?tab=setup" },
  },
  "Configuring": {
    icon: Settings,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.07)",
    border: "rgba(139,92,246,0.18)",
    title: "Configuring Your Automations",
    instruction: "Our team is actively building and customizing your automation system. This typically takes 24–48 hours. No action needed from you right now.",
    action: null,
  },
  "Testing": {
    icon: TestTube,
    color: "#0088CC",
    bg: "rgba(0,136,204,0.07)",
    border: "rgba(0,136,204,0.18)",
    title: "Testing Your System — Almost Live",
    instruction: "Your automations are configured and final quality checks are running. You may receive a test message on your business phone. This is expected and normal.",
    action: null,
  },
  "Live": {
    icon: CheckCircle2,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.18)",
    title: "Your System is Live and Running",
    instruction: "All automations are active. Your leads are being captured, followed up, and nurtured automatically. Check your dashboard metrics for verified activity.",
    action: null,
  },
  "Error": {
    icon: AlertCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    title: "Installation Issue Detected",
    instruction: "We detected a problem with your setup. Our team has been automatically notified and is working on a fix. You'll receive an update within 4 hours. No action needed.",
    action: { label: "Contact Support", href: "mailto:support@clientsurgesystems.com" },
  },
};

const DEFAULT_CONFIG = {
  icon: Clock,
  color: "#6b7280",
  bg: "rgba(107,114,128,0.07)",
  border: "rgba(107,114,128,0.15)",
  title: "Checking Your Installation Status…",
  instruction: "We're loading your current setup status. This should only take a moment.",
  action: null,
};

export default function SetupStatusPanel({ installStatus, onRefresh, isRefreshing, portalState }) {
  // Phase A.6: Gate "Live" / completion states behind PortalStateEngine proof
  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  // When raw says Live but proof not validated, show verifying state instead
  const effectiveStatus = isProofLive
    ? installStatus
    : installStatus === "Live" ? "Testing" : installStatus;

  const config = STATUS_CONFIG[effectiveStatus] || DEFAULT_CONFIG;

  // Don't show the panel when fully live AND proof-validated — keeps dashboard clean
  if (effectiveStatus === "Live" && isProofLive) return null;

  // When raw says Live but proof not validated, override with verifying config
  const displayConfig = (!isProofLive && installStatus === "Live")
    ? {
        icon: Clock,
        color: "#0088CC",
        bg: "rgba(0,136,204,0.07)",
        border: "rgba(0,136,204,0.18)",
        title: "Verifying Your System — Almost Live",
        instruction: "Your setup is complete. We're running final verification checks before confirming your system is fully live. This dashboard waits for proof before showing live status.",
        action: null,
      }
    : config;

  const DisplayIcon = displayConfig.icon;
  return (
    <div style={{
      borderRadius: "22px",
      background: "linear-gradient(180deg,#ffffff 0%,#F6FBFF 100%)",
      border: `1px solid ${displayConfig.border}`,
      padding: "20px 22px",
      marginBottom: "18px",
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      boxShadow: "0 12px 34px rgba(0,59,143,0.07)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: displayConfig.color }} />
      <div style={{
        width: "42px", height: "42px", borderRadius: "14px",
        background: `${displayConfig.color}14`,
        border: `1px solid ${displayConfig.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <DisplayIcon style={{ width: "19px", height: "19px", color: displayConfig.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "11px", fontWeight: "900", color: displayConfig.color, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.14em" }}>
          Current Status
        </p>
        <p style={{ fontSize: "17px", fontWeight: "850", color: "#0A1628", margin: "0 0 7px", letterSpacing: "-0.02em" }}>
          {displayConfig.title}
        </p>
        <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.64)", margin: 0, lineHeight: 1.65, maxWidth: "820px" }}>
          {displayConfig.instruction}
        </p>

        {displayConfig.action && (
          <a
            href={displayConfig.action.href}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "12px", padding: "8px 15px", borderRadius: "9999px",
              background: displayConfig.color, color: "#fff",
              fontSize: "12px", fontWeight: "800", textDecoration: "none",
              boxShadow: `0 8px 20px ${displayConfig.color}30`,
            }}
          >
            {displayConfig.action.label} <ExternalLink style={{ width: "11px", height: "11px" }} />
          </a>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh status"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "36px", height: "36px", borderRadius: "12px",
            background: "#ffffff", border: `1px solid ${displayConfig.border}`,
            cursor: "pointer", flexShrink: 0, opacity: isRefreshing ? 0.5 : 1,
            boxShadow: "0 6px 16px rgba(0,59,143,0.06)",
          }}
        >
          <RefreshCw style={{ width: "14px", height: "14px", color: displayConfig.color, animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      )}
    </div>
  );
}
