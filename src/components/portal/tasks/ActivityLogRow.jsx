const CHANNEL_EMOJI = {
  sms:      "💬",
  email:    "📧",
  webhook:  "🔗",
  whatsapp: "💚",
  internal: "⚙️",
};

const STATUS_DOT = {
  sent:      "bg-green-500",
  delivered: "bg-green-600",
  failed:    "bg-red-500",
  received:  "bg-blue-500",
  processed: "bg-purple-500",
  pending:   "bg-blue-500",
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityLogRow({ event }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm">
        {CHANNEL_EMOJI[event.channel] || "📌"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground capitalize">
            {event.event_type?.replace(/_/g, " ")}
          </span>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[event.status] || "bg-gray-400"}`} />
          <span className="text-xs text-muted-foreground capitalize">{event.status}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {event.lead_name}{event.lead_business ? ` · ${event.lead_business}` : ""}
          {event.subject ? ` · "${event.subject}"` : ""}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(event.created_date)}</p>
    </div>
  );
}