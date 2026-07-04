import { Target, CheckCircle2, Circle, AlertCircle } from "lucide-react";

const SPRINT_FOCUS_ITEMS = [
  {
    id: "evidence_logging",
    label: "Confirm evidence logging visibility",
    check: (data) => !data?.proof_logs_empty,
    detail: "AutomationProofLog records exist and are visible in the Proof Center.",
  },
  {
    id: "internal_exclusion",
    label: "Confirm internal record exclusion visibility",
    check: (data) => {
      const q = data?.quarantine;
      return !!q && q.excluded_leads_count >= 0;
    },
    detail: "Test/smoke/internal records are quarantined and excluded from production metrics.",
  },
  {
    id: "speed_to_lead",
    label: "Confirm speed-to-lead readiness status",
    check: (data) => {
      const cap = (data?.capabilities || []).find((c) => c.key === "instant_lead_response");
      return cap?.status === "green";
    },
    detail: "Instant Lead Response capability is proven with delivered SMS evidence.",
  },
  {
    id: "recovery_flow",
    label: "Confirm recovery flow readiness status",
    check: (data) => {
      const cap = (data?.capabilities || []).find((c) => c.key === "missed_call_text_back");
      return cap?.status === "green";
    },
    detail: "Missed Call Text-Back route is clean with recovery evidence records.",
  },
  {
    id: "block_later_scope",
    label: "Keep later-scope features blocked until core launch items are ready",
    check: (data) => {
      const coreReady =
        !data?.proof_logs_empty &&
        (data?.capabilities || []).filter((c) =>
          ["instant_lead_response", "missed_call_text_back"].includes(c.key)
        ).every((c) => c.status === "green");
      return !coreReady; // still blocked = correct behavior
    },
    detail: "Voice, review, and referral capabilities remain blocked while core items are unproven.",
  },
];

export default function CurrentSprintFocusCard({ data }) {
  const items = SPRINT_FOCUS_ITEMS.map((item) => ({
    ...item,
    done: item.check(data),
  }));
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900">Current Sprint Focus — Admin Only</h3>
        </div>
        <span className="text-xs font-semibold text-gray-400">{doneCount}/{items.length} confirmed</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Default sprint focus. Each item must be confirmed by real app evidence before advancing to later-scope work.
      </p>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex-shrink-0 mt-0.5">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
            </div>
            {item.id === "block_later_scope" && !item.done && (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}