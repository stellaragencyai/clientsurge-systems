import { CheckCircle2, Clock, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { computeReadiness } from "@/lib/dashboardHelpers";

const STATUS_STYLES = {
  Live: { color: "#22c55e", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.2)", icon: CheckCircle2 },
  Testing: { color: "#0088CC", bg: "rgba(0,136,204,0.07)", border: "rgba(0,136,204,0.18)", icon: Clock },
  "Setup In Progress": { color: "#8b5cf6", bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.18)", icon: Zap },
  "Needs Attention": { color: "#ef4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", icon: AlertTriangle },
};

export default function LaunchReadinessPanel({ order, project, events = [] }) {
  const readiness = computeReadiness(order, project, events);
  const style = STATUS_STYLES[readiness.status] || STATUS_STYLES["Setup In Progress"];
  const Icon = style.icon;
  const isLive = readiness.canGoLive;

  if (isLive) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}18`, border: `1px solid ${style.color}30` }}>
            <Icon className="w-4 h-4" style={{ color: style.color }} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: style.color }}>Launch Readiness</p>
            <p className="text-[15px] font-bold text-foreground">Your System is Live</p>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground pl-12">All checks passed. Ongoing monitoring is active.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}18`, border: `1px solid ${style.color}30` }}>
            <Icon className="w-4 h-4" style={{ color: style.color }} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: style.color }}>Launch Readiness</p>
            <p className="text-[15px] font-bold text-foreground">{readiness.label}</p>
          </div>
        </div>
        <span className="text-[13px] font-extrabold" style={{ color: style.color }}>{readiness.percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-white/50 border border-border mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${readiness.percent}%`, backgroundColor: style.color, boxShadow: `0 0 8px ${style.color}44` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pl-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Next Milestone</p>
          <p className="text-[12px] font-semibold text-foreground">{readiness.nextMilestone}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Action Required</p>
          <p className="text-[12px] font-semibold text-foreground">{readiness.actionRequired}</p>
        </div>
      </div>
    </div>
  );
}