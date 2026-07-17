import { Loader2, RefreshCw } from "lucide-react";

const STATE_STYLES = {
  connected: "border-emerald-200 bg-emerald-50/70",
  testing: "border-sky-200 bg-sky-50/70",
  optional: "border-slate-200 bg-slate-50/80",
  error: "border-red-200 bg-red-50/70",
  pending: "border-slate-200 bg-white",
};

const BADGE_STYLES = {
  connected: "border-emerald-200 bg-emerald-100 text-emerald-800",
  testing: "border-sky-200 bg-sky-100 text-sky-800",
  optional: "border-slate-200 bg-white text-slate-600",
  error: "border-red-200 bg-red-100 text-red-700",
  pending: "border-slate-200 bg-slate-100 text-slate-600",
};

const LABELS = {
  connected: "Verified",
  testing: "Testing",
  optional: "Optional",
  error: "Needs review",
  pending: "Not tested",
};

export default function CSConnectionCard({
  icon: Icon,
  name,
  description,
  status = "pending",
  message,
  onAction,
  actionLabel,
  disabled = false,
}) {
  const normalizedStatus = STATE_STYLES[status] ? status : "pending";

  return (
    <section className={`rounded-2xl border p-5 shadow-sm transition-all ${STATE_STYLES[normalizedStatus]}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white shadow-sm">
              <Icon className="h-5 w-5 text-[#00AEEF]" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-950">{name}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
            {message && (
              <p className={`mt-2 text-xs font-semibold leading-5 ${normalizedStatus === "error" ? "text-red-700" : normalizedStatus === "connected" ? "text-emerald-700" : "text-slate-600"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${BADGE_STYLES[normalizedStatus]}`}>
            {normalizedStatus === "testing" && <Loader2 className="h-3 w-3 animate-spin" />}
            {LABELS[normalizedStatus]}
          </span>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              disabled={disabled || normalizedStatus === "testing"}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-[#006BB0] transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {actionLabel || (normalizedStatus === "pending" ? "Test" : "Retest")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
