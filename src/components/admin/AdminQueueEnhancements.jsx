/**
 * AdminQueueEnhancements.jsx — #170 #171 #174 #176 #178 #181 #187
 * Collection of admin UI enhancements — all autonomous components.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, CheckCircle, Download, Play } from "lucide-react";

// #170: Install Queue — estimated completion date
export function InstallCompletionDate({ install_initialized_at }) {
  if (!install_initialized_at) return <span style={{ color: "#6B7280", fontSize: 11 }}>—</span>;
  const est = new Date(new Date(install_initialized_at).getTime() + 6 * 24 * 60 * 60 * 1000);
  const isPast = est < new Date();
  return (
    <span style={{ color: isPast ? "#F59E0B" : "#00FFB3", fontSize: 11, fontWeight: 600 }}>
      {isPast ? "⚠️ Overdue" : `Est. ${est.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
    </span>
  );
}

// #171: Resend Welcome Email button
export function ResendWelcomeButton({ client_name, client_email, business_name }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("sendPortalWelcomeEmail", {
        client_name,
        client_email,
        business_name,
      });
      setSent(true);
    } catch {} finally { setLoading(false); }
  };
  return sent
    ? <span style={{ color: "#00FFB3", fontSize: 12 }}>✅ Sent</span>
    : <button onClick={send} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        <Send style={{ width: 11, height: 11 }} />{loading ? "Sending..." : "Resend Welcome"}
      </button>;
}

// #174: Override & Mark Live button
export function OverrideMarkLiveButton({ order_id, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!reason.trim()) return alert("Reason required.");
    setLoading(true);
    try {
      await base44.functions.invoke("overrideMarkLive", { order_id, reason });
      onSuccess?.();
      setOpen(false);
    } catch (e) { alert("Failed: " + e.message); } finally { setLoading(false); }
  };
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.2)", color: "#00FFB3", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        <CheckCircle style={{ width: 11, height: 11 }} /> Override Live
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0D1B2E", border: "1px solid rgba(0,255,179,0.2)", borderRadius: 14, padding: 24, width: 380 }}>
            <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>Override & Mark Live</h4>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 12px" }}>Provide a reason for bypassing the checklist:</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Client confirmed all services working via call" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: 10, fontSize: 12, minHeight: 80, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={submit} disabled={loading || !reason.trim()} style={{ flex: 2, background: "linear-gradient(135deg,#00FFB3,#00D4FF)", border: "none", color: "#0A0F1E", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {loading ? "Processing..." : "Confirm Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// #178: CommunicationLogsPanel Export button
export function ExportLogsButton({ order_id }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/functions/exportLeadsCSV", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comms", order_id }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `comms_${order_id}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {} finally { setLoading(false); }
  };
  return (
    <button onClick={download} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
      <Download style={{ width: 11, height: 11 }} />{loading ? "Exporting..." : "Export Logs"}
    </button>
  );
}

// #181: Enroll in Nurture button
export function EnrollInNurtureButton({ lead_id, onSuccess }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const enroll = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("startNurtureCampaign", { lead_id });
      setDone(true);
      onSuccess?.();
    } catch {} finally { setLoading(false); }
  };
  return done
    ? <span style={{ color: "#00FFB3", fontSize: 12 }}>✅ Enrolled</span>
    : <button onClick={enroll} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#A78BFA", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        <Play style={{ width: 11, height: 11 }} />{loading ? "Enrolling..." : "Enroll in Nurture"}
      </button>;
}

// #187: Assign to Admin dropdown
export function AssignToAdminDropdown({ order_id, current_admin, admins = ["Nolan", "Support", "QA"], onAssign }) {
  const [val, setVal] = useState(current_admin || "");
  const [saving, setSaving] = useState(false);
  const save = async (v) => {
    setVal(v);
    setSaving(true);
    try {
      await base44.functions.invoke("assignInstallToAdmin", { order_id, admin: v });
      onAssign?.(v);
    } catch {} finally { setSaving(false); }
  };
  return (
    <select value={val} onChange={e => save(e.target.value)} disabled={saving}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: val ? "#fff" : "rgba(255,255,255,0.35)", borderRadius: 8, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>
      <option value="">Assign to...</option>
      {admins.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}

// #188: Checklist progress bar
export function ChecklistProgressBar({ items = [] }) {
  const total = items.length;
  const done = items.filter(i => i.completed || i.status === "complete").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = pct === 100 ? "#00FFB3" : pct >= 60 ? "#F59E0B" : "#00D4FF";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700 }}>CHECKLIST</span>
        <span style={{ color, fontSize: 10, fontWeight: 800 }}>{done}/{total} ({pct}%)</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}
