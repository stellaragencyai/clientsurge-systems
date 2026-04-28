import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Zap, Settings, FlaskConical, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INSTALL_STAGES = [
  { key: "Paid", label: "Payment Confirmed", icon: CheckCircle2, color: "#22c55e" },
  { key: "Ready for Install", label: "Queued for Setup", icon: Clock, color: "#f59e0b" },
  { key: "Configuring", label: "Configuring", icon: Settings, color: "#3b82f6" },
  { key: "Testing", label: "Testing", icon: FlaskConical, color: "#8b5cf6" },
  { key: "Live", label: "Live", icon: Radio, color: "#22c55e" },
];

const STAGE_ORDER = INSTALL_STAGES.map((s) => s.key);

function getStageIndex(status) {
  const idx = STAGE_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function ServiceRow({ item }) {
  const stageIndex = getStageIndex(item.install_status || "Paid");
  const isLive = item.install_status === "Live";
  const isError = item.install_status === "Error";

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: isLive
          ? "1.5px solid rgba(34,197,94,0.35)"
          : isError
          ? "1.5px solid rgba(239,68,68,0.35)"
          : "1.5px solid rgba(154,92,46,0.15)",
        boxShadow: "0 2px 10px rgba(111,67,31,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <p className="text-sm font-semibold text-foreground">{item.product_name}</p>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: isLive
              ? "rgba(34,197,94,0.1)"
              : isError
              ? "rgba(239,68,68,0.1)"
              : "rgba(154,92,46,0.08)",
            color: isLive ? "#16a34a" : isError ? "#dc2626" : "#9a5c2e",
            border: isLive
              ? "1px solid rgba(34,197,94,0.2)"
              : isError
              ? "1px solid rgba(239,68,68,0.2)"
              : "1px solid rgba(154,92,46,0.14)",
          }}
        >
          {isError ? "Error" : item.install_status || "Paid"}
        </span>
      </div>

      {/* Progress track */}
      {!isError && (
        <div className="flex items-center gap-1">
          {INSTALL_STAGES.map((stage, i) => {
            const done = i <= stageIndex;
            const active = i === stageIndex;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                    style={{
                      background: done ? stage.color : "rgba(154,92,46,0.1)",
                      border: active ? `2px solid ${stage.color}` : done ? "none" : "1.5px solid rgba(154,92,46,0.18)",
                      boxShadow: active ? `0 0 0 3px ${stage.color}22` : "none",
                    }}
                  >
                    <Icon
                      className={active ? "animate-pulse" : ""}
                      style={{ width: "11px", height: "11px", color: done ? "#fff" : "rgba(154,92,46,0.4)" }}
                    />
                  </div>
                  <span
                    className="text-[9px] font-semibold text-center leading-tight hidden sm:block"
                    style={{ color: done ? "#1b140d" : "rgba(27,20,13,0.35)", maxWidth: "44px" }}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < INSTALL_STAGES.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 rounded-full transition-all duration-700"
                    style={{ background: i < stageIndex ? "#22c55e" : "rgba(154,92,46,0.12)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isError && item.install_error && (
        <p className="text-xs text-red-600 mt-2 leading-relaxed">{item.install_error}</p>
      )}
    </div>
  );
}

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
    // Poll every 15 seconds for live status updates
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

  const allLive = order.items.every((item) => item.install_status === "Live");
  const overallStatus = allLive ? "fully_live" : order.order_status || "paid_setup_in_progress";

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        border: "1.5px solid rgba(154,92,46,0.2)",
        boxShadow: "0 8px 32px rgba(111,67,31,0.09)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.05) 100%)",
          borderBottom: "1px solid rgba(154,92,46,0.12)",
        }}
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-0.5">Live Setup Tracker</p>
          <p className="text-sm font-semibold text-foreground">
            {order.business_name || order.customer_name}
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: allLive ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
            border: allLive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(245,158,11,0.2)",
            color: allLive ? "#16a34a" : "#d97706",
          }}
        >
          <span className={`w-2 h-2 rounded-full ${allLive ? "bg-green-500" : "bg-amber-400 animate-pulse"}`} />
          {allLive ? "All Systems Live" : "Setup In Progress"}
        </div>
      </div>

      {/* Services */}
      <div
        className="px-6 py-5 space-y-3"
        style={{ background: "rgba(253,251,248,0.96)" }}
      >
        {order.items.map((item, i) => (
          <ServiceRow key={item.product_id || i} item={item} />
        ))}
        <p className="text-center text-[10px] text-muted-foreground pt-1">
          Updates automatically every 15 seconds · No action needed
        </p>
      </div>
    </div>
  );
}