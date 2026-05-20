/**
 * AdminDemoBookingsTab — #180
 * Shows DemoRequest entity records with status management.
 */
import { useState, useEffect } from "react";

const STATUS_COLORS = {
  "Pending": "#F59E0B", "Confirmed": "#00FFB3", "Completed": "#6B7280",
  "No Show": "#EF4444", "Rescheduled": "#00D4FF",
};

export default function AdminDemoBookingsTab() {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadDemos();
  }, []);

  const loadDemos = async () => {
    setLoading(true);
    try {
      const { DemoRequest } = await import("@/api/entities");
      const data = await DemoRequest.list({ sort: "-created_date", limit: 100 });
      setDemos(data || []);
    } catch (e) {
      console.error("Failed to load demos:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const { DemoRequest } = await import("@/api/entities");
    await DemoRequest.update(id, { status });
    setDemos(d => d.map(x => x.id === id ? { ...x, status } : x));
  };

  const filtered = filter === "all" ? demos : demos.filter(d => d.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
          Demo Bookings <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 400 }}>({demos.length})</span>
        </h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13,
        }}>
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Loading demos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>No demo bookings yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(demo => (
            <div key={demo.id} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ color: "#fff", fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>{demo.business_name || demo.full_name || "Unknown"}</p>
                <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>{demo.email} · {demo.phone}</p>
              </div>
              <div style={{ minWidth: 120 }}>
                <p style={{ color: "#9CA3AF", fontSize: 11, margin: "0 0 2px" }}>Scheduled</p>
                <p style={{ color: "#D1D5DB", fontSize: 13, margin: 0 }}>{demo.scheduled_date ? new Date(demo.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
              </div>
              <div style={{ minWidth: 80 }}>
                <span style={{
                  background: `${STATUS_COLORS[demo.status] || "#6B7280"}20`,
                  color: STATUS_COLORS[demo.status] || "#6B7280",
                  border: `1px solid ${STATUS_COLORS[demo.status] || "#6B7280"}40`,
                  borderRadius: 9999, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                }}>{demo.status || "Pending"}</span>
              </div>
              <select onChange={e => updateStatus(demo.id, e.target.value)} value={demo.status || "Pending"} style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#D1D5DB", borderRadius: 8, padding: "5px 10px", fontSize: 12,
              }}>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
