import { EVIDENCE_QUALITY } from "./evidenceQuality";

export default function EvidenceQualityBadge({ quality, showDescription = false }) {
  const config = EVIDENCE_QUALITY[quality] || EVIDENCE_QUALITY.none;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ color: config.color, background: `${config.color}11`, border: `1px solid ${config.color}30` }}
      title={config.description}
    >
      {config.label}
    </span>
  );
}