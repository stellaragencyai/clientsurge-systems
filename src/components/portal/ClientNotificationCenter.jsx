/**
 * ClientNotificationCenter — Phase 4.5
 *
 * Unified notification panel powered by useClientNotifications hook.
 * Notifications are passed as props from the hook (single source of truth).
 *
 * Read/unread state managed by the hook via localStorage key "cs_portal_notifications_read".
 */
import { CheckCircle2, AlertCircle, ShieldCheck, FileText, Rocket, Bell, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_TYPE_CONFIG = {
  new_lead: { label: "New Lead", icon: Rocket, color: "#0088CC" },
  lead_booked: { label: "Booked", icon: CheckCircle2, color: "#10B981" },
  lead_replied: { label: "Replied", icon: AlertCircle, color: "#00AEEF" },
  lead_qualified: { label: "Qualified", icon: ShieldCheck, color: "#10B981" },
  deployment_update: { label: "Update", icon: Rocket, color: "#0088CC" },
  automation_verified: { label: "Verified", icon: ShieldCheck, color: "#10B981" },
  action_needed: { label: "Action Needed", icon: AlertCircle, color: "#F59E0B" },
  system_issue: { label: "System Issue", icon: AlertCircle, color: "#EF4444" },
  report_available: { label: "Report", icon: FileText, color: "#0088CC" },
};

export default function ClientNotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  loading = false,
}) {
  const handleMarkAsRead = (id) => {
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center relative"
            style={{ background: "#00AEEF10", border: "1px solid #00AEEF20" }}
          >
            <Bell className="w-4 h-4 text-[#0088CC]" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                style={{ border: "2px solid #fff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <p className="text-[10px] text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-[#0088CC] hover:text-[#006BB0] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <span className="text-sm text-gray-400">Loading notifications…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center px-4">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You'll see updates here as your system progresses.
            </p>
          </div>
        ) : (
          <div>
            {notifications.slice(0, 15).map((notif) => {
              const cfg = NOTIFICATION_TYPE_CONFIG[notif.type] || NOTIFICATION_TYPE_CONFIG.deployment_update;
              const Icon = cfg.icon;
              const isUnread = !notif.read;
              const date = notif.timestamp ? new Date(notif.timestamp) : null;

              return (
                <button
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-colors border-b border-gray-50 last:border-0 ${
                    isUnread ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}10` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{notif.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#00AEEF] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    {date && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}