import { CheckCircle2, Clock, AlertTriangle, Ban, Settings, TestTube, Zap } from "lucide-react";
import { getPackageAutomations, getDisplayServiceName } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STATUS_CONFIG = {
  NotIncluded: { icon: Ban, color: "#9ca3af", label: "Not Included", bg: "rgba(156,163,175,0.05)", glow: "none" },
  SetupPending: { icon: Settings, color: "#8b5cf6", label: "Setup Pending", bg: "rgba(139,92,246,0.05)", glow: "none" },
  Testing: { icon: TestTube, color: "#00AEEF", label: "Testing", bg: "rgba(0,174,239,0.05)", glow: "0 0 10px rgba(0,174,239,0.2)" },
  Verifying: { icon: Clock, color: "#00AEEF", label: "Verifying", bg: "rgba(0,174,239,0.05)", glow: "none" },
  Live: { icon: CheckCircle2, color: "#22c55e", label: "Live", bg: "rgba(34,197,94,0.05)", glow: "0 0 12px rgba(34,197,94,0.15)" },
  NeedsAttention: { icon: AlertTriangle, color: "#ef4444", label: "Needs Attention", bg: "rgba(239,68,68,0.05)", glow: "none" },
};

function resolveAutomationStatus(automationKey, services, failedEvents) {
  const svc = (services || []).find(
    (s) => {
      const sk = (s?.service_key || "").toLowerCase().replace(/[_\s-]+/g, "_");
      const ak = automationKey.toLowerCase().replace(/[_\s-]+/g, "_");
      return sk === ak || sk.includes(ak) || ak.includes(sk);
    }
  );

  if (!svc) return "SetupPending";

  const status = svc.install_status || "Paid";
  if (status === "Live") return "Live";
  if (status === "Testing") return "Testing";
  if (status === "Error") return "NeedsAttention";

  const hasFailedEvents = (failedEvents || []).some((e) => {
    const svcKey = e?.service_key || e?.metadata_json || "";
    return svcKey.includes(automationKey) && e.status === "failed";
  });
  if (hasFailedEvents) return "NeedsAttention";

  return "SetupPending";
}

export default function ActiveAutomationsPanel({ packageKey, services = [], failedEvents = [], isAdmin = false, portalState }) {
  const cardState = getCardState(portalState, "automation_health");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;
  const automations = getPackageAutomations(packageKey);

  return (
    <div style={{
      background: "rgba(255,255,255,0.65)",
      border: "1px solid rgba(0,174,239,0.13)",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 12px rgba(0,59,143,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <Zap style={{ width: "14px", height: "14px", color: "#00AEEF" }} />
        <p style={{ fontSize: "11px", fontWeight: "800", color: "#00AEEF", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          Power Systems
        </p>
      </div>

      {/* Phase A.3: Proof gate — suppress "Live" until proof validated */}
      {!isProofLive && (
        <div style={{
          padding: "10px 14px", marginBottom: "12px", borderRadius: "10px",
          background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)",
          fontSize: "12px", color: "#0088CC", fontWeight: "600",
        }}>
          {cardState.display_text}
        </div>
      )}

      {automations.length === 0 ? (
        <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.45)", margin: 0 }}>
          No automation package detected for this account.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {automations.map((auto) => {
            let resolved = resolveAutomationStatus(auto.key, services, failedEvents);
            // Phase A.3: Gate "Live" behind PortalStateEngine proof validation
            if (resolved === "Live" && !isProofLive) {
              resolved = "Verifying";
            }
            const config = STATUS_CONFIG[resolved] || STATUS_CONFIG.SetupPending;
            const Icon = config.icon;

            return (
              <div
                key={auto.key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "12px",
                  background: config.bg,
                  border: `1px solid ${config.color}18`,
                  boxShadow: config.glow,
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: `${config.color}15`,
                    border: `1px solid ${config.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon style={{ width: "14px", height: "14px", color: config.color }} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0A1628", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {auto.label}
                  </span>
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em",
                  flexShrink: 0, marginLeft: "10px", padding: "3px 10px", borderRadius: "9999px",
                  color: config.color, background: `${config.color}12`,
                }}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}