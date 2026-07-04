import { Database, EyeOff } from "lucide-react";

/**
 * Admin-only panel explaining that internal, smoke, and test records
 * are excluded from production metrics but preserved (never deleted).
 * Not shown publicly — only renders inside the admin dashboard.
 */
export default function TestDataExclusionPanel({ excludedCount = null }) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(0,174,239,0.04), rgba(0,174,239,0.01))",
        border: "1px solid rgba(0,174,239,0.15)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.18)" }}
      >
        <EyeOff className="w-5 h-5" style={{ color: "#00AEEF" }} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900 mb-1">
          Test / Internal / Smoke Data Exclusion
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Records matching the patterns below are excluded from production-facing metrics on this
          dashboard. They are <span className="font-semibold text-gray-700">preserved</span> in the
          database — never deleted — so audit trails remain intact.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email patterns</p>
            <p className="text-[11px] text-gray-600 font-mono">
              clientsurge-install.internal · clientsurge.test · test+ · smoke · @example.com
            </p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Source patterns</p>
            <p className="text-[11px] text-gray-600 font-mono">
              smoke · test · internal
            </p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Quality reason codes</p>
            <p className="text-[11px] text-gray-600 font-mono">
              internal_test · smoke_test · example_email
            </p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Action</p>
            <p className="text-[11px] text-gray-600">
              Quarantined / excluded — not deleted
            </p>
          </div>
        </div>
        {excludedCount !== null && (
          <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)" }}
          >
            <Database className="w-3.5 h-3.5" style={{ color: "#00AEEF" }} />
            <span className="text-xs font-semibold text-gray-700">
              {excludedCount} record{excludedCount === 1 ? "" : "s"} excluded from production metrics
            </span>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-2">
          This panel is admin-only. Do not display exclusion counts or rules on public pages.
        </p>
      </div>
    </div>
  );
}