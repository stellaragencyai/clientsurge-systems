/**
 * AutomationsOverview — #318
 * Replaces fake data with real getAutomationsOverview function call.
 * Shows live automation statuses from entity data.
 * Phase A.5: Automation statuses gated behind PortalStateEngine proof.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STATUS_COLORS = {
  active: "#00FFB3", paused: "#F59E0B", error: "#EF4444", pending: "#9CA3AF",
};

export default function AutomationsOverview({ order_id, portalState }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) return;
    (async () => {
      try {
        // #318: real data from getAutomationsOverview
        const res = await base44.functions.invoke("getAutomationsOverview", { order_id });
        setAutomations(res?.automations || []);
      } catch {
        setAutomations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [order_id]);

  // Phase A.5: Gate automation "active" status behind PortalStateEngine proof
  const readinessCard = getCardState(portalState, "automation_health");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Loading automations...</div>;

  if (!isProofLive) {
    return (
      <div>
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0088CC", margin: 0 }}>{readinessCard.display_text}</p>
        </div>
        {automations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {automations.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px" }}>
                <div>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0 }}>{a.name}</p>
                </div>
                <span style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 9999 }}>
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
        {automations.length === 0 && (
          <div style={{ color: "#9CA3AF", padding: 20 }}>No automations configured for this order yet.</div>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    );
  }

  if (!automations.length) return <div style={{ color: "#9CA3AF", padding: 20 }}>No automations found for this order.</div>;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {automations.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px" }}>
            <div>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0 }}>{a.name}</p>
              {a.last_run && <p style={{ color: "#6B7280", fontSize: 12, margin: "2px 0 0" }}>Last run: {new Date(a.last_run).toLocaleDateString()}</p>}
            </div>
            <span style={{ color: STATUS_COLORS[a.status] || "#9CA3AF", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "3px 10px", borderRadius: 9999 }}>
              {a.status || "unknown"}
            </span>
          </div>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}