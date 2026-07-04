import { Layers, CheckSquare, Square, ArrowRight } from "lucide-react";

const BATCH_1 = [
  "Verify the new admin dashboard sections rendered correctly",
  "Confirm capability matrix computes from data",
  "Confirm repair queue displays gaps",
  "Confirm readiness summary does not mark unproven work complete",
  "Confirm first launch scope checklist appears",
];

const BATCH_2 = [
  "Address highest-priority gaps found in Batch 1",
  "Collect required proof artifacts",
  "Update Asana only after evidence exists",
];

export default function NextImplementationBatch() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900">Next Implementation Batch — Admin Only</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Ordered implementation batches. Batch 2 does not start until Batch 1 is verified.</p>

      <div className="space-y-5">
        {/* Batch 1 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200">Batch 1</span>
            <p className="text-sm font-semibold text-gray-900">Verification & Visibility</p>
          </div>
          <ul className="space-y-1.5">
            {BATCH_1.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Square className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 text-gray-400">
          <ArrowRight className="w-4 h-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wide">Batch 1 must be verified before Batch 2 begins</span>
        </div>

        {/* Batch 2 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200">Batch 2</span>
            <p className="text-sm font-semibold text-gray-900">Gap Remediation & Evidence</p>
          </div>
          <ul className="space-y-1.5">
            {BATCH_2.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/40 p-2.5">
            <p className="text-[11px] text-amber-700 font-semibold">Rule: Asana tasks are updated only after real app evidence exists — never on setup alone.</p>
          </div>
        </div>
      </div>
    </div>
  );
}