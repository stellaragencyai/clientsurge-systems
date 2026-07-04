import { AlertTriangle } from "lucide-react";

/**
 * Admin-only reminder: setup is not the same as verified readiness.
 * Complete status requires evidence. Placed near the top of the panel.
 */
export default function SetupVsReadinessReminder() {
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
        <AlertTriangle className="w-4 h-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-700 mb-0.5">Setup ≠ Verified Readiness</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Configuration and checklists are not proof. A capability is only "complete" when real app evidence
          (delivered messages, provider IDs, transcripts, passed proof logs) supports it. Do not mark anything
          complete based on setup alone — admin only.
        </p>
      </div>
    </div>
  );
}