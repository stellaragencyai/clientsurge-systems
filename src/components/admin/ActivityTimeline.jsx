/**
 * ActivityTimeline — chronological history of all interactions for a lead.
 * Merges CommunicationEvent + Events (notes, status changes) into one timeline.
 */

import { useEffect, useState } from "react";
import {
  MessageSquare, Mail, Phone, Loader2, RefreshCw,
  StickyNote, ArrowUpCircle, Zap, CheckCircle2,
  AlertCircle, MessageCircle, Globe, ArrowDownLeft,
  ArrowUpRight, Activity, Info,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG = {
  // CommunicationEvent event_types
  sms_sent:           { icon: MessageSquare,  label: "SMS Sent",          color: "bg-blue-100 text-blue-700",    dot: "bg-blue-400" },
  sms_received:       { icon: ArrowDownLeft,  label: "SMS Received",       color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  sms_failed:         { icon: AlertCircle,    label: "SMS Failed",         color: "bg-red-100 text-red-700",      dot: "bg-red-400" },
  sms_delivered:      { icon: CheckCircle2,   label: "SMS Delivered",      color: "bg-green-100 text-green-700",  dot: "bg-green-400" },
  email_sent:         { icon: Mail,           label: "Email Sent",         color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  email_failed:       { icon: AlertCircle,    label: "Email Failed",       color: "bg-red-100 text-red-700",      dot: "bg-red-400" },
  whatsapp_sent:      { icon: MessageCircle,  label: "WhatsApp Sent",      color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  whatsapp_received:  { icon: MessageCircle,  label: "WhatsApp Received",  color: "bg-teal-100 text-teal-700",    dot: "bg-teal-400" },
  whatsapp_failed:    { icon: AlertCircle,    label: "WhatsApp Failed",    color: "bg-red-100 text-red-700",      dot: "bg-red-400" },
  whatsapp_delivered: { icon: CheckCircle2,   label: "WhatsApp Delivered", color: "bg-green-100 text-green-700",  dot: "bg-green-400" },
  webhook_sent:       { icon: Globe,          label: "Webhook Sent",       color: "bg-slate-100 text-slate-700",  dot: "bg-slate-400" },
  workflow_triggered: { icon: Zap,            label: "Workflow",           color: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  status_update:      { icon: ArrowUpCircle,  label: "Status Update",      color: "bg-cyan-100 text-cyan-700",    dot: "bg-cyan-400" },
  lead_created:       { icon: CheckCircle2,   label: "Lead Created",       color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  // Events entity event_types
  note:               { icon: StickyNote,     label: "Note",               color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  status_changed:     { icon: ArrowUpCircle,  label: "Status Changed",     color: "bg-cyan-100 text-cyan-700",    dot: "bg-cyan-400" },
  follow_up_scheduled:{ icon: Activity,       label: "Follow-Up Scheduled",color: "bg-blue-100 text-blue-700",    dot: "bg-blue-300" },
};

const DEFAULT_CONFIG = { icon: Info, label: "Event", color: "bg-slate-100 text-slate-600", dot: "bg-slate-300" };

const CHANNEL_LABELS = { sms: "SMS", email: "Email", whatsapp: "WhatsApp", webhook: "Webhook", internal: "Internal" };
const DIRECTION_LABELS = { outbound: "Outbound", inbound: "Inbound", system: "System" };

function formatTs(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatFull(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Timeline Item ─────────────────────────────────────────────────────────────

function TimelineItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = EVENT_TYPE_CONFIG[item.event_type] || DEFAULT_CONFIG;
  const Icon = cfg.icon;

  const hasBody = !!(item.message_body || item.note_text || item.subject);
  const hasError = !!item.error_message;

  return (
    <div className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 w-7">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 pb-4 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
              <Icon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
            {item.channel && item.source === "comm" && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {CHANNEL_LABELS[item.channel] || item.channel}
              </span>
            )}
            {item.direction && item.source === "comm" && (
              <span className="text-[10px] text-muted-foreground">
                · {DIRECTION_LABELS[item.direction] || item.direction}
              </span>
            )}
            {item.status && item.source === "comm" && (
              <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                item.status === "sent" || item.status === "delivered" ? "bg-green-50 text-green-700" :
                item.status === "failed" ? "bg-red-50 text-red-700" :
                item.status === "received" ? "bg-blue-50 text-blue-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {item.status}
              </span>
            )}
          </div>
          <span
            title={formatFull(item.created_date)}
            className="text-[10px] text-muted-foreground flex-shrink-0 cursor-default"
          >
            {formatTs(item.created_date)}
          </span>
        </div>

        {/* Subject / title */}
        {item.subject && (
          <p className="text-xs font-semibold text-foreground mt-1">{item.subject}</p>
        )}

        {/* Body preview */}
        {hasBody && (
          <div className="mt-1">
            <p className={`text-xs text-foreground leading-relaxed ${!expanded && "line-clamp-2"}`}>
              {item.message_body || item.note_text}
            </p>
            {(item.message_body || item.note_text || "").length > 100 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] text-primary font-medium mt-0.5 hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {hasError && (
          <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {item.error_message}
          </p>
        )}

        {/* Provider */}
        {item.provider && item.provider !== "internal" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">via {item.provider}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ActivityTimeline({ leadId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (leadId) loadTimeline();
  }, [leadId]);

  const loadTimeline = async () => {
    setLoading(true);
    setError("");
    try {
      const [commEvents, events] = await Promise.all([
        base44.entities.CommunicationEvent.filter({ lead_id: leadId }, "-created_date", 200),
        base44.entities.Events.filter({ lead_id: leadId }, "-created_date", 100),
      ]);

      // Normalise CommunicationEvents
      const commItems = (commEvents || []).map((e) => ({
        id: `comm-${e.id}`,
        source: "comm",
        event_type: e.event_type,
        channel: e.channel,
        direction: e.direction,
        status: e.status,
        subject: e.subject,
        message_body: e.message_body,
        error_message: e.error_message,
        provider: e.provider,
        created_date: e.created_date,
      }));

      // Normalise Events (notes, status_changed, etc.)
      const eventItems = (events || []).map((e) => ({
        id: `evt-${e.id}`,
        source: "event",
        event_type: e.event_type || "note",
        note_text: e.data?.text || e.data?.note || (typeof e.data === "string" ? e.data : null),
        subject: e.data?.subject || null,
        created_date: e.created_date,
      }));

      // Merge & sort newest first
      const merged = [...commItems, ...eventItems].sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );

      setItems(merged);
    } catch (err) {
      setError("Failed to load activity timeline.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter options
  const FILTERS = [
    { key: "all", label: "All" },
    { key: "sms", label: "SMS" },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "note", label: "Notes" },
    { key: "workflow", label: "System" },
  ];

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "sms") return item.channel === "sms" || item.event_type?.startsWith("sms_");
    if (filter === "email") return item.channel === "email" || item.event_type?.startsWith("email_");
    if (filter === "whatsapp") return item.channel === "whatsapp" || item.event_type?.startsWith("whatsapp_");
    if (filter === "note") return item.event_type === "note";
    if (filter === "workflow") return ["workflow_triggered", "status_update", "status_changed", "lead_created", "follow_up_scheduled"].includes(item.event_type);
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Activity Timeline
        </p>
        <button
          onClick={loadTimeline}
          disabled={loading}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          title="Refresh timeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground self-center ml-1">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading timeline…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Activity className="w-8 h-8 opacity-20" />
          <p className="text-sm">{filter === "all" ? "No activity recorded yet" : `No ${filter} events found`}</p>
        </div>
      ) : (
        <div className="mt-2">
          {filtered.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
          {/* End of timeline */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center w-7">
              <div className="w-2.5 h-2.5 rounded-full bg-muted border-2 border-border" />
            </div>
            <p className="text-[10px] text-muted-foreground pb-2 self-center">End of timeline</p>
          </div>
        </div>
      )}
    </div>
  );
}