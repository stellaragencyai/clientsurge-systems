/**
 * AdminLeadsTable — #169 #175 #177
 * Real-time leads table with Leads.subscribe() listener.
 * Manual SMS send panel (#175).
 * Conversion funnel chart (#177).
 */
import { useEffect, useState, useRef } from "react";
import { SpaLead } from "@/api/entities";
import { base44 } from "@/api/base44Client";

// #177: Conversion funnel data
function ConversionFunnel({ leads }) {
  const total = leads.length;
  const contacted = leads.filter(l => l.status === "Contacted" || l.status === "Booked").length;
  const booked = leads.filter(l => l.demo_booked || l.status === "Booked").length;
  const paid = leads.filter(l => l.status === "Client").length;

  const stages = [
    { label: "Lead", count: total, color: "#00D4FF" },
    { label: "Contacted", count: contacted, color: "#00FFB3" },
    { label: "Booked", count: booked, color: "#A78BFA" },
    { label: "Paid", count: paid, color: "#F59E0B" },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 12px" }}>Conversion Funnel</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        {stages.map((s, i) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          const height = Math.max(20, (pct / 100) * 80);
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: s.color, fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>{s.count}</p>
              <div style={{ height, background: s.color, borderRadius: "4px 4px 0 0", opacity: 0.8, transition: "height 0.4s ease" }} />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "4px 0 0", fontWeight: 600 }}>{s.label}</p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, margin: 0 }}>{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// #175: Manual SMS panel
function ManualSmsSender({ lead, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!message.trim() || !lead?.phone) return;
    setSending(true);
    try {
      await base44.functions.invoke("sendSMS", { to: lead.phone, message: message.trim(), lead_id: lead.id });
      setSent(true);
      setTimeout(onClose, 1500);
    } catch { alert("Failed to send SMS."); } finally { setSending(false); }
  };

  return (
    <div style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "16px", marginTop: 8 }}>
      <p style={{ color: "#00D4FF", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>Send Manual SMS to {lead?.business_name}</p>
      {sent ? <p style={{ color: "#00FFB3", fontSize: 12 }}>✅ Sent!</p> : (
        <>
          <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={160}
            placeholder="Type your message... (160 char max)"
            style={{ width: "100%", minHeight: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12, resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{message.length}/160</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>Cancel</button>
              <button onClick={send} disabled={sending || !message.trim()} style={{ background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminLeadsTable() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsTarget, setSmsTarget] = useState(null);
  const subRef = useRef(null);

  useEffect(() => {
    // Initial load
    SpaLead.list().then(data => { setLeads(data || []); setLoading(false); }).catch(() => setLoading(false));

    // #169: real-time subscription
    try {
      subRef.current = SpaLead.subscribe((event) => {
        if (event.type === "create") setLeads(prev => [event.data, ...prev]);
        else if (event.type === "update") setLeads(prev => prev.map(l => l.id === event.data.id ? event.data : l));
        else if (event.type === "delete") setLeads(prev => prev.filter(l => l.id !== event.data.id));
      });
    } catch (e) {
      // Fallback: poll every 30s if subscribe not available
      const interval = setInterval(() => SpaLead.list().then(data => setLeads(data || [])).catch(() => {}), 30000);
      return () => clearInterval(interval);
    }

    return () => { if (subRef.current?.unsubscribe) subRef.current.unsubscribe(); };
  }, []);

  if (loading) return <div style={{ color: "#9CA3AF", padding: 24 }}>Loading leads...</div>;

  return (
    <div>
      <ConversionFunnel leads={leads} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {["Business", "Phone", "Status", "Score", "SMS"].map(h => (
                <th key={h} style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textAlign: "left", padding: "8px 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 50).map((l) => (
              <>
                <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ color: "#fff", padding: "10px 12px", fontWeight: 500 }}>{l.business_name}</td>
                  <td style={{ color: "rgba(255,255,255,0.6)", padding: "10px 12px" }}>{l.phone}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ background: l.status === "Booked" ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.05)", color: l.status === "Booked" ? "#00FFB3" : "rgba(255,255,255,0.5)", borderRadius: 9999, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                      {l.status || "New"}
                    </span>
                  </td>
                  <td style={{ color: l.lead_score >= 70 ? "#00FFB3" : "rgba(255,255,255,0.5)", padding: "10px 12px", fontWeight: 700 }}>{l.lead_score || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => setSmsTarget(smsTarget?.id === l.id ? null : l)}
                      style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00D4FF", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      SMS
                    </button>
                  </td>
                </tr>
                {smsTarget?.id === l.id && (
                  <tr key={`sms-${l.id}`}><td colSpan={5} style={{ padding: "0 12px 12px" }}><ManualSmsSender lead={l} onClose={() => setSmsTarget(null)} /></td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
