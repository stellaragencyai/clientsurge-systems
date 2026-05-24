import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

function timeAgo(value) {
  const timestamp = value ? new Date(value).getTime() : Date.now();
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

function toPurchaseSignal(order) {
  const firstItem = Array.isArray(order.items) ? order.items[0] : null;
  return {
    id: order.id,
    name: order.business_name || order.customer_name || "Local business",
    service: firstItem?.product_name || firstItem?.name || order.plan_type || "AI automation system",
    time: timeAgo(order.created_date || order.paid_at),
  };
}

export default function SocialProofTicker() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [purchaseSignals, setPurchaseSignals] = useState([]);

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.entities.Order.filter({ payment_status: "paid" }, "-created_date", 12)
      .then((orders = []) => {
        if (!cancelled) {
          setPurchaseSignals(orders.map(toPurchaseSignal).filter((signal) => signal.id));
        }
      })
      .catch(() => {
        if (!cancelled) setPurchaseSignals([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!purchaseSignals.length) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % purchaseSignals.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [purchaseSignals.length]);

  if (!visible || !purchaseSignals.length) return null;

  const purchase = purchaseSignals[currentIndex] || purchaseSignals[0];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 40,
        animation: "slideInUp 0.5s ease-out",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(26,18,9,0.95) 0%, rgba(65,35,15,0.95) 100%)",
          border: "1px solid rgba(0,174,239,0.3)",
          borderRadius: "12px",
          padding: "14px 16px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.3), 0 0 1px rgba(0,174,239,0.4)",
          minWidth: "280px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #0077B6, #00AEEF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,136,204,0.4)",
          }}
        >
          <ShoppingCart style={{ width: "18px", height: "18px", color: "#fff" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 3px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#EAF8FF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {purchase.name} added
          </p>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: "11px",
              color: "rgba(0,174,239,0.9)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {purchase.service}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: "rgba(0,174,239,0.6)",
              fontWeight: "600",
            }}
          >
            {purchase.time}
          </p>
        </div>

        <button
          onClick={() => setVisible(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "rgba(0,174,239,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,174,239,1)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,174,239,0.7)")}
        >
          <X style={{ width: "14px", height: "14px" }} />
        </button>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
