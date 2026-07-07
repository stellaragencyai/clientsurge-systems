/**
 * AutomationsOverview — Phase 4.1
 * Uses centralized ClientStatusLanguage for all status labels.
 * Never exposes internal terms (active, paused, error, pending) directly.
 * Phase A.5: Automation statuses gated behind PortalStateEngine proof.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { getClientStatusConfig, translateCard } from "@/lib/clientStatusLanguage";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

// Maps raw automation status from getAutomationsOverview to internal CARD_STATUS
const RAW_STATUS_TO_INTERNAL = {
  active: CARD_STATUS.LIVE,
  paused: "Paused",
  error: "Error",
  pending: CARD_STATUS.NEEDS_PROOF,
  running: CARD_STATUS.SYNCING,
  completed: CARD_STATUS.LIVE,
  failed: CARD_STATUS.BLOCKED,
};

export default function AutomationsOverview({ order_id, portalState }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("getAutomationsOverview", { order_id });
        setAutomations(res?.automations || []);
      } catch {
        setAutomations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [order_id]);

  const readinessCard = getCardState(portalState, "automation_health");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;
  const translated = translateCard(readinessCard);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Loading automations...</div>;

  if (!isProofLive) {
    return (
      <div>
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0088CC", margin: 0 }}>{translated.friendlyStatus}</p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>{translated.explanation}</p>
        </div>
        {automations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {automations.map((a, i) => {
              const internalStatus = RAW_STATUS_TO_INTERNAL[a.status] || CARD_STATUS.NEEDS_PROOF;
              const config = getClientStatusConfig(internalStatus);
              const Icon = config.icon;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: config.bg, border: `1px solid ${config.border}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon style={{ width: 14, height: 14, color: config.color }} />
                    <p style={{ color: "#0A1628", fontSize: 14, fontWeight: 600, margin: 0 }}>{a.name}</p>
                  </div>
                  <span style={{ color: config.color, fontSize: 12, fontWeight: 700, background: `${config.color}12`, padding: "3px 10px", borderRadius: 9999 }}>
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {automations.length === 0 && (
          <div style={{ color: "#9CA3AF", padding: 20 }}>No automations configured for your account yet.</div>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    );
  }

  if (!automations.length) return <div style={{ color: "#9CA3AF", padding: 20 }}>No automations found for your account.</div>;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {automations.map((a, i) => {
          const internalStatus = RAW_STATUS_TO_INTERNAL[a.status] || CARD_STATUS.LIVE;
          const config = getClientStatusConfig(internalStatus);
          const Icon = config.icon;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: config.bg, border: `1px solid ${config.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon style={{ width: 14, height: 14, color: config.color }} />
                <div>
                  <p style={{ color: "#0A1628", fontSize: 14, fontWeight: 600, margin: 0 }}>{a.name}</p>
                  {a.last_run && <p style={{ color: "#6B7280", fontSize: 12, margin: "2px 0 0" }}>Last activity: {new Date(a.last_run).toLocaleDateString()}</p>}
                </div>
              </div>
              <span style={{ color: config.color, fontSize: 12, fontWeight: 700, background: `${config.color}12`, padding: "3px 10px", borderRadius: 9999 }}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}