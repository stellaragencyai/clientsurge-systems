import { Target, Lock } from "lucide-react";

/**
 * Admin-only "Current Sprint Focus" card.
 * Defaults to the five core sprint focus items. Admin-only — no public claims.
 */
const SPRINT_FOCUS = [
  { id: 1, title: "Confirm evidence logging visibility", detail: "Capability rows must show evidence sources from CommunicationLog / CommunicationEvent." },
  { id: 2, title: "Confirm internal record exclusion visibility", detail: "Test/smoke/internal records must be quarantined out of production metrics." },
  { id: 3, title: "Confirm speed-to-lead readiness status", detail: "Instant lead response must be backed by a real delivered SMS with provider message ID." },
  { id: 4, title: "Confirm recovery flow readiness status", detail: "Missed-call text-back webhook must be clean (no 404/405) and have a successful send." },
  { id: 5, title: "Keep later-scope features blocked until core launch items are ready", detail: "Referral engine, voice broadcasts, and public claims stay gated behind proof." },
];

export default function CurrentSprintFocus() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900">Current Sprint Focus — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Default sprint focus. Do not deviate from this order until each item is confirmed by evidence.</p>
      <div className="space-y-2">
        {SPRINT_FOCUS.map((f) => (
          <div key={f.id} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{f.id}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.detail}</p>
            </div>
            {f.id === 5 && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}