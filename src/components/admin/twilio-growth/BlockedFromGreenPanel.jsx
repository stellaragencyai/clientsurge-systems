import { XCircle, Ban } from "lucide-react";
import EvidenceQualityBadge from "./EvidenceQualityBadge";
import { overallEvidenceQuality } from "./evidenceQuality";

const STATUS_STYLES = {
  yellow: { color: "#D97706", label: "Partial" },
  red: { color: "#DC2626", label: "Missing" },
};

export default function BlockedFromGreenPanel({ capabilities }) {
  const blocked = (capabilities || []).filter((c) => c.status !== "green");

  if (blocked.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl border border-green-200 p-5 flex items-center gap-2">
        <Ban className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 font-semibold">All capabilities are proven — no blockers remain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Ban className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-gray-900">Blocked From Green</h3>
        </div>
        <p className="text-xs text-gray-400">
          {blocked.length} {blocked.length === 1 ? "capability" : "capabilities"} cannot be marked complete. Each reason is derived from real app data — no status is inferred without evidence.
        </p>
      </div>

      {blocked.map((cap) => {
        const style = STATUS_STYLES[cap.status] || STATUS_STYLES.red;
        const quality = overallEvidenceQuality(cap);
        const reasons = buildBlockedReasons(cap, quality);
        return (
          <div key={cap.key} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{cap.label}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cap.key}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <EvidenceQualityBadge quality={quality} />
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: style.color, background: `${style.color}11`, border: `1px solid ${style.color}30` }}>
                  {style.label}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-2">Exact Reason It Cannot Be Marked Complete</p>
              <ul className="space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {cap.next_action && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Required to Unblock</p>
                <p className="text-xs text-gray-600">{cap.next_action}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function buildBlockedReasons(cap, quality) {
  const reasons = [...(cap.blockers || [])];

  // Deduplicate and add specific blocked-from-complete reasons
  if (cap.proof?.passed === 0 && !reasons.some((r) => r.toLowerCase().includes("no automationprooflog pass"))) {
    if (cap.proof?.total === 0) {
      reasons.push("No proof record exists");
    } else {
      reasons.push("Latest record is only an attempt, not final outcome proof");
    }
  }

  if (quality === "weak" && !reasons.some((r) => r.toLowerCase().includes("incomplete") || r.toLowerCase().includes("internal"))) {
    reasons.push("Latest evidence is incomplete, internal-only, or missing important fields");
  }

  if (quality === "none" && !reasons.some((r) => r.toLowerCase().includes("no ") && r.toLowerCase().includes("evidence"))) {
    reasons.push("No evidence found — nothing usable to confirm completion");
  }

  // Voice-specific
  if (cap.key === "ai_voice_receptionist" && !reasons.some((r) => r.toLowerCase().includes("transcript"))) {
    reasons.push("Voice assistant lacks transcript or meaningful summary evidence");
  }

  // Review/referral-specific
  if ((cap.key === "review_request" || cap.key === "lead_reactivation") && !reasons.some((r) => r.toLowerCase().includes("evidence record"))) {
    if (cap.proof?.total === 0) {
      reasons.push("Review/referral workflow has no evidence record");
    }
  }

  return reasons.length > 0 ? reasons : ["Required configuration or proof is missing"];
}