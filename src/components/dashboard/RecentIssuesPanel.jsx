import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { groupFailedEventsByCategory, getFriendlyEventLabel } from "@/lib/dashboardHelpers";
import { useState } from "react";

export default function RecentIssuesPanel({ events = [], isAdmin = false }) {
  const [expanded, setExpanded] = useState({});
  const groups = groupFailedEventsByCategory(events);

  if (groups.length === 0) {
    return null; // Nothing to show — clean
  }

  const toggleGroup = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
        <p className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#ef4444" }}>Recent Issues</p>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {groups.reduce((sum, g) => sum + g.count, 0)} issue{groups.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const isExpanded = expanded[group.category] === true;

          return (
            <div key={group.category}>
              <button
                onClick={() => toggleGroup(group.category)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] font-semibold transition-colors"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)", color: "#dc2626" }}
              >
                <span>{group.category} ({group.count})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="mt-1.5 ml-3 space-y-1">
                  {group.events.slice(0, isAdmin ? 10 : 3).map((event, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px] text-muted-foreground">
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
          <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">support@clientsurgesystems.com</a>.
        </p>
      )}
    </div>
  );
}