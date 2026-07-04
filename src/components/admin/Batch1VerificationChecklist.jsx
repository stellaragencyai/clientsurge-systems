import { useState } from "react";
import { CheckSquare, Square, ShieldCheck } from "lucide-react";

const CHECKLIST_ITEMS = [
  "Status rollup visible",
  "Capability matrix visible",
  "Readiness scorecard visible",
  "Repair queue visible",
  "Proof Center visible",
  "First launch checklist visible",
  "Evidence source map visible",
  "Public claim safety check visible",
  "Asana completion guidance visible",
  "No unproven capability marked complete",
];

export default function Batch1VerificationChecklist() {
  const [checked, setChecked] = useState(
    () => Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, false]))
  );

  const toggle = (item) => {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = checkedCount === CHECKLIST_ITEMS.length;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900">
            Batch 1 Verification Checklist — Admin Only
          </h3>
        </div>
        <span className="text-xs font-semibold text-gray-400">
          {checkedCount}/{CHECKLIST_ITEMS.length} verified
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Confirm each dashboard section is visible and functioning before moving
        to Batch 2. No item may be checked without visual confirmation.
      </p>
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left"
          >
            {checked[item] ? (
              <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}
            <span
              className={`text-xs ${
                checked[item]
                  ? "text-gray-900 font-medium"
                  : "text-gray-500"
              }`}
            >
              {item}
            </span>
          </button>
        ))}
      </div>
      {allChecked ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-700">
            ✓ All Batch 1 items verified. Batch 2 may begin.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">
            {CHECKLIST_ITEMS.length - checkedCount} item(s) still need
            verification before Batch 2.
          </p>
        </div>
      )}
    </div>
  );
}