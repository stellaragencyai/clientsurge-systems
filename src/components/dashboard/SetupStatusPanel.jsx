/**
 * CRITICAL ENHANCEMENT #2: User-Visible Resolution Hub
 * Translates opaque system states into human-readable, actionable instructions.
 * Renders prominently in the ClientDashboard above the service cards.
 */
import { AlertCircle, CheckCircle2, Clock, Settings, TestTube, Zap, RefreshCw, ExternalLink } from "lucide-react";

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
    title: "Testing Your System — Almost Live!",
    instruction: "Your automations are configured and we're running final quality tests. You may receive a test message on your business phone. This is expected and normal.",
    action: null,
  },
  "Live": {
    icon: CheckCircle2,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.18)",
    title: "Your System is Live and Running",
    instruction: "All automations are active. Your leads are being captured, followed up, and nurtured automatically. Check your dashboard metrics for real-time activity.",
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

export default function SetupStatusPanel({ installStatus, onRefresh, isRefreshing }) {
  const config = STATUS_CONFIG[installStatus] || DEFAULT_CONFIG;
  const Icon = config.icon;

  // Don't show the panel when fully live — keeps dashboard clean
  if (installStatus === "Live") return null;

  return (
    <div style={{
      borderRadius: "14px",
      background: config.bg,
      border: `1px solid ${config.border}`,
      padding: "18px 22px",
      marginBottom: "20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "14px",
    }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "10px",
        background: `${config.color}18`,
        border: `1px solid ${config.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: "18px", height: "18px", color: config.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "13px", fontWeight: "800", color: config.color, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Current Status
        </p>
        <p style={{ fontSize: "15px", fontWeight: "700", color: "#0A1628", margin: "0 0 5px" }}>
          {config.title}
        </p>
        <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.6)", margin: 0, lineHeight: 1.6 }}>
          {config.instruction}
        </p>

        {config.action && (
          <a
            href={config.action.href}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              marginTop: "10px", padding: "7px 14px", borderRadius: "9999px",
              background: config.color, color: "#fff",
              fontSize: "12px", fontWeight: "700", textDecoration: "none",
            }}
          >
            {config.action.label} <ExternalLink style={{ width: "11px", height: "11px" }} />
          </a>
        )}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh status"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "32px", height: "32px", borderRadius: "8px",
            background: "transparent", border: `1px solid ${config.border}`,
            cursor: "pointer", flexShrink: 0, opacity: isRefreshing ? 0.5 : 1,
          }}
        >
          <RefreshCw style={{ width: "13px", height: "13px", color: config.color, animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      )}
    </div>
  );
}