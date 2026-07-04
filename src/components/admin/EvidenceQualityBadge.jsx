export const EVIDENCE_QUALITY = {
  strong: { color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)", label: "Strong Evidence", desc: "Final outcome confirmed by provider/status/proof record" },
  medium: { color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)", label: "Medium Evidence", desc: "Valid attempt or configuration exists, but final outcome is not confirmed" },
  weak: { color: "#92400E", bg: "rgba(146,64,14,0.06)", border: "rgba(146,64,14,0.18)", label: "Weak Evidence", desc: "Incomplete, internal-only, missing fields, or not tied to a real lead/client" },
  none: { color: "#6B7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.18)", label: "No Evidence", desc: "Nothing usable found" },
};

export function classifyCapabilityEvidence(cap) {
  if (cap?.proof?.passed > 0) return 'strong';
  if (cap?.proof?.total > 0) return 'medium';
  if (cap?.status === 'yellow') return 'weak';
  return 'none';
}

export default function EvidenceQualityBadge({ quality }) {
  const style = EVIDENCE_QUALITY[quality] || EVIDENCE_QUALITY.none;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
    >
      {style.label}
    </span>
  );
}