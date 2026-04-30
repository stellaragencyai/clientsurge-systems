import { useEffect, useState } from "react";
import {
  CheckCircle2, Clock, Settings, FlaskConical, Radio,
  AlertTriangle, XCircle, UserX, CreditCard, Code2, KeyRound,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

// ─── Stage pipeline ───────────────────────────────────────────────────────────

const INSTALL_STAGES = [
  { key: "Paid",             label: "Paid",         icon: CheckCircle2,  color: "#22c55e" },
  { key: "Ready for Install",label: "Queued",       icon: Clock,         color: "#f59e0b" },
  { key: "Configuring",      label: "Configuring",  icon: Settings,      color: "#3b82f6" },
  { key: "Testing",          label: "Testing",      icon: FlaskConical,  color: "#8b5cf6" },
  { key: "Live",             label: "Live ✓",       icon: Radio,         color: "#22c55e" },
];

const STAGE_KEYS = INSTALL_STAGES.map((s) => s.key);

function getStageIndex(status) {
  const idx = STAGE_KEYS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Offline reason classifier ────────────────────────────────────────────────

/**
 * Given an order item, return a structured offline reason:
 * { category, label, detail, icon, color }
 */
function classifyOfflineReason(item) {
  const err = (item.install_error || "").toLowerCase();
  const accessStatus = (item.service_access_status || "").toLowerCase();
  const installStatus = item.install_status || "";

  // Payment / billing issue
  if (
    accessStatus.includes("disabled") &&
    (item.access_disable_reason || "").toLowerCase().includes("payment")
  ) {
    return {
      category: "billing",
      label: "Payment Issue",
      detail:
        item.access_disable_reason ||
        "This service was paused because of a billing problem. Please update your payment method in the client portal.",
      icon: CreditCard,
      color: "#ef4444",
    };
  }

  // Client hasn't completed onboarding / setup
  if (
    installStatus === "Ready for Install" ||
    accessStatus.includes("pending_onboarding") ||
    err.includes("onboarding") ||
    err.includes("not configured") ||
    err.includes("missing configuration") ||
    err.includes("no booking link") ||
    err.includes("no twilio") ||
    err.includes("setup incomplete")
  ) {
    return {
      category: "setup",
      label: "Awaiting Your Setup",
      detail:
        "We need a few details from you before we can configure this service. Check your onboarding email or visit the client portal to complete setup.",
      icon: UserX,
      color: "#f59e0b",
    };
  }

  // Auth / API key / credentials error
  if (
    err.includes("auth") ||
    err.includes("unauthorized") ||
    err.includes("forbidden") ||
    err.includes("api key") ||
    err.includes("invalid key") ||
    err.includes("token") ||
    err.includes("credential") ||
    err.includes("permission")
  ) {
    return {
      category: "auth",
      label: "Auth / API Error",
      detail:
        "There's a credentials or API key issue blocking this service. Our team has been notified and is resolving it. No action needed from you.",
      icon: KeyRound,
      color: "#ef4444",
    };
  }

  // Code / integration bug
  if (
    err.includes("error") ||
    err.includes("exception") ||
    err.includes("failed") ||
    err.includes("timeout") ||
    err.includes("500") ||
    err.includes("502") ||
    err.includes("503") ||
    installStatus === "Error"
  ) {
    return {
      category: "code",
      label: "System Error",
      detail:
        item.install_error ||
        "A technical error occurred during installation. Our engineering team has been alerted and is working on a fix.",
      icon: Code2,
      color: "#ef4444",
    };
  }

  // Generic pending / not yet started
  return {
    category: "pending",
    label: "Pending Setup",
    detail:
      "Our team is queuing this service for installation. You'll see progress here as we move through each stage.",
    icon: Clock,
    color: "#9a5c2e",
  };
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  Live:              { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",  text: "#16a34a",  dot: "#22c55e" },
  Error:             { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",  text: "#dc2626",  dot: "#ef4444" },
  Configuring:       { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.22)", text: "#2563eb",  dot: "#3b82f6" },
  Testing:           { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.22)", text: "#7c3aed",  dot: "#8b5cf6" },
  "Ready for Install":{ bg: "rgba(245,158,11,0.08)",border: "rgba(245,158,11,0.22)", text: "#d97706",  dot: "#f59e0b" },
  Paid:              { bg: "rgba(154,92,46,0.07)",  border: "rgba(154,92,46,0.18)",  text: "#9a5c2e",  dot: "#c8965c" },
};

function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES["Paid"];
}

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({ item }) {
  const status = item.install_status || "Paid";
  const isLive = status === "Live";
  const isError = status === "Error";
  const isPending = !isLive && !isError;
  const stageIndex = getStageIndex(status);
  const style = getStatusStyle(status);
  const offlineReason = (!isLive) ? classifyOfflineReason(item) : null;
  const OfflineIcon = offlineReason?.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `1.5px solid ${isLive ? "rgba(34,197,94,0.3)" : isError ? "rgba(239,68,68,0.3)" : "rgba(154,92,46,0.14)"}`,
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 2px 10px rgba(111,67,31,0.05)",
      }}
    >
      {/* Top bar: name + status badge */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: style.dot, boxShadow: isLive ? `0 0 0 3px ${style.dot}30` : "none" }}
          />
          <p className="text-sm font-bold text-foreground truncate">{item.product_name}</p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.13em] px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
        >
          {status}
        </span>
      </div>

      {/* Progress pipeline (always shown) */}
      <div className="px-5 pb-3">
        <div className="flex items-center">
          {INSTALL_STAGES.map((stage, i) => {
            const done = !isError && i <= stageIndex;
            const active = !isError && i === stageIndex;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                    style={{
                      background: isError
                        ? "rgba(239,68,68,0.12)"
                        : done
                        ? stage.color
                        : "rgba(154,92,46,0.08)",
                      border: isError
                        ? "1.5px solid rgba(239,68,68,0.25)"
                        : active
                        ? `2px solid ${stage.color}`
                        : done
                        ? "none"
                        : "1.5px solid rgba(154,92,46,0.15)",
                      boxShadow: active ? `0 0 0 3px ${stage.color}22` : "none",
                    }}
                  >
                    {isError && i === 0 ? (
                      <XCircle style={{ width: "11px", height: "11px", color: "#ef4444" }} />
                    ) : (
                      <Icon
                        className={active ? "animate-pulse" : ""}
                        style={{
                          width: "11px",
                          height: "11px",
                          color: isError ? "rgba(239,68,68,0.4)" : done ? "#fff" : "rgba(154,92,46,0.35)",
                        }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[8px] font-semibold text-center leading-tight hidden sm:block"
                    style={{
                      color: done && !isError ? "#1b140d" : "rgba(27,20,13,0.3)",
                      maxWidth: "42px",
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < INSTALL_STAGES.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 rounded-full transition-all duration-700"
                    style={{
                      background: !isError && i < stageIndex ? "#22c55e" : "rgba(154,92,46,0.1)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline reason block — shown for all non-live states */}
      {!isLive && offlineReason && (
        <div
          className="mx-4 mb-4 rounded-xl px-4 py-3 flex items-start gap-3"
          style={{
            background: isError ? "rgba(239,68,68,0.05)" : offlineReason.category === "setup" ? "rgba(245,158,11,0.05)" : "rgba(154,92,46,0.04)",
            border: isError ? "1px solid rgba(239,68,68,0.15)" : offlineReason.category === "setup" ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(154,92,46,0.12)",
          }}
        >
          {OfflineIcon && (
            <OfflineIcon
              style={{ width: "14px", height: "14px", color: offlineReason.color, flexShrink: 0, marginTop: "1px" }}
            />
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: offlineReason.color }}>
              {offlineReason.label}
            </p>
            <p className="text-xs text-foreground/65 leading-relaxed">{offlineReason.detail}</p>
          </div>
        </div>
      )}

      {/* Live state — clean confirmation */}
      {isLive && (
        <div
          className="mx-4 mb-4 rounded-xl px-4 py-2.5 flex items-center gap-2"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
        >
          <CheckCircle2 style={{ width: "13px", height: "13px", color: "#16a34a", flexShrink: 0 }} />
          <p className="text-xs font-semibold text-green-700">
            This system is active and running for your business.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main tracker ─────────────────────────────────────────────────────────────

export default function OrderTracker({ sessionId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!sessionId) { setLoading(false); return; }
    try {
      const results = await base44.entities.Order.filter({ stripe_session_id: sessionId });
      if (results?.length > 0) setOrder(results[0]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="rounded-2xl px-6 py-6 text-center" style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(154,92,46,0.12)" }}>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading your order status…</p>
      </div>
    );
  }

  if (!order || !order.items?.length) return null;

  const liveCt  = order.items.filter((i) => i.install_status === "Live").length;
  const errorCt = order.items.filter((i) => i.install_status === "Error").length;
  const total   = order.items.length;
  const allLive = liveCt === total;
  const hasError = errorCt > 0;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        border: `1.5px solid ${allLive ? "rgba(34,197,94,0.3)" : hasError ? "rgba(239,68,68,0.2)" : "rgba(154,92,46,0.2)"}`,
        boxShadow: "0 8px 32px rgba(111,67,31,0.09)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(154,92,46,0.06) 0%, rgba(200,150,92,0.04) 100%)",
          borderBottom: "1px solid rgba(154,92,46,0.12)",
        }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-0.5">Live Setup Tracker</p>
          <p className="text-base font-bold text-foreground">
            {order.business_name || order.customer_name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{order.customer_email}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: allLive ? "rgba(34,197,94,0.1)" : hasError ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
              border: allLive ? "1px solid rgba(34,197,94,0.2)" : hasError ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(245,158,11,0.2)",
              color: allLive ? "#16a34a" : hasError ? "#dc2626" : "#d97706",
            }}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${allLive ? "bg-green-500" : hasError ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
            {allLive ? "All Systems Live" : hasError ? `${errorCt} Error${errorCt > 1 ? "s" : ""}` : "Setup In Progress"}
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {liveCt}/{total} live
          </div>
        </div>
      </div>

      {/* Service list */}
      <div className="px-5 py-5 space-y-3" style={{ background: "rgba(253,251,248,0.97)" }}>
        {order.items.map((item, i) => (
          <ServiceRow key={item.product_id || i} item={item} />
        ))}
        <p className="text-center text-[10px] text-muted-foreground pt-1">
          Auto-refreshes every 15 seconds · Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}