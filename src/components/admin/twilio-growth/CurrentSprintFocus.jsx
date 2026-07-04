import { Target } from "lucide-react";

const SPRINT_ITEMS = [
  { label: "Confirm evidence logging visibility", detail: "AutomationProofLog records surface in Proof Center" },
  { label: "Confirm internal record exclusion visibility", detail: "Test/smoke/internal records quarantined from production metrics" },
  { label: "Confirm speed-to-lead readiness status", detail: "Instant lead response capability is green with delivery proof" },
  { label: "Confirm recovery flow readiness status", detail: "Missed-call text-back webhook route clean and recovery evidence exists" },
  { label: "Keep later-scope features blocked until core launch items are ready", detail: "Voice, nurture, review, and reactivation remain blocked" },
];

export default function CurrentSprintFocus() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900">Current Sprint Focus</h3>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Admin Only</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        The current sprint is focused on confirming core launch readiness — not building new features.
      </p>
      <ol className="space-y-2">
        {SPRINT_ITEMS.map((item, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-600">
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-900">{item.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}