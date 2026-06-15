import { Eye, Zap, Download, FlaskConical, Ban, PhoneMissed, Copy, ShieldOff } from "lucide-react";

const CARDS = [
  { key: "real",         label: "Real Opportunities",      icon: Eye,         color: "#0088CC", bg: "rgba(0,136,204,0.07)",    border: "rgba(0,136,204,0.18)" },
  { key: "highPriority", label: "High-Priority Inbound",   icon: Zap,         color: "#16a34a", bg: "rgba(22,163,74,0.07)",    border: "rgba(22,163,74,0.2)" },
  { key: "imported",     label: "Imported Prospects",      icon: Download,    color: "#8b5cf6", bg: "rgba(139,92,246,0.07)",   border: "rgba(139,92,246,0.2)" },
  { key: "duplicates",   label: "Duplicate Candidates",    icon: Copy,        color: "#6b7280", bg: "rgba(107,114,128,0.07)",  border: "rgba(107,114,128,0.2)" },
  { key: "internal",     label: "Internal / QA Records",   icon: FlaskConical,color: "#d97706", bg: "rgba(245,158,11,0.07)",   border: "rgba(245,158,11,0.2)" },
  { key: "suppressed",   label: "Suppressed",              icon: Ban,         color: "#dc2626", bg: "rgba(220,38,38,0.07)",    border: "rgba(220,38,38,0.2)" },
  { key: "missingContact",label: "Missing Contact Info",   icon: PhoneMissed, color: "#64748b", bg: "rgba(100,116,139,0.07)",  border: "rgba(100,116,139,0.2)" },
  { key: "consentMissing",label: "Consent Missing",        icon: ShieldOff,   color: "#ea580c", bg: "rgba(234,88,12,0.07)",   border: "rgba(234,88,12,0.2)" },
];

export default function OppReviewSummaryCards({ classified }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
      gap: "10px",
      marginBottom: "20px",
    }}>
      {CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
        <div key={key} style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "14px",
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
            <Icon style={{ width: "14px", height: "14px", color, flexShrink: 0 }} />
            <span style={{ fontSize: "10px", fontWeight: "700", color, textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.3 }}>{label}</span>
          </div>
          <p style={{ fontSize: "26px", fontWeight: "800", color: "#0A1628", margin: 0, lineHeight: 1 }}>
            {(classified[key] || []).length}
          </p>
        </div>
      ))}
    </div>
  );
}