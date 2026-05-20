import { useState } from 'react';
import { Bell, Trash2, Check } from 'lucide-react';

export default function NotificationBell({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClear }) {
  const [open, setOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'new_lead':
        return '🆕';
      case 'lead_booked':
        return '✅';
      case 'lead_replied':
        return '💬';
      case 'lead_qualified':
        return '⭐';
      default:
        return '📬';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden"
            style={{ animation: 'slideDownFade 0.18s ease-out' }}
          >
          <style>{`@keyframes slideDownFade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => onMarkAsRead(notif.id)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted flex items-start gap-3 ${
                        notif.read ? 'bg-white' : 'bg-primary/5 border-l-2 border-l-primary'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{getIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTimeAgo(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}