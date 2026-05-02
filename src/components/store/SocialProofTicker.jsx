import { useEffect, useState } from "react";
import { ShoppingCart, X } from "lucide-react";

const mockPurchases = [
  { name: "John's Roofing", service: "Instant Lead Response", time: "2 mins ago" },
  { name: "Green HVAC Co", service: "14-Day Nurture Sequence", time: "8 mins ago" },
  { name: "Elite Dental", service: "AI Booking Agent", time: "15 mins ago" },
  { name: "Med Spa Luxe", service: "Missed Call Text-Back", time: "22 mins ago" },
  { name: "Pro Contractors", service: "Instant Lead Response", time: "28 mins ago" },
];

export default function SocialProofTicker() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockPurchases.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const purchase = mockPurchases[currentIndex];

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