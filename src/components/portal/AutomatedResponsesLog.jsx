import { useState, useEffect, useMemo } from "react";
import { Mail, MessageSquare, CheckCircle2, AlertCircle, Search, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TYPE_CONFIG = {
  sms: { label: "SMS", icon: MessageSquare, bg: "bg-blue-50 text-blue-700" },
  email: { label: "Email", icon: Mail, bg: "bg-amber-50 text-amber-700" },
  webhook: { label: "Webhook", icon: CheckCircle2, bg: "bg-purple-50 text-purple-700" },
  internal: { label: "Internal", icon: CheckCircle2, bg: "bg-gray-50 text-gray-700" },
};

const STATUS_CONFIG = {
  sent: { label: "Sent", color: "bg-gray-50 text-gray-600" },
  delivered: { label: "Delivered", color: "bg-green-50 text-green-700" },
  opened: { label: "Opened", color: "bg-blue-50 text-blue-700" },
  failed: { label: "Failed", color: "bg-red-50 text-red-700" },
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700" },
  processed: { label: "Processed", color: "bg-green-50 text-green-700" },
  received: { label: "Received", color: "bg-purple-50 text-purple-700" },
};

export default function AutomatedResponsesLog() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getClientFollowUpLog", {});
      setEvents(res.data.events || []);
    } catch (e) {
      setError("Failed to load follow-up log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        !searchQuery ||
        (e.message_body || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.event_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.service_key || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.lead_id || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "all" || e.channel === filterType;
      const matchStatus = filterStatus === "all" || e.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [events, searchQuery, filterType, filterStatus]);

  const stats = useMemo(() => ({
    total: filtered.length,
    delivered: filtered.filter(e => e.status === "delivered").length,
    opened: filtered.filter(e => e.status === "opened").length,
    failed: filtered.filter(e => e.status === "failed").length,
  }), [filtered]);

  const outbound = filtered.filter(e => e.direction === "outbound");

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Events</p>
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
            placeholder="Search message, service, or lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 rounded-lg border border-input bg-background text-sm cursor-pointer">
          <option value="all">All Types</option>
          <option value="sms">SMS Only</option>
          <option value="email">Email Only</option>
          <option value="webhook">Webhooks</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-lg border border-input bg-background text-sm cursor-pointer">
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <button onClick={load} disabled={loading} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Events List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Automated Follow-Up Log</h3>
          <p className="text-xs text-muted-foreground mt-1">Real-time log of all system-sent communications</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
          </div>
        ) : outbound.length > 0 ? (
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {outbound.map((event) => {
              const typeConf = TYPE_CONFIG[event.channel] || TYPE_CONFIG.internal;
              const statusConf = STATUS_CONFIG[event.status] || { label: event.status, color: "bg-gray-50 text-gray-600" };
              return (
                <div key={event.id} className="p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeConf.bg}`}>{typeConf.label}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusConf.color}`}>{statusConf.label}</span>
                      {event.service_key && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary border border-primary/15">
                          {event.service_key.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(event.created_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  {event.message_body && (
                    <p className="text-sm text-foreground/80 bg-muted/40 rounded-lg p-2.5 mt-2 leading-relaxed">{event.message_body}</p>
                  )}
                  {event.subject && (
                    <p className="text-xs text-muted-foreground mt-1">Subject: {event.subject}</p>
                  )}
                  {event.error_message && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {event.error_message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground text-sm">No outbound events found{filterType !== "all" || filterStatus !== "all" ? " matching your filters" : " yet"}.</p>
          </div>
        )}
      </div>
    </div>
  );
}