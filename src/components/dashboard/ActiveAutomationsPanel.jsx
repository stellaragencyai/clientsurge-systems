import { Zap } from "lucide-react";
import { getPackageAutomations } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { getClientStatusConfig, translateCard } from "@/lib/clientStatusLanguage";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

/**
 * ActiveAutomationsPanel — Phase 4.1
 * Uses centralized ClientStatusLanguage for all status labels and descriptions.
 * Never exposes internal terms (Live, NeedsProof, SetupRequired, etc.) directly.
 */
function resolveAutomationStatus(automationKey, services, failedEvents) {
  const svc = (services || []).find(
    (s) => {
      const sk = (s?.service_key || "").toLowerCase().replace(/[_\s-]+/g, "_");
      const ak = automationKey.toLowerCase().replace(/[_\s-]+/g, "_");
      return sk === ak || sk.includes(ak) || ak.includes(sk);
    }
  );

  if (!svc) return CARD_STATUS.SETUP_REQUIRED;

  const status = svc.install_status || "Paid";
  if (status === "Live") return CARD_STATUS.LIVE;
  if (status === "Testing") return CARD_STATUS.NEEDS_PROOF;
  if (status === "Error") return CARD_STATUS.BLOCKED;

  const hasFailedEvents = (failedEvents || []).some((e) => {
    const svcKey = e?.service_key || e?.metadata_json || "";
    return svcKey.includes(automationKey) && e.status === "failed";
  });
  if (hasFailedEvents) return CARD_STATUS.BLOCKED;

  return CARD_STATUS.SETUP_REQUIRED;
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

      {/* Proof gate — show friendly status when not yet verified */}
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
            let resolvedStatus = resolveAutomationStatus(auto.key, services, failedEvents);
            // Gate "Live" behind PortalStateEngine proof validation
            if (resolvedStatus === CARD_STATUS.LIVE && !isProofLive) {
              resolvedStatus = CARD_STATUS.NEEDS_PROOF;
            }
            const config = getClientStatusConfig(resolvedStatus);
            const Icon = config.icon;

            return (
              <div
                key={auto.key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "12px",
                  background: config.bg,
                  border: `1px solid ${config.border}`,
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