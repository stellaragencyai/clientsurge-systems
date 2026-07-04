import { Info, ShieldAlert } from "lucide-react";

/**
 * Admin-only reminder: setup/configuration is not the same as verified readiness.
 * Shown near the top of the panel.
 */
export default function SetupVsVerifiedReminder() {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(0,174,239,0.05), rgba(0,174,239,0.01))",
        border: "1px solid rgba(0,174,239,0.2)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,174,239,0.1)", border: "1px solid rgba(0,174,239,0.25)" }}
      >
        <Info className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 mb-0.5">Setup ≠ Verified Readiness</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Configuration, credentials, and checklist toggles mean an item is <strong>set up</strong> — not that it is
          <strong> verified ready</strong>. A capability can only be marked <strong>complete</strong> when real app
          evidence (proof logs, delivery records, communication events) supports it. Admin only — this reminder does not
          appear on any public-facing surface.
        </p>
      </div>
    </div>
  );
}