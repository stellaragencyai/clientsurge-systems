import { useState, useMemo } from "react";
import { Mail, MessageSquare, CheckCircle2, AlertCircle, Search, Filter } from "lucide-react";

const SAMPLE_RESPONSES = [
  {
    id: 1,
    timestamp: "2026-04-28 14:32",
    type: "sms",
    lead: "Sarah Mitchell",
    automation: "Instant SMS Response",
    message: "Hi Sarah! Thanks for your interest. Your appointment is confirmed for tomorrow at 2PM.",
    status: "delivered",
  },
  {
    id: 2,
    timestamp: "2026-04-28 14:28",
    type: "email",
    lead: "James Patterson",
    automation: "Nurture Email Sequence",
    message: "Subject: Case Study: How Med Spas Increased Revenue by 3x",
    status: "opened",
  },
  {
    id: 3,
    timestamp: "2026-04-28 14:15",
    type: "sms",
    lead: "Marcus Chen",
    automation: "Missed Call Recovery",
    message: "Hi Marcus, you called us earlier. We're ready to help—book your appointment here: [link]",
    status: "delivered",
  },
  {
    id: 4,
    timestamp: "2026-04-28 14:02",
    type: "email",
    lead: "Priya Kapoor",
    automation: "Booking Reminder",
    message: "Subject: Your appointment is in 24 hours. Confirm or reschedule: [link]",
    status: "sent",
  },
  {
    id: 5,
    timestamp: "2026-04-28 13:54",
    type: "sms",
    lead: "Elena Rodriguez",
    automation: "Follow-up SMS",
    message: "Still interested? Here's an exclusive offer just for you...",
    status: "delivered",
  },
  {
    id: 6,
    timestamp: "2026-04-28 13:42",
    type: "email",
    lead: "Tom Bradley",
    automation: "Instant Response",
    message: "Subject: Thank you for contacting us - Here's how we can help",
    status: "opened",
  },
  {
    id: 7,
    timestamp: "2026-04-28 13:28",
    type: "sms",
    lead: "David Wilson",
    automation: "SMS Response",
    message: "Perfect timing! Let's schedule your free consultation this week.",
    status: "failed",
  },
  {
    id: 8,
    timestamp: "2026-04-28 13:15",
    type: "email",
    lead: "Jennifer Lee",
    automation: "Reactivation Campaign",
    message: "Subject: We miss you! Here's what's new + a special offer...",
    status: "sent",
  },
];

const TYPE_CONFIG = {
  sms: { label: "SMS", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  email: { label: "Email", icon: Mail, color: "text-amber-600", bg: "bg-amber-50" },
};

const STATUS_CONFIG = {
  sent: { label: "Sent", icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-50" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  opened: { label: "Opened", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function AutomatedResponsesLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredResponses = useMemo(() => {
    return SAMPLE_RESPONSES.filter((response) => {
      const matchesSearch =
        response.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.automation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || response.type === filterType;
      const matchesStatus = filterStatus === "all" || response.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, filterType, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: filteredResponses.length,
      delivered: filteredResponses.filter((r) => r.status === "delivered").length,
      opened: filteredResponses.filter((r) => r.status === "opened").length,
      failed: filteredResponses.filter((r) => r.status === "failed").length,
    };
  }, [filteredResponses]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Sent</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
          <p className="text-xs text-green-600 mt-1">Delivered</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">{stats.opened}</p>
          <p className="text-xs text-blue-600 mt-1">Opened/Read</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          <p className="text-xs text-red-600 mt-1">Failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by lead, automation, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="sms">SMS Only</option>
          <option value="email">Email Only</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Responses List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Automated Responses</h3>
          <p className="text-xs text-muted-foreground mt-1">All system-sent SMS and emails on your behalf</p>
        </div>

        {filteredResponses.length > 0 ? (
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {filteredResponses.map((response) => {
              const TypeIcon = TYPE_CONFIG[response.type].icon;
              const StatusIcon = STATUS_CONFIG[response.status].icon;
              return (
                <div key={response.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_CONFIG[response.type].bg}`}
                      >
                        {TYPE_CONFIG[response.type].label}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[response.status].bg}`}
                      >
                        {STATUS_CONFIG[response.status].label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{response.timestamp}</span>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-semibold text-foreground text-sm mb-1">{response.lead}</h4>
                    <p className="text-xs text-muted-foreground mb-2">Automation: {response.automation}</p>
                    <p className="text-sm text-foreground/80 bg-muted/50 rounded p-2">{response.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground text-sm">No responses found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}