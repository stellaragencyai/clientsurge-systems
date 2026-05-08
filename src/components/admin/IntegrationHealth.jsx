/**
 * IntegrationHealth — #330
 * Calls getIntegrationHealth on load. Shows live status of Twilio, Resend, Stripe, etc.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const STATUS_ICONS = { ok: "✅", error: "❌", warning: "⚠️", unknown: "❓" };

export default function IntegrationHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      // #330: getIntegrationHealth called on load (not a static component)
      const res = await base44.functions.invoke("getIntegrationHealth", {});
      setHealth(res?.services || []);
      setLastChecked(new Date());
    } catch {
      setHealth([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Integration Health</h3>
        <button onClick={fetchHealth} disabled={loading} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#9CA3AF", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>
      {lastChecked && <p style={{ color: "#4B5563", fontSize: 11, margin: "0 0 12px" }}>Last checked: {lastChecked.toLocaleTimeString()}</p>}
      {loading && <div style={{ color: "#9CA3AF", fontSize: 13 }}>Checking integrations...</div>}
      {!loading && health?.map((svc, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ color: "#E5E7EB", fontSize: 13 }}>{svc.name}</span>
          <span style={{ fontSize: 13 }}>{STATUS_ICONS[svc.status] || "❓"} {svc.status}</span>
        </div>
      ))}
      {!loading && !health?.length && <div style={{ color: "#6B7280", fontSize: 13 }}>No integration data available.</div>}
    </div>
  );
}
