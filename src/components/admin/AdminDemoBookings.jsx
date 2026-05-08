/**
 * AdminWebsiteLeads — #530
 * Leads tab with filters (industry, status, score range).
 * AdminDemoBookings — #531
 * Demo bookings tab (complete/no-show/reschedule status).
 */
import { useState, useEffect } from "react";
import { SpaLead } from "@/api/entities";

export function AdminWebsiteLeads() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState({ industry: "", status: "", min_score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SpaLead.list().then(d => { setLeads(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const industries = [...new Set(leads.map(l => l.industry).filter(Boolean))];
  const statuses = [...new Set(leads.map(l => l.status).filter(Boolean))];

  const filtered = leads.filter(l =>
    (!filter.industry || l.industry === filter.industry) &&
    (!filter.status || l.status === filter.status) &&
    ((l.lead_score || 0) >= filter.min_score)
  );

  const sel = (style={}) => ({ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, ...style });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filter.industry} onChange={e => setFilter(f => ({ ...f, industry: e.target.value }))} style={sel()}>
          <option value="">All Industries</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={sel()}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.min_score} onChange={e => setFilter(f => ({ ...f, min_score: Number(e.target.value) }))} style={sel()}>
          {[0,40,60,80].map(v => <option key={v} value={v}>Score ≥ {v}</option>)}
        </select>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, alignSelf: "center" }}>{filtered.length} leads</span>
      </div>
      {loading ? <p style={{ color: "#9CA3AF" }}>Loading...</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.slice(0, 50).map(l => (
            <div key={l.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ flex: 2 }}>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, margin: 0 }}>{l.business_name}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{l.industry} · {l.city || "—"}</p>
              </div>
              <span style={{ color: l.lead_score >= 80 ? "#00FFB3" : l.lead_score >= 60 ? "#F59E0B" : "#6B7280", fontSize: 12, fontWeight: 800 }}>{l.lead_score || "—"}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{l.status || "New"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminDemoBookings() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    SpaLead.filter({ demo_booked: true }).then(d => { setLeads(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await SpaLead.update(id, { status });
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {} finally { setUpdating(null); }
  };

  const STATUS_OPTIONS = ["Booked", "Completed", "No-Show", "Reschedule"];
  const statusColor = { Completed: "#00FFB3", "No-Show": "#EF4444", Reschedule: "#F59E0B", Booked: "#00D4FF" };

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12 }}>{leads.length} demo bookings</p>
      {loading ? <p style={{ color: "#9CA3AF" }}>Loading...</p> : leads.map(l => (
        <div key={l.id} style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ flex: 2 }}>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, margin: 0 }}>{l.business_name}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{l.demo_date || "Date not set"} · {l.phone}</p>
          </div>
          <select value={l.status || "Booked"} onChange={e => updateStatus(l.id, e.target.value)} disabled={updating === l.id}
            style={{ background: `${statusColor[l.status] || "#6B7280"}18`, border: `1px solid ${statusColor[l.status] || "#6B7280"}40`, color: statusColor[l.status] || "#6B7280", borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
