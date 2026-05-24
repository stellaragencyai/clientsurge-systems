import { useState, useMemo } from "react";
import { Mail, MessageSquare, CheckCircle2, AlertCircle, Clock, Search } from "lucide-react";

const ACTIVITY_DATA = [
  {
    id: 1,
    timestamp: "2026-04-28 14:32:15",
    actionType: "sms",
    actionLabel: "SMS Response",
    lead: "Sarah Mitchell",
    leadId: "LEAD-2847",
    message: "Hi Sarah! Thanks for your interest. Your appointment is confirmed for tomorrow at 2PM.",
    status: "success",
    duration: "< 1s",
  },
  {
    id: 2,
    timestamp: "2026-04-28 14:31:42",
    actionType: "email",
    actionLabel: "Nurture Email",
    lead: "James Patterson",
    leadId: "LEAD-2845",
    message: "Case Study: How Med Spas Increased Revenue by 3x",
    status: "success",
    duration: "2s",
  },
  {
    id: 3,
    timestamp: "2026-04-28 14:28:19",
    actionType: "sms",
    actionLabel: "Missed Call Recovery",
    lead: "Marcus Chen",
    leadId: "LEAD-2843",
    message: "Hi Marcus, you called us earlier. We're ready to help—book your appointment here: [link]",
    status: "success",
    duration: "< 1s",
  },
  {
    id: 4,
    timestamp: "2026-04-28 14:15:03",
    actionType: "email",
    actionLabel: "Booking Reminder",
    lead: "Priya Kapoor",
    leadId: "LEAD-2840",
    message: "Your appointment is in 24 hours. Confirm or reschedule: [link]",
    status: "success",
    duration: "3s",
  },
  {
    id: 5,
    timestamp: "2026-04-28 13:54:27",
    actionType: "sms",
    actionLabel: "Follow-up SMS",
    lead: "Elena Rodriguez",
    leadId: "LEAD-2839",
    message: "Still interested? Here's an exclusive offer just for you...",
    status: "success",
    duration: "1s",
  },
  {
    id: 6,
    timestamp: "2026-04-28 13:42:11",
    actionType: "email",
    actionLabel: "Instant Response",
    lead: "Tom Bradley",
    leadId: "LEAD-2837",
    message: "Thank you for submitting the form. Here's how we can help you save 30% on HVAC costs.",
    status: "success",
    duration: "1s",
  },
  {
    id: 7,
    timestamp: "2026-04-28 13:28:45",
    actionType: "sms",
    actionLabel: "SMS Response",
    lead: "David Wilson",
    leadId: "LEAD-2835",
    message: "Perfect timing! Let's schedule your free consultation this week.",
    status: "failed",
    duration: "5s",
  },
  {
    id: 8,
    timestamp: "2026-04-28 13:15:22",
    actionType: "email",
    actionLabel: "Reactivation Campaign",
    lead: "Jennifer Lee",
    leadId: "LEAD-2833",
    message: "We miss you! Here's what's new + a special offer...",
    status: "pending",
    duration: "—",
  },
];

const ACTION_TYPE_CONFIG = {
  sms: {
    label: "SMS",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  email: {
    label: "Email",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
};

const STATUS_CONFIG = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
};

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredActivity = useMemo(() => {
    return ACTIVITY_DATA.filter((activity) => {
      const matchesSearch =
        activity.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = filterAction === "all" || activity.actionType === filterAction;
      const matchesStatus = filterStatus === "all" || activity.status === filterStatus;
      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [searchQuery, filterAction, filterStatus]);

  return (
    <div className="bg-background rounded-2xl border border-border p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Activity Log</h2>
        <p className="text-muted-foreground text-sm">
          Track every automated action in real-time. Verify your lead engagement system is working perfectly.
        </p>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by lead name, ID, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {/* Action Filter */}
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
        >
          <option value="all">All Actions</option>
          <option value="sms">SMS Only</option>
          <option value="email">Email Only</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Activity Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Timestamp</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Lead</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Message Preview</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground text-sm">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground text-sm">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivity.length > 0 ? (
              filteredActivity.map((activity) => {
                const ActionIcon = ACTION_TYPE_CONFIG[activity.actionType].icon;
                const StatusIcon = STATUS_CONFIG[activity.status].icon;
                return (
                  <tr
                    key={activity.id}
                    className="border-b border-border/50 hover:bg-card/30 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {activity.timestamp}
                      </span>
                    </td>

                    {/* Action Type */}
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${ACTION_TYPE_CONFIG[activity.actionType].bgColor}`}>
                        <ActionIcon className={`w-3.5 h-3.5 ${ACTION_TYPE_CONFIG[activity.actionType].color}`} />
                        <span>{activity.actionLabel}</span>
                      </div>
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{activity.lead}</span>
                        <span className="text-xs text-muted-foreground">{activity.leadId}</span>
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {activity.message}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[activity.status].bgColor}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${STATUS_CONFIG[activity.status].color}`} />
                          <span>{STATUS_CONFIG[activity.status].label}</span>
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-muted-foreground font-mono">
                        {activity.duration}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No activities found matching your filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{filteredActivity.filter(a => a.status === 'success').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{filteredActivity.filter(a => a.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{filteredActivity.filter(a => a.status === 'failed').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Failed</p>
        </div>
      </div>
    </div>
  );
}