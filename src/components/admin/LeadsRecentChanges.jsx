import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

export default function LeadsRecentChanges() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChanges = async () => {
      try {
        const events = await base44.admin.entities.CommunicationEvent.filter(
          { lead_id: { $exists: true } },
          "-created_date",
          15
        );
        
        if (events && events.length > 0) {
          const parsed = events.map((evt) => ({
            id: evt.id,
            lead_id: evt.lead_id,
            type: evt.event_type || "update",
            timestamp: evt.created_date,
            description: describeEvent(evt),
          }));
          setChanges(parsed);
        }
      } catch {
        setChanges([]);
      } finally {
        setLoading(false);
      }
    };

    loadChanges();
    const interval = setInterval(loadChanges, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const describeEvent = (evt) => {
    const typeMap = {
      lead_created: "Lead created",
      sms_sent: "SMS sent",
      email_sent: "Email sent",
      status_update: "Status updated",
      booking_created: "Booking created",
      default: "Lead updated",
    };
    return typeMap[evt.event_type] || typeMap.default;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);

    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg border border-border/40 bg-background/20 p-3">
      <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Recent Changes</h3>
      
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-[11px]">Loading...</span>
        </div>
      ) : changes.length === 0 ? (
        <p className="text-[11px] text-muted-foreground py-4">No recent changes</p>
      ) : (
        <div className="space-y-2">
          {changes.map((change) => (
            <div key={change.id} className="flex items-start justify-between py-1.5 px-2 rounded bg-background/30 border border-border/20">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">
                  {change.description}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTime(change.timestamp)}
                </p>
              </div>
              <span className="text-[9px] text-muted-foreground ml-2 flex-shrink-0">
                {change.type.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}