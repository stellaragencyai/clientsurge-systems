/**
 * AutomationsOverview — Phase 4.3 Premium UI
 * Uses PortalAutomationCard with design system components.
 * Never exposes internal terms (active, paused, error, pending) directly.
 * Phase A.5: Automation statuses gated behind PortalStateEngine proof.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { getClientStatusConfig, translateCard } from "@/lib/clientStatusLanguage";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";
import PortalAutomationCard from "@/components/portal/PortalAutomationCard";
import CSCard from "@/components/design-system/CSCard";

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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!isProofLive) {
    return (
      <div className="space-y-4">
        <CSCard className="!p-4" hover={false}>
          <p className="text-sm font-semibold text-[#0088CC] mb-1">{translated.friendlyStatus}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{translated.explanation}</p>
        </CSCard>
        {automations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {automations.map((a, i) => {
              const internalStatus = RAW_STATUS_TO_INTERNAL[a.status] || CARD_STATUS.NEEDS_PROOF;
              const config = getClientStatusConfig(internalStatus);
              return (
                <PortalAutomationCard
                  key={i}
                  name={a.name}
                  icon={config.icon}
                  statusLabel={config.label}
                  statusColor={config.color}
                  lastRun={a.last_run}
                />
              );
            })}
          </div>
        )}
        {automations.length === 0 && (
          <CSCard className="!p-8 text-center" hover={false}>
            <p className="text-sm text-gray-400">No automations configured for your account yet.</p>
          </CSCard>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    );
  }

  if (!automations.length) {
    return (
      <CSCard className="!p-8 text-center" hover={false}>
        <p className="text-sm text-gray-400">No automations found for your account.</p>
      </CSCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {automations.map((a, i) => {
          const internalStatus = RAW_STATUS_TO_INTERNAL[a.status] || CARD_STATUS.LIVE;
          const config = getClientStatusConfig(internalStatus);
          return (
            <PortalAutomationCard
              key={i}
              name={a.name}
              icon={config.icon}
              statusLabel={config.label}
              statusColor={config.color}
              lastRun={a.last_run}
            />
          );
        })}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}