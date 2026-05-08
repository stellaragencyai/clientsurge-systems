/**
 * AIAgentsDashboard — #551 #553
 * "AI Sales Reps" tab in AdminDashboard.
 * Shows 6 agents: name, industry, leads handled, response rate, demos.
 * Conversation viewer: click any lead to see full AI thread.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { SpaLead } from "@/api/entities";

// #553: Conversation Thread Viewer
function ConversationThread({ lead, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lead) return;
    base44.functions.invoke("getConversationThread", { lead_id: lead.id })
      .then(res => setEvents(res?.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [lead?.id]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "80vh", overflowY: "auto", background: "#0D1B2E", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Conversation — {lead?.business_name}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {loading ? <p style={{ color: "#9CA3AF" }}>Loading thread...</p> :
          events.length === 0 ? <p style={{ color: "#6B7280" }}>No messages yet.</p> :
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map((e, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: e.direction === "inbound" ? "flex-start" : "flex-end" }}>
                <div style={{ background: e.direction === "inbound" ? "rgba(255,255,255,0.06)" : "rgba(0,212,255,0.12)", border: `1px solid ${e.direction === "inbound" ? "rgba(255,255,255,0.1)" : "rgba(0,212,255,0.2)"}`, borderRadius: 10, padding: "8px 12px", maxWidth: "80%" }}>
                  <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>{e.message}</p>
                </div>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "3px 4px 0" }}>{e.direction === "inbound" ? "Lead" : "AI"} · {new Date(e.created_date).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// #551: AI Sales Reps tab
export default function AIAgentsDashboard() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.functions.invoke("getAgentPerformanceMetrics", {}),
      SpaLead.list(),
    ]).then(([agentRes, leadData]) => {
      setAgents(agentRes?.agents || []);
      setLeads(leadData || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 24 }}>Loading AI agents...</div>;

  return (
    <div>
      {selectedLead && <ConversationThread lead={selectedLead} onClose={() => setSelectedLead(null)} />}

      {/* Agent cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginBottom: 28 }}>
        {agents.map((agent, i) => (
          <div key={i} style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{agent.agent_name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: agent.status === "active" ? "#00FFB3" : "#6B7280", background: agent.status === "active" ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 9999 }}>{agent.status}</span>
            </div>
            {[["Leads", agent.total_leads], ["Contacted", agent.contacted], ["Demos", agent.demos_booked], ["Response", `${agent.response_rate}%`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{l}</span>
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Recent leads with conversation viewer */}
      <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Recent Leads — Click to view conversation</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {leads.slice(0, 20).map(lead => (
          <div key={lead.id} onClick={() => setSelectedLead(lead)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
            <div>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, margin: 0 }}>{lead.business_name}</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{lead.industry || "—"} · {lead.status || "New"}</p>
            </div>
            <span style={{ color: "#00D4FF", fontSize: 11, fontWeight: 600 }}>View thread →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
