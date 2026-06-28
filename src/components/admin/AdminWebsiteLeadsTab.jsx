/**
 * AdminWebsiteLeadsTab — #173
 * Dedicated tab showing WebsiteLead entity with filters.
 */
import { useState, useEffect } from "react";

const STATUS_OPTS = ["All", "new", "contacted", "booked", "not_interested"];
const PHONE_STATUS = {
  approved: { label: "Verified", color: "#00FFB3", bg: "rgba(0,255,179,0.1)" },
  pending: { label: "Pending", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  failed: { label: "Failed", color: "#F87171", bg: "rgba(248,113,113,0.1)" },
  not_attempted: { label: "Not attempted", color: "#9CA3AF", bg: "rgba(255,255,255,0.05)" },
};

function getPhoneStatus(lead) {
  if (lead.phone_verified === true) return PHONE_STATUS.approved;
  return PHONE_STATUS[lead.phone_verification_status] || PHONE_STATUS.not_attempted;
}

export default function AdminWebsiteLeadsTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { WebsiteLead } = await import("@/api/entities");
      const data = await WebsiteLead.list({ sort: "-created_date", limit: 200 });
      setLeads(data || []);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  const displayed = leads.filter(l => {
    const matchStatus = filter === "All" || l.status === filter || l.lead_status === filter;
    const matchSearch = !search || [l.full_name, l.email, l.phone, l.phone_number, l.phone_e164, l.business_name]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, flex: 1 }}>
          Website Leads <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 400 }}>({leads.length})</span>
        </h2>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 13, width: 180,
        }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 13,
        }}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
        </select>
        <button onClick={loadLeads} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#9CA3AF", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>↻</button>
      </div>

      {loading ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Loading...</div>
      ) : displayed.length === 0 ? (
        <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>No website leads match your filter.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayed.map(lead => {
            const phoneStatus = getPhoneStatus(lead);
            return (
              <div key={lead.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>{lead.full_name || "—"}</p>
                  <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>{lead.email} · {lead.phone_number || lead.phone || "—"}</p>
                </div>
                <p style={{ color: "#6B7280", fontSize: 12, margin: 0, minWidth: 120 }}>{lead.business_name || "—"}</p>
                <span style={{
                  background: phoneStatus.bg,
                  color: phoneStatus.color,
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9999,
                  padding: "2px 10px", fontSize: 11, fontWeight: 700,
                }}>{phoneStatus.label}</span>
                <span style={{
                  background: lead.lead_status === "booked" || lead.status === "booked" ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)",
                  color: lead.lead_status === "booked" || lead.status === "booked" ? "#00FFB3" : "#9CA3AF",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9999,
                  padding: "2px 10px", fontSize: 11, fontWeight: 600,
                }}>{lead.lead_status || lead.status || "new"}</span>
                <p style={{ color: "#4B5563", fontSize: 11, margin: 0 }}>
                  {lead.created_date ? new Date(lead.created_date).toLocaleDateString() : "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
