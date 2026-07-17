import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { groupFailedEventsByCategory, getFriendlyEventLabel } from "@/lib/dashboardHelpers";
import { useMemo, useState } from "react";
import { getCardState } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

function eventKey(event, index) {
  return event?.id || event?.event_id || `${event?.event_type || "issue"}-${event?.created_date || event?.timestamp || index}`;
}

export default function RecentIssuesPanel({ events = [], isAdmin = false, portalState }) {
  const [expanded, setExpanded] = useState({});
  const groups = useMemo(() => groupFailedEventsByCategory(events), [events]);
  const cardState = getCardState(portalState, "automation_health");
  const totalIssues = useMemo(
    () => groups.reduce((sum, group) => sum + group.count, 0),
    [groups]
  );

  if (groups.length === 0) {
    return null;
  }

  const toggleGroup = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} aria-hidden="true" />
        <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#ef4444" }}>Recent Issues</p>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {totalIssues} issue{totalIssues === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const isExpanded = expanded[group.category] === true;
          const panelId = `issue-group-${String(group.category).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

          return (
            <div key={group.category}>
              <button
                type="button"
                onClick={() => toggleGroup(group.category)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] font-semibold transition-colors"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)", color: "#dc2626" }}
              >
                <span>{group.category} ({group.count})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
              </button>

              {isExpanded && (
                <div id={panelId} className="mt-1.5 ml-3 space-y-1">
                  {group.events.slice(0, isAdmin ? 10 : 3).map((event, index) => (
                    <div key={eventKey(event, index)} className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px] text-muted-foreground">
                      <span>{getFriendlyEventLabel(event)}</span>
                      {isAdmin && (
                        <span className="text-[10px] text-muted-foreground/50 ml-auto hidden sm:inline">
                          {event.event_type?.replace(/_/g, " ") || "unknown"}
                        </span>
                      )}
                    </div>
                  ))}
                  {!isAdmin && group.events.length > 3 && (
                    <p className="text-[10px] text-muted-foreground/60 px-3">
                      +{group.events.length - 3} more — contact support for details
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isAdmin && (
        <p className="text-[10px] text-muted-foreground/60 mt-3">
          These issues are being addressed by our team. If you need more detail, contact{" "}
          <a href="mailto:support@clientsurgesystems.com?subject=ClientSurge%20Dashboard%20Issue" className="text-primary underline">support@clientsurgesystems.com</a>.
        </p>
      )}

      <PortalAdminDiagnostics card={cardState} isAdmin={isAdmin} />
    </div>
  );
}
