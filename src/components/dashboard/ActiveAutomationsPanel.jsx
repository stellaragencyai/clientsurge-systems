import { Zap } from "lucide-react";
import { getPackageAutomations } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { getClientStatusConfig } from "@/lib/clientStatusLanguage";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[_\s-]+/g, "_");
}

function eventServiceKey(event) {
  const metadata = event?.metadata_json;
  if (typeof metadata === "string") return metadata;
  if (metadata && typeof metadata === "object") {
    return metadata.service_key || metadata.automation_key || metadata.module_key || JSON.stringify(metadata);
  }
  return event?.service_key || event?.automation_key || event?.module_key || "";
}

function serviceMatchesAutomation(service, automationKey) {
  const ak = normalizeKey(automationKey);
  const keys = [
    service?.service_key,
    service?.key,
    service?.id,
    service?.display_name,
    service?.product_name,
  ].map(normalizeKey).filter(Boolean);
  return keys.some((key) => key === ak || key.includes(ak) || ak.includes(key));
}

function resolveAutomationStatus(automationKey, services, failedEvents) {
  const svc = (services || []).find((service) => serviceMatchesAutomation(service, automationKey));

  const hasFailedEvents = (failedEvents || []).some((event) => {
    const key = normalizeKey(eventServiceKey(event));
    const automation = normalizeKey(automationKey);
    return event?.status === "failed" && (key.includes(automation) || automation.includes(key));
  });

  if (hasFailedEvents) return CARD_STATUS.BLOCKED;
  if (!svc) return CARD_STATUS.SETUP_REQUIRED;

  const status = svc.install_status || "Paid";
  if (status === "Live") return CARD_STATUS.LIVE;
  if (status === "Testing") return CARD_STATUS.NEEDS_PROOF;
  if (status === "Error") return CARD_STATUS.BLOCKED;

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
        <Zap style={{ width: "14px", height: "14px", color: "#00AEEF" }} aria-hidden="true" />
        <p style={{ fontSize: "11px", fontWeight: "800", color: "#00AEEF", textTransform: "uppercase", letterSpacing: "0.15em", margin: 0 }}>
          Automation Systems
        </p>
      </div>

      {!isProofLive && (
        <div style={{
          padding: "10px 14px", marginBottom: "12px", borderRadius: "10px",
          background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)",
          fontSize: "12px", color: "#0088CC", fontWeight: "600",
        }}>
          {cardState.display_text || "Automation status is being verified before being marked live."}
        </div>
      )}

      {automations.length === 0 ? (
        <div style={{ fontSize: "13px", color: "rgba(10,22,40,0.55)", margin: 0, lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 8px" }}>Package automation list is syncing for this account.</p>
          <a href="mailto:support@clientsurgesystems.com?subject=ClientSurge%20Package%20Sync" className="text-primary font-semibold underline">Contact support if this looks wrong</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {automations.map((auto) => {
            let resolvedStatus = resolveAutomationStatus(auto.key, services, failedEvents);
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
                  gap: "10px",
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
                    <Icon style={{ width: "14px", height: "14px", color: config.color }} aria-hidden="true" />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#0A1628", overflow: "hidden", textOverflow: "ellipsis" }}>
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
