/**
 * AdminLeadsEnhanced — #510 #511 #512 #513 #516
 * #510: Lead.subscribe() real-time listener
 * #511: CSS-only conversion funnel chart
 * #512: lead_score column (color pill, sortable)
 * #513: pipeline_status badge on client cards
 * #516: ⚠️ badge on orders paid 2+ days without install
 */
import { useEffect, useState, useRef } from "react";
import { SpaLead } from "@/api/entities";

// #511: CSS-only funnel
export function ConversionFunnelCSS({ leads }) {
  const total = leads.length || 1;
  const stats = [
    { label: "New", count: leads.filter(l => l.status === "New" || !l.status).length, color: "#00D4FF" },
    { label: "Contacted", count: leads.filter(l => l.status === "Contacted").length, color: "#00FFB3" },
    { label: "Booked", count: leads.filter(l => l.demo_booked || l.status === "Booked").length, color: "#A78BFA" },
    { label: "Client", count: leads.filter(l => l.status === "Client").length, color: "#F59E0B" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "flex-end", height: 80 }}>
      {stats.map((s, i) => {
        const pct = Math.max(8, Math.round((s.count / total) * 100));
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
            <span style={{ color: s.color, fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{s.count}</span>
            <div style={{ width: "100%", height: `${pct}%`, background: s.color, borderRadius: "4px 4px 0 0", opacity: 0.75, minHeight: 6 }} />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, marginTop: 4, fontWeight: 600 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// #512: lead_score color pill
export function LeadScorePill({ score }) {
  const s = Number(score) || 0;
  const color = s >= 80 ? "#00FFB3" : s >= 60 ? "#F59E0B" : s >= 40 ? "#00D4FF" : "#6B7280";
  return (
    <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 9999, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>
      {s || "—"}
    </span>
  );
}

// #513: pipeline_status badge
export function PipelineStatusBadge({ status }) {
  const colors = { Setup: "#00D4FF", Active: "#00FFB3", "On Hold": "#F59E0B", Churned: "#EF4444", Live: "#00FFB3" };
  const color = colors[status] || "#6B7280";
  return (
    <span style={{ background: `${color}15`, color, border: `1px solid ${color}30`, borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>
      {status || "Unknown"}
    </span>
  );
}

// #516: stalled install badge
export function StalledInstallBadge({ order }) {
  if (!order?.created_date || order?.workflow_stage === "Live") return null;
  const hoursSince = (Date.now() - new Date(order.created_date).getTime()) / 3600000;
  if (hoursSince < 48) return null;
  return (
    <span title="Paid 2+ days ago — install not started" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 9999, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
      ⚠️ Stalled
    </span>
  );
}

// Main table with real-time + sortable score
export default function AdminLeadsEnhanced() {
  const [leads, setLeads] = useState([]);
  const [sortField, setSortField] = useState("lead_score");
  const [sortDir, setSortDir] = useState("desc");
  const [loading, setLoading] = useState(true);
  const subRef = useRef(null);

  useEffect(() => {
    SpaLead.list().then(d => { setLeads(d || []); setLoading(false); }).catch(() => setLoading(false));
    // #510: real-time subscribe
    try {
      subRef.current = SpaLead.subscribe?.((event) => {
        if (event.type === "create") setLeads(p => [event.data, ...p]);
        else if (event.type === "update") setLeads(p => p.map(l => l.id === event.data.id ? event.data : l));
        else if (event.type === "delete") setLeads(p => p.filter(l => l.id !== event.data.id));
      });
    } catch {
      const iv = setInterval(() => SpaLead.list().then(d => setLeads(d || [])).catch(() => {}), 30000);
      return () => clearInterval(iv);
    }
    return () => subRef.current?.unsubscribe?.();
  }, []);

  const sorted = [...leads].sort((a, b) => {
    const av = a[sortField] ?? 0, bv = b[sortField] ?? 0;
    return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) return <div style={{ color: "#9CA3AF", padding: 24 }}>Loading leads...</div>;

  return (
    <div>
      <ConversionFunnelCSS leads={leads} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {[["Business", "business_name"], ["Status", "status"], ["Score ↕", "lead_score"], ["Industry", "industry"], ["Source", "source"]].map(([h, f]) => (
                <th key={f} onClick={() => toggleSort(f)} style={{ color: sortField === f ? "#00D4FF" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textAlign: "left", padding: "8px 12px", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", userSelect: "none" }}>
                  {h}{sortField === f ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 60).map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ color: "#fff", padding: "10px 12px", fontWeight: 500 }}>{l.business_name}</td>
                <td style={{ padding: "10px 12px" }}><PipelineStatusBadge status={l.status} /></td>
                <td style={{ padding: "10px 12px" }}><LeadScorePill score={l.lead_score} /></td>
                <td style={{ color: "rgba(255,255,255,0.5)", padding: "10px 12px" }}>{l.industry || "—"}</td>
                <td style={{ color: "rgba(255,255,255,0.4)", padding: "10px 12px" }}>{l.source || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
