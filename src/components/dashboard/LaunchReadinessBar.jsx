import { computeReadiness } from "@/lib/dashboardHelpers";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";

export default function LaunchReadinessBar({ order, project, events = [] }) {
  const readiness = computeReadiness(order, project, events);
  const { status, percent, nextMilestone, actionRequired, canGoLive } = readiness;

  const statusColors = {
    "Live": { bg: "#22c55e", glow: "rgba(34,197,94,0.4)" },
    "Needs Attention": { bg: "#ef4444", glow: "rgba(239,68,68,0.4)" },
    "Testing": { bg: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
    "Setup In Progress": { bg: "#00AEEF", glow: "rgba(0,174,239,0.4)" },
  };

  const currentColor = statusColors[status] || statusColors["Setup In Progress"];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(240,248,255,0.85) 100%)",
        border: "1px solid rgba(0,174,239,0.12)",
        boxShadow: "0 2px 16px rgba(0,59,143,0.06)",
      }}
    >
      {/* Top accent strip */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${currentColor.bg}, ${currentColor.bg}88, transparent)` }} />

      <div className="px-5 py-4 md:px-6 md:py-5">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {canGoLive ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.5))" }} />
            ) : status === "Needs Attention" ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-primary" style={{ filter: "drop-shadow(0 0 6px rgba(0,174,239,0.5))" }} />
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-foreground/80">
              System Readiness
            </span>
          </div>
          <span
            className="text-[12px] font-bold px-3 py-1 rounded-full"
            style={{
              color: currentColor.bg,
              background: `${currentColor.bg}12`,
              border: `1px solid ${currentColor.bg}30`,
            }}
          >
            {status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative mb-3">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: "10px", background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.12)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${percent}%`,
                background: `linear-gradient(90deg, #00AEEF, ${percent >= 100 ? "#22c55e" : "#009FD4"})`,
                boxShadow: `0 0 12px ${currentColor.glow}`,
              }}
            />
          </div>
        </div>

        {/* Bottom row: milestone + action */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Next:</span>
            <span className="text-[11px] font-bold text-foreground">{nextMilestone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/70">Action:</span>
            <span className="text-[11px] font-bold" style={{ color: currentColor.bg }}>
              {actionRequired}
            </span>
            {!canGoLive && status !== "Needs Attention" && (
              <ArrowRight className="w-3 h-3" style={{ color: currentColor.bg }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}