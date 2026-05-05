/**
 * FailedEventsPanel
 * Shows failed CommunicationEvents with raw payload viewer and Retry button.
 * Supports SMS (Twilio), Email (Resend), and Stripe events.
 */
import { useState, useEffect } from "react";
import {
  XCircle, RefreshCw, Loader2, ChevronDown, ChevronUp,
  MessageSquare, Mail, CreditCard, AlertTriangle, CheckCircle2, ExternalLink
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const PROVIDER_ICONS = {
  twilio: MessageSquare,
  resend: Mail,
  stripe: CreditCard,
};

const PROVIDER_COLORS = {
  twilio: "bg-blue-50 border-blue-200 text-blue-800",
  resend: "bg-purple-50 border-purple-200 text-purple-800",
  stripe: "bg-indigo-50 border-indigo-200 text-indigo-800",
};

function formatAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function FailedEventRow({ event, onRetried }) {
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState(null);
  const [retryError, setRetryError] = useState("");

  const ProviderIcon = PROVIDER_ICONS[event.provider] || AlertTriangle;
  const providerColor = PROVIDER_COLORS[event.provider] || "bg-slate-50 border-slate-200 text-slate-800";

  const handleRetry = async (e) => {
    e.stopPropagation();
    setRetrying(true);
    setRetryError("");
    setRetryResult(null);
    try {
      const res = await base44.functions.invoke("retryFailedEvent", { event_id: event.id });
      setRetryResult(res.data?.result);
      if (res.data?.result?.status === "sent") {
        onRetried?.(event.id);
      }
    } catch (err) {
      setRetryError(err?.response?.data?.error || err?.message || "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  let metadata = null;
  if (event.metadata_json) {
    try { metadata = JSON.parse(event.metadata_json); } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
      {/* Row header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-red-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${providerColor}`}>
          <ProviderIcon className="w-3 h-3" />
          {event.provider}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {event.subject || event.event_type?.replace(/_/g, " ") || "Unknown event"}
          </p>
          <p className="text-xs text-red-600 mt-0.5 truncate">
            {event.error_message || "No error message recorded"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatAgo(event.created_date)}</span>

          {retryResult?.status === "sent" ? (
            <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Retried
            </span>
          ) : retryResult?.status === "manual_required" ? (
            <a
              href={`https://dashboard.stripe.com/webhooks`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full hover:bg-indigo-100"
            >
              <ExternalLink className="w-3 h-3" /> Stripe Dashboard
            </a>
          ) : (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {retrying ? "Retrying…" : "Retry"}
            </button>
          )}

          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded payload viewer */}
      {expanded && (
        <div className="border-t border-red-100 bg-slate-50 p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="font-bold uppercase tracking-widest text-muted-foreground mb-1">Channel</p>
              <p className="text-foreground">{event.channel}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest text-muted-foreground mb-1">Direction</p>
              <p className="text-foreground">{event.direction}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest text-muted-foreground mb-1">Event Type</p>
              <p className="text-foreground">{event.event_type}</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest text-muted-foreground mb-1">Provider Msg ID</p>
              <p className="text-foreground font-mono text-[10px] truncate">{event.provider_message_id || "—"}</p>
            </div>
          </div>

          {event.message_body && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Message Body</p>
              <pre className="text-xs bg-white border border-border rounded-lg p-3 whitespace-pre-wrap max-h-32 overflow-y-auto text-foreground">
                {event.message_body}
              </pre>
            </div>
          )}

          {event.error_message && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Error Details</p>
              <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap text-red-800">
                {event.error_message}
              </pre>
            </div>
          )}

          {metadata && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Metadata / Raw Payload</p>
              <pre className="text-xs bg-white border border-border rounded-lg p-3 whitespace-pre-wrap max-h-48 overflow-y-auto text-foreground font-mono">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}

          {retryResult?.status === "manual_required" && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-800">
              <p className="font-bold mb-1">Stripe Manual Retry Required</p>
              <p>{retryResult.message}</p>
            </div>
          )}

          {retryError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
              <p className="font-bold mb-1">Retry Failed</p>
              <p>{retryError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FailedEventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | twilio | resend | stripe
  const [retriedIds, setRetriedIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CommunicationEvent.filter(
        { status: "failed" },
        "-created_date",
        100
      );
      setEvents(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRetried = (id) => {
    setRetriedIds(prev => new Set([...prev, id]));
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: "sent" } : e));
  };

  const filtered = events.filter(e => {
    if (retriedIds.has(e.id)) return false;
    if (filter !== "all" && e.provider !== filter) return false;
    return true;
  });

  const counts = {
    all: events.filter(e => !retriedIds.has(e.id)).length,
    twilio: events.filter(e => e.provider === "twilio" && !retriedIds.has(e.id)).length,
    resend: events.filter(e => e.provider === "resend" && !retriedIds.has(e.id)).length,
    stripe: events.filter(e => e.provider === "stripe" && !retriedIds.has(e.id)).length,
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {[
            { key: "all", label: "All Failures" },
            { key: "twilio", label: "Twilio SMS" },
            { key: "resend", label: "Resend Email" },
            { key: "stripe", label: "Stripe" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 ${
                  filter === tab.key ? "bg-red-100 text-red-700" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading failed events…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No failed events</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "all" ? "All deliveries are successful." : `No failed ${filter} events.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(evt => (
            <FailedEventRow key={evt.id} event={evt} onRetried={handleRetried} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing last 100 failed events. SMS and Email retries send immediately. Stripe events must be replayed via the Stripe Dashboard.
      </p>
    </div>
  );
}