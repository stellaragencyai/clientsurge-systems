import { CheckCircle2, Clock, AlertTriangle, Zap } from "lucide-react";
import { computeReadiness } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const STATUS_STYLES = {
  Live: { color: "#22c55e", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.2)", icon: CheckCircle2 },
  Testing: { color: "#0088CC", bg: "rgba(0,136,204,0.07)", border: "rgba(0,136,204,0.18)", icon: Clock },
  "Setup In Progress": { color: "#8b5cf6", bg: "rgba(139,92,246,0.07)", border: "rgba(139,92,246,0.18)", icon: Zap },
  "Needs Attention": { color: "#ef4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", icon: AlertTriangle },
};

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

export default function LaunchReadinessPanel({ order, project, events = [], portalState, isAdmin = false }) {
  const readiness = computeReadiness(order, project, events);
  const cardState = getCardState(portalState, "system_readiness");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;
  const canShowLive = readiness.canGoLive && isProofLive;
  const isVerifying = readiness.canGoLive && !isProofLive;
  const effectiveStatus = canShowLive ? "Live" : isVerifying ? "Testing" : readiness.status;
  const style = STATUS_STYLES[effectiveStatus] || STATUS_STYLES["Setup In Progress"];
  const Icon = style.icon;
  const percent = canShowLive ? 100 : isVerifying ? Math.min(95, clampPercent(readiness.percent || 90)) : clampPercent(readiness.percent);

  if (canShowLive) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}18`, border: `1px solid ${style.color}30` }}>
            <Icon className="w-4 h-4" style={{ color: style.color }} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: style.color }}>Launch Readiness</p>
            <p className="text-[15px] font-bold text-foreground">Your System is Live & Verified</p>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground pl-12">Verified launch checks passed. Ongoing monitoring is active.</p>
        <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
      </div>
    );
  }

  const needsAttention = readiness.status === "Needs Attention";

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}18`, border: `1px solid ${style.color}30` }}>
            <Icon className="w-4 h-4" style={{ color: style.color }} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: style.color }}>Launch Readiness</p>
            <p className="text-[15px] font-bold text-foreground">
              {isVerifying ? "Verifying Your System" : readiness.label}
            </p>
          </div>
        </div>
        <span className="text-[13px] font-extrabold" style={{ color: style.color }}>{percent}%</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-white/50 border border-border mb-3 overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: style.color, boxShadow: `0 0 8px ${style.color}44` }}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2 md:pl-12">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Next Milestone</p>
          <p className="text-[12px] font-semibold text-foreground">
            {isVerifying ? "Proof verification" : readiness.nextMilestone || "Setup review"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Action Required</p>
          <p className="text-[12px] font-semibold text-foreground">
            {isVerifying ? "Awaiting verification" : readiness.actionRequired || "No action needed yet"}
          </p>
        </div>
      </div>

      {isVerifying && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-blue-700 font-medium">
          {cardState.display_text || "We are verifying proof before marking your system live."}
        </div>
      )}

      {needsAttention && (
        <a
          href="mailto:support@clientsurgesystems.com?subject=ClientSurge%20Launch%20Readiness%20Help"
          className="mt-3 inline-flex rounded-lg px-3 py-2 text-xs font-bold no-underline"
          style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.18)" }}
        >
          Contact support for help
        </a>
      )}

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}
