/**
 * AutomationsOverview — #318
 * Replaces fake data with real getAutomationsOverview function call.
 * Shows live automation statuses from entity data.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  active: "#00FFB3", paused: "#F59E0B", error: "#EF4444", pending: "#9CA3AF",
};

export default function AutomationsOverview({ order_id }) {
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

  if (loading) return <div style={{ color: "#9CA3AF", padding: 20 }}>Loading automations...</div>;
  if (!automations.length) return <div style={{ color: "#9CA3AF", padding: 20 }}>No automations found for this order.</div>;

  return (
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
  );
}
