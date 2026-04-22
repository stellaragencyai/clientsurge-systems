import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useCart } from "@/lib/cartContext";

export default function InteractiveStackBuilder() {
  const { items, addItem, removeItem } = useCart();
  const [draggedId, setDraggedId] = useState(null);

  const monthlyTotal = items.reduce((s, i) => s + i.monthly_fee, 0);
  const setupTotal = items.reduce((s, i) => s + i.setup_fee, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        alignItems: "start",
        marginTop: "32px",
      }}
    >
      {/* Left: Stack visualization */}
      <div
        style={{
          perspective: "1200px",
          minHeight: "300px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "24px",
          borderRadius: "16px",
          border: "1.5px solid rgba(154,92,46,0.15)",
          background: "linear-gradient(135deg, rgba(154,92,46,0.05) 0%, rgba(200,150,92,0.03) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            perspective: "1000px",
          }}
        >
          {items.length === 0 ? (
            <p
              style={{
                fontSize: "13px",
                color: "rgba(26,18,9,0.4)",
                textAlign: "center",
                padding: "32px 16px",
              }}
            >
              Add services from the catalog to build your stack
            </p>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.product_id}
                style={{
                  transform: `rotateX(${idx * 2}deg) scale(${1 - idx * 0.02})`,
                  transformOrigin: "bottom center",
                  transformStyle: "preserve-3d",
                  background: `linear-gradient(135deg, rgba(154,92,46,0.${15 + idx * 8}), rgba(200,150,92,0.${8 + idx * 6}))`,
                  borderRadius: "10px",
                  padding: "10px 16px",
                  border: "1px solid rgba(154,92,46,0.2)",
                  minWidth: "200px",
                  boxShadow: `0 ${4 + idx * 2}px ${12 + idx * 4}px rgba(0,0,0,0.${8 + idx * 3})`,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotateX(${
                    idx * 2
                  }deg) scale(${1 - idx * 0.02}) translateY(-4px)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotateX(${idx * 2}deg) scale(${
                    1 - idx * 0.02
                  })`;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#1a1209",
                    }}
                  >
                    {item.icon} {item.name}
                  </span>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px",
                      color: "rgba(26,18,9,0.4)",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#e53e3e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(26,18,9,0.4)")
                    }
                  >
                    <Trash2 style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(26,18,9,0.55)",
                    marginTop: "4px",
                  }}
                >
                  ${item.setup_fee} setup · ${item.monthly_fee}/mo
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Pricing summary */}
      <div
        style={{
          background: "rgba(255,255,255,0.8)",
          border: "1.5px solid rgba(154,92,46,0.2)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "fit-content",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "700",
            color: "#1a1209",
            margin: 0,
          }}
        >
          Your AI Stack
        </h3>

        {/* Timeline breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(154,92,46,0.1)",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
              One-time setup
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1209" }}>
              ${setupTotal}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,18,9,0.55)" }}>
              Monthly subscription
            </span>
            <span
              style={{ fontSize: "16px", fontWeight: "800", color: "#9a5c2e" }}
            >
              ${monthlyTotal}/mo
            </span>
          </div>
        </div>

        {/* Live timeline estimate */}
        <div
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "#22c55e",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Go-live timeline
          </p>
          <div
            style={{
              height: "6px",
              borderRadius: "3px",
              background: "rgba(34,197,94,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min((items.length / 12) * 100, 100)}%`,
                background: "linear-gradient(to right, #22c55e, #16a34a)",
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(26,18,9,0.5)",
              margin: "6px 0 0",
            }}
          >
            {items.length > 0 ? "5–7 days" : "Add services to estimate"}
          </p>
        </div>

        {items.length > 0 && (
          <button
            style={{
              borderRadius: "9999px",
              padding: "2px",
              background:
                "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(120,70,20,0.3)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "12px",
              }}
            >
              Proceed to Checkout
            </span>
          </button>
        )}
      </div>
    </div>
  );
}