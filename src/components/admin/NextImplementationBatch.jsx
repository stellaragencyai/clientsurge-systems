import { ListChecks, AlertCircle, ArrowRight } from "lucide-react";

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
    <div className="space-y-4">
      <div
        className="bg-white rounded-xl border border-gray-200 p-5"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">
            Next Implementation Batch — Admin Only
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Ordered batches for the next sprint. Batch 2 starts only after Batch 1
          items are verified against real app evidence.
        </p>

        {/* Batch 1 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <p className="text-sm font-bold text-gray-900">
              Batch 1 — Verify Dashboard Sections
            </p>
          </div>
          <ul className="space-y-1.5 ml-8">
            {BATCH_1.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-xs text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Batch 2 */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <p className="text-sm font-bold text-gray-900">
              Batch 2 — Close Gaps &amp; Collect Evidence
            </p>
          </div>
          <ul className="space-y-1.5 ml-8">
            {BATCH_2.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                <span className="text-xs text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-3 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            Rule: Asana is updated only after evidence exists. No item may be
            closed without proof.
          </p>
        </div>
      </div>
    </div>
  );
}