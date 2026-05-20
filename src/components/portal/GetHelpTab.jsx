/**
 * GetHelpTab — #191 #259
 * Client portal "Get Help" tab — support ticket form → creates SupportMessage entity.
 */
import { useState } from "react";

const ISSUE_TYPES = [
  "Automations not firing",
  "SMS not sending",
  "Lead not responding",
  "Billing question",
  "Need a change to my messaging",
  "Other",
];

export default function GetHelpTab({ order_id, client_name }) {
  const [form, setForm] = useState({ issue_type: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issue_type || !form.message) return;
    setLoading(true); setError(null);
    try {
      const { SupportMessage } = await import("@/api/entities");
      await SupportMessage.create({
        order_id, client_name,
        issue_type: form.issue_type,
        subject: form.subject || form.issue_type,
        message: form.message,
        status: "open",
        submitted_at: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (e) {
      setError("Failed to submit. Please email nolan@clientsurgesystems.com directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ color: "#00FFB3", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Ticket submitted!</h3>
      <p style={{ color: "#9CA3AF", fontSize: 14 }}>Nolan will respond within a few hours. Check your email.</p>
      <button onClick={() => { setSubmitted(false); setForm({ issue_type: "", subject: "", message: "" }); }}
        style={{ marginTop: 20, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#9CA3AF", borderRadius: 9999, padding: "8px 20px", fontSize: 12, cursor: "pointer" }}>
        Submit another
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>Get Help</h2>
      <p style={{ color: "#9CA3AF", fontSize: 14, margin: "0 0 28px" }}>
        Tell us what's going on — we'll get back to you within a few hours.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Issue Type *</label>
          <select value={form.issue_type} onChange={e => setForm(f => ({ ...f, issue_type: e.target.value }))} required
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14 }}>
            <option value="">Select an issue type...</option>
            {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Subject (optional)</label>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief subject..."
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Message *</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5}
            placeholder="Describe what's happening..."
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
        </div>
        {error && <p style={{ color: "#EF4444", fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading || !form.issue_type || !form.message} style={{
          background: "linear-gradient(135deg,#00D4FF,#00FFB3)", color: "#0A0F1E",
          border: "none", borderRadius: 9999, padding: "12px 28px",
          fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, alignSelf: "flex-start",
        }}>
          {loading ? "Submitting..." : "Submit Ticket →"}
        </button>
      </form>
    </div>
  );
}
