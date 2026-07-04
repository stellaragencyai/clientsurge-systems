import { ShieldAlert } from "lucide-react";

/**
 * Admin-only reminder: setup ≠ verified readiness.
 * A completed checkbox or configuration flag is not the same as
 * proven, evidence-backed readiness.
 */
export default function SetupNotReadinessReminder() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(217,119,6,0.06), rgba(217,119,6,0.02))",
        border: "1px solid rgba(217,119,6,0.2)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.25)" }}
      >
        <ShieldAlert className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-700 mb-0.5">
          Setup is not the same as verified readiness
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          A configured integration, checked box, or passing smoke test does not mean a capability is
          production-trusted. <span className="font-semibold text-gray-700">Complete status requires real app evidence</span> —
          proof records, delivery logs, and outcome data — not just setup. Do not close build items until evidence supports it.
        </p>
      </div>
    </div>
  );
}