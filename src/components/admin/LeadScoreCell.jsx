import { useState } from "react";

/**
 * LeadScoreCell — #179
 * Drop-in cell component for AdminLeads table.
 * Color-coded lead_score display.
 */
export function LeadScoreCell({ score }) {
  if (score == null || score === undefined) return <span style={{ color: "#4B5563" }}>—</span>;

  const num = parseInt(score, 10);
  const color = num >= 80 ? "#00FFB3" : num >= 50 ? "#F59E0B" : "#EF4444";
  const label = num >= 80 ? "Hot" : num >= 50 ? "Warm" : "Cold";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: color, flexShrink: 0,
        boxShadow: `0 0 6px ${color}80`,
      }} />
      <span style={{ color, fontWeight: 700, fontSize: 13 }}>{num}</span>
      <span style={{ color: "#6B7280", fontSize: 11 }}>{label}</span>
    </div>
  );
}

/**
 * BulkActionToolbar — #168
 * Renders above the leads table when rows are selected.
 */
export function BulkActionToolbar({ selectedIds = [], onBulkUpdate, onClear }) {
  const [loading, setLoading] = useState(false);

  if (!selectedIds.length) return null;

  const handleMark = async (status) => {
    setLoading(true);
    try {
      await onBulkUpdate(selectedIds, { status, last_contacted: new Date().toISOString() });
      onClear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
      background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)",
      borderRadius: 10, marginBottom: 12,
    }}>
      <span style={{ color: "#00D4FF", fontWeight: 700, fontSize: 13 }}>
        {selectedIds.length} selected
      </span>
      <div style={{ flex: 1 }} />
      {["Contacted", "Follow Up", "Not Interested", "Booked"].map(status => (
        <button key={status} disabled={loading} onClick={() => handleMark(status)} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#D1D5DB", borderRadius: 9999, padding: "6px 14px", fontSize: 12,
          cursor: loading ? "not-allowed" : "pointer", fontWeight: 600,
        }}>
          {loading ? "..." : `Mark ${status}`}
        </button>
      ))}
      <button onClick={onClear} style={{
        background: "transparent", border: "none", color: "#6B7280",
        fontSize: 12, cursor: "pointer",
      }}>✕ Clear</button>
    </div>
  );
}