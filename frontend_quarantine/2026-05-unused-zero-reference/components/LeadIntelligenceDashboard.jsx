/**
 * LeadIntelligenceDashboard — #255 #256
 * Displays real lead_score, quality_label per lead.
 * Reads from SpaLead entity — no mock data.
 */
import { useState, useEffect } from "react";

const SCORE_COLOR = (s) => s >= 80 ? "#00FFB3" : s >= 50 ? "#F59E0B" : "#EF4444";
const QUALITY_LABEL = (s) => s >= 80 ? "Hot 🔥" : s >= 50 ? "Warm" : "Cold";

export default function LeadIntelligenceDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("lead_score");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const { SpaLead } = await import("@/api/entities");
        const data = await SpaLead.list({ sort: "-lead_score", limit: 200 });
        setLeads((data || []).filter(l => l.lead_score != null));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = leads.filter(l => {
    if (filter === "hot")  return (l.lead_score || 0) >= 80;
    if (filter === "warm") return (l.lead_score || 0) >= 50 && (l.lead_score || 0) < 80;
    if (filter === "cold") return (l.lead_score || 0) < 50;
    return true;
  }).sort((a, b) => {
    if (sortBy === "lead_score") return (b.lead_score || 0) - (a.lead_score || 0);
    if (sortBy === "name") return (a.business_name || "").localeCompare(b.business_name || "");
    return 0;
  });

  const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.length) : 0;
  const hot = leads.filter(l => (l.lead_score || 0) >= 80).length;

  if (loading) return <div style={{ color: "#6B7280", padding: 40, textAlign: "center" }}>Loading lead intelligence...</div>;

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Scored", value: leads.length, color: "#00D4FF" },
          { label: "Hot Leads 🔥", value: hot, color: "#00FFB3" },
          { label: "Avg Score", value: avgScore, color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 120 }}>
            <p style={{ color: "#9CA3AF", fontSize: 11, textTransform: "uppercase", margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 800, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all","hot","warm","cold"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${filter === f ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.1)"}`,
            color: filter === f ? "#00D4FF" : "#9CA3AF",
            borderRadius: 9999, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          marginLeft: "auto", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#9CA3AF", borderRadius: 8, padding: "5px 10px", fontSize: 12,
        }}>
          <option value="lead_score">Sort: Score ↓</option>
          <option value="name">Sort: Name A-Z</option>
        </select>
      </div>

      {/* Lead list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(lead => (
          <div key={lead.id} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
          }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{lead.business_name || lead.full_name || "—"}</p>
              <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>{lead.industry || lead.niche || "—"} · {lead.city || ""}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: SCORE_COLOR(lead.lead_score), boxShadow: `0 0 6px ${SCORE_COLOR(lead.lead_score)}80` }} />
              <span style={{ color: SCORE_COLOR(lead.lead_score), fontWeight: 800, fontSize: 14 }}>{lead.lead_score}</span>
            </div>
            <span style={{
              background: `${SCORE_COLOR(lead.lead_score)}15`, color: SCORE_COLOR(lead.lead_score),
              border: `1px solid ${SCORE_COLOR(lead.lead_score)}30`, borderRadius: 9999,
              padding: "2px 10px", fontSize: 11, fontWeight: 700,
            }}>{lead.lead_quality_label || QUALITY_LABEL(lead.lead_score)}</span>
            <span style={{ color: "#4B5563", fontSize: 11, minWidth: 60 }}>{lead.status || "—"}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: "#6B7280", textAlign: "center", padding: 30 }}>No leads match this filter.</p>
        )}
      </div>
    </div>
  );
}
