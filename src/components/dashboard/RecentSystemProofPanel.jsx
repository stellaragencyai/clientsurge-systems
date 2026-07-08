import { CheckCircle2 } from "lucide-react";
import { getFriendlyEventLabel } from "@/lib/dashboardHelpers";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

function eventTime(event) {
  return new Date(event?.created_date || event?.created_at || event?.timestamp || 0).getTime() || 0;
}

function eventKey(event, index) {
  return event?.id || event?.event_id || `${event?.event_type || "event"}-${eventTime(event)}-${index}`;
}

export default function RecentSystemProofPanel({ events = [], isAdmin = false, portalState }) {
  const cardState = getCardState(portalState, "automation_health");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;

  const proofEvents = (events || [])
    .filter(
      (event) =>
        event.status !== "failed" &&
        event.direction !== "inbound" &&
        event.event_type &&
        !event.event_type.includes("portal_login") &&
        !event.event_type.includes("simulation") &&
        !event.event_type.includes("test")
    )
    .sort((a, b) => eventTime(b) - eventTime(a));

  const seen = new Set();
  const unique = [];
  for (const event of proofEvents) {
    const label = getFriendlyEventLabel(event);
    if (!seen.has(label)) {
      seen.add(label);
      unique.push({ ...event, friendlyLabel: label });
    }
  }

  const display = unique.slice(0, 8);

  if (!isProofLive) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: "#0088CC" }} aria-hidden="true" />
          <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#0088CC" }}>Recent System Activity</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">
          {cardState.display_text || "System activity will appear here after verification starts."}
        </p>
        <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
      </div>
    );
  }

  if (display.length === 0) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} aria-hidden="true" />
          <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#22c55e" }}>Recent System Activity</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">No verified system activity has been logged yet.</p>
        <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} aria-hidden="true" />
        <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#22c55e" }}>Recent System Activity</p>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">{display.length} verified type{display.length === 1 ? "" : "s"}</span>
      </div>

      <div className="space-y-1.5">
        {display.map((item, index) => (
          <div key={eventKey(item, index)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px]" style={{ background: "rgba(34,197,94,0.04)" }}>
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
