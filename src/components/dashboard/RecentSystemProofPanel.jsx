import { CheckCircle2, Zap } from "lucide-react";
import { getFriendlyEventLabel } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

export default function RecentSystemProofPanel({ events = [], isAdmin = false, portalState }) {
  // Phase A.4: Gate success-claim activity list behind proof-validated state
  const cardState = getCardState(portalState, "automation_health");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;

  const proofEvents = (events || []).filter(
    (e) =>
      e.status !== "failed" &&
      e.direction !== "inbound" &&
      e.event_type &&
      !e.event_type.includes("portal_login") &&
      !e.event_type.includes("simulation") &&
      !e.event_type.includes("test")
  );

  // Deduplicate by friendly label, take most recent of each type
  const seen = new Set();
  const unique = [];
  for (const e of proofEvents) {
    const label = getFriendlyEventLabel(e);
    if (!seen.has(label)) {
      seen.add(label);
      unique.push({ ...e, friendlyLabel: label });
    }
  }

  const display = unique.slice(0, 8);

  // Phase A.4: When proof not Live, suppress the green success activity list
  if (!isProofLive) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: "#0088CC" }} />
          <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#0088CC" }}>Recent System Activity</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">
          {cardState.display_text}
        </p>
        <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
      </div>
    );
  }

  if (display.length === 0) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
          <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#22c55e" }}>Recent System Activity</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">No recent activity logged yet.</p>
        <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
        <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#22c55e" }}>Recent System Activity</p>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">{display.length} event types</span>
      </div>

      <div className="space-y-1.5">
        {display.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px]" style={{ background: "rgba(34,197,94,0.04)" }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span className="font-medium text-foreground">{item.friendlyLabel}</span>
            {isAdmin && item.event_type && (
              <span className="text-[10px] text-muted-foreground/50 ml-auto hidden sm:inline">{item.event_type.replace(/_/g, " ")}</span>
            )}
          </div>
        ))}
      </div>

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}