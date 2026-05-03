import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min${diff > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SocialProofTicker() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    base44.entities.Order.filter({ payment_status: "paid" }, "-created_date", 10)
      .then((orders) => {
        const mapped = (orders || [])
          .filter((o) => o.business_name && o.items?.length)
          .map((o) => ({
            name: o.business_name,
            service: o.items[0]?.product_name || "AI Automation",
            time: timeAgo(o.created_date),
          }));
        if (mapped.length > 0) {
          setPurchases(mapped);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!purchases.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % purchases.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [purchases.length]);

  if (!visible || !purchases.length) return null;

  const purchase = purchases[currentIndex];

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
          border: "1px solid rgba(200,150,92,0.3)",
          borderRadius: "12px",
          padding: "14px 16px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.3), 0 0 1px rgba(200,150,92,0.4)",
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
            background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(154,92,46,0.4)",
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
              color: "#f5e6d0",
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
              color: "rgba(200,150,92,0.9)",
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
              color: "rgba(200,150,92,0.6)",
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
            color: "rgba(200,150,92,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(200,150,92,1)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,150,92,0.7)")}
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
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }
      `}</style>
    </div>
  );
}