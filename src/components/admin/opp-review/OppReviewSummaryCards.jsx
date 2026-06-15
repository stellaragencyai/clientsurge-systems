import { Eye, Zap, Import, FlaskConical, Ban, PhoneMissed } from "lucide-react";

const CARDS = [
  {
    key: "real",
    label: "Real Opportunities",
    icon: Eye,
    color: "#0088CC",
    bg: "rgba(0,136,204,0.07)",
    border: "rgba(0,136,204,0.18)",
  },
  {
    key: "highPriority",
    label: "High-Priority Inbound",
    icon: Zap,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.2)",
  },
  {
    key: "imported",
    label: "Imported Prospects",
    icon: Import,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.07)",
    border: "rgba(139,92,246,0.2)",
  },
  {
    key: "internal",
    label: "Internal / QA Records",
    icon: FlaskConical,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.07)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    key: "suppressed",
    label: "Suppressed",
    icon: Ban,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
  },
  {
    key: "missingContact",
    label: "Missing Contact Info",
    icon: PhoneMissed,
    color: "#6b7280",
    bg: "rgba(107,114,128,0.07)",
    border: "rgba(107,114,128,0.2)",
  },
];

export default function OppReviewSummaryCards({ classified }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px",
      marginBottom: "28px",
    }}>
      {CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
        <div key={key} style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "14px",
          padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Icon style={{ width: "15px", height: "15px", color }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
          </div>
          <p style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0, lineHeight: 1 }}>
            {(classified[key] || []).length}
          </p>
        </div>
      ))}
    </div>
  );
}