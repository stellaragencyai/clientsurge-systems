/**
 * AdminPreviewBanner — visually quarantined from real client view.
 * Amber/internal-only styling, "Not a live client view" badge, explicit warning.
 * Impossible to confuse with a real client dashboard.
 */
import { Eye, AlertTriangle } from "lucide-react";

export default function AdminPreviewBanner({ userEmail, linkStatus }) {
  return (
    <div
      className="rounded-2xl p-5 mb-5"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))",
        border: "2px solid rgba(212,175,55,0.35)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)" }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: "#B8941F" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: "#B8941F" }}
            >
              <Eye className="w-3 h-3" />
              Not a live client view
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700/80">
              Internal admin only
            </span>
          </div>
          <p className="text-[13px] font-bold text-amber-800 mb-1">
            Admin Preview Mode — no client selected
          </p>
          <p className="text-[12px] text-amber-700/80 leading-relaxed">
            You're logged in as an admin ({userEmail || "unknown"}). No paid client order resolved for
            this account. What you see below is a preview — not a live client dashboard. Do not share
            this view with clients.
          </p>
          {linkStatus && (
            <p className="text-[11px] text-amber-600/60 mt-1.5">
              Link status: {linkStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}