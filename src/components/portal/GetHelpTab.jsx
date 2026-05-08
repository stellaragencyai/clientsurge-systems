/**
 * GetHelpTab — #67
 * ClientPortal "Get Help" tab with support ticket form.
 * Writes to SupportMessage entity, Telegrams Nolan.
 */
import { useState } from "react";

export default function GetHelpTab({ order }) {
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/functions/submitSupportTicket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order_id: order?.id, business_name: order?.business_name }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("sent");
      setForm({ subject: "", message: "", priority: "normal" });
    } catch {
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Get Help</h2>
      <p style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 24 }}>Submit a support request and we'll respond within a few hours.</p>

      {status === "sent" ? (
        <div style={{ padding: 28, background: "rgba(0,255,179,0.06)", border: "1px solid rgba(0,255,179,0.2)", borderRadius: 16, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p style={{ color: "#00FFB3", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>Ticket Submitted!</p>
          <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>Nolan will reach out to you directly. Usually within a few hours.</p>
          <button onClick={() => setStatus(null)} style={{ marginTop: 16, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#9CA3AF", borderRadius: 9999, padding: "8px 20px", fontSize: 13, cursor: "pointer" }}>
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 6 }}>Subject</label>
            <input
              style={inputStyle} required
              placeholder="e.g. SMS not sending, need to update phone number..."
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 6 }}>Priority</label>
            <select style={{ ...inputStyle, appearance: "none" }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low — general question</option>
              <option value="normal">Normal — something isn't working right</option>
              <option value="high">High — system is down or leads are being missed</option>
            </select>
          </div>

          <div>
            <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 6 }}>Message</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} required
              placeholder="Describe what's happening..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>

          {status === "error" && (
            <p style={{ color: "#F87171", fontSize: 13, margin: 0 }}>⚠️ Something went wrong. Email nolan@clientsurgesystems.com directly.</p>
          )}

          <button type="submit" disabled={status === "sending"} style={{
            background: "linear-gradient(135deg, #00D4FF, #00FFB3)", color: "#0A0F1E",
            border: "none", borderRadius: 9999, padding: "14px", fontWeight: 800,
            fontSize: 15, cursor: status === "sending" ? "not-allowed" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
          }}>
            {status === "sending" ? "Submitting..." : "Submit Support Request →"}
          </button>
        </form>
      )}

      <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
        <p style={{ color: "#6B7280", fontSize: 13, margin: 0 }}>
          📧 Or email directly: <a href="mailto:nolan@clientsurgesystems.com" style={{ color: "#00AEEF" }}>nolan@clientsurgesystems.com</a>
        </p>
      </div>
    </div>
  );
}
