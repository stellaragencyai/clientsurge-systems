import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts";

const ALERT_TYPE_COLORS = {
  lead: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500" },
  booking: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-500" },
  support: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
  system: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
};

const PRIORITY_BADGE = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
};

export default function AlertsPanel() {
  const { alerts, status, markAsRead, dismissAlert } = useRealtimeAlerts({
    pollInterval: 3000,
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(alerts.filter((a) => !a.read_status).length);
  }, [alerts]);

  const filteredAlerts =
    typeFilter === "all" ? alerts : alerts.filter((a) => a.type === typeFilter);

  const formatTime = (timestamp) => {
    if (!timestamp) return "now";
    const now = new Date();
    const created = new Date(timestamp);
    const seconds = Math.floor((now - created) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Alerts</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                status === "live"
                  ? "bg-green-100 text-green-700"
                  : status === "connecting"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "live"
                    ? "bg-green-500"
                    : status === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              {status === "live" ? "LIVE" : status === "connecting" ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {["all", "lead", "booking", "support"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredAlerts.map((alert) => {
              const colors = ALERT_TYPE_COLORS[alert.type] || ALERT_TYPE_COLORS.lead;
              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border-l-4 p-3 transition-all ${colors.bg} ${colors.border} border`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              PRIORITY_BADGE[alert.priority]
                            }`}
                          >
                            {alert.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {alert.phone_number && <span>{alert.phone_number}</span>}
                          {alert.intent && <span>Intent: {alert.intent}</span>}
                          <div className="flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3" />
                            {formatTime(alert.created_date)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      {!alert.read_status && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="p-1.5 rounded hover:bg-black/10 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1.5 rounded hover:bg-black/10 transition-colors"
                        title="Dismiss"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}