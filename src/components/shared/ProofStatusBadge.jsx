import {
  getClientSurgeProofStatusDescription,
  getClientSurgeProofStatusLabel,
  normalizeClientSurgeProofStatus,
} from "@/lib/clientSurgeProofStatus";
import { clientSurgeStatusColors } from "@/lib/clientSurgeDesignTokens";

const STATUS_BG = {
  trusted: "rgba(22, 163, 74, 0.10)",
  warning: "rgba(217, 119, 6, 0.10)",
  blocked: "rgba(220, 38, 38, 0.10)",
  unknown: "rgba(107, 114, 128, 0.10)",
  stale: "rgba(245, 158, 11, 0.12)",
  pending: "rgba(37, 99, 235, 0.10)",
};

export default function ProofStatusBadge({ status = "unknown", label, checkedAt, source, className = "" }) {
  const normalized = normalizeClientSurgeProofStatus(status);
  const text = label || getClientSurgeProofStatusLabel(normalized);
  const titleParts = [getClientSurgeProofStatusDescription(normalized)];
  if (source) titleParts.push(`Source: ${source}`);
  if (checkedAt) titleParts.push(`Checked: ${checkedAt}`);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${className}`}
      style={{
        color: clientSurgeStatusColors[normalized],
        borderColor: clientSurgeStatusColors[normalized],
        background: STATUS_BG[normalized],
      }}
      title={titleParts.join(" · ")}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: clientSurgeStatusColors[normalized] }}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}
