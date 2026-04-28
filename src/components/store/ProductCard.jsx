import { CheckCircle2, Plus, Check, Play } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import DemoModal from "@/components/store/DemoModal";
import DetailsModal from "@/components/store/DetailsModal";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [showDemo, setShowDemo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <div
      className="product-card"
      style={{
        borderRadius: "22px",
        border: inCart
          ? "1.5px solid rgba(154,92,46,0.55)"
          : "1.5px solid rgba(154,92,46,0.18)",
        background: inCart
          ? "linear-gradient(180deg, rgba(255,248,235,0.98) 0%, rgba(248,235,215,0.96) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(252,248,242,0.92) 100%)",
        boxShadow: inCart
          ? "0 10px 34px rgba(111,67,31,0.14), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 6px 28px rgba(111,67,31,0.07), inset 0 1px 0 rgba(255,255,255,0.8)",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        position: "relative",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
    >
      <div
        className="card-glow"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "22px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,150,92,0.16) 0%, transparent 72%)",
          opacity: 0,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <style>{`
        .product-card:hover .card-glow { opacity: 1 !important; }
        .product-card:hover {
        border-color: rgba(154,92,46,0.42) !important;
        box-shadow: 0 12px 40px rgba(111,67,31,0.14), 0 0 0 1px rgba(154,92,46,0.1), inset 0 1px 0 rgba(255,255,255,0.9) !important;
        transform: translateY(-2px);
        }
      `}</style>

      {product.popular ? (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "20px",
            background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "700",
            padding: "3px 12px",
            borderRadius: "20px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            zIndex: 2,
          }}
        >
          Popular
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            background: "rgba(154,92,46,0.08)",
            border: "1px solid rgba(154,92,46,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {product.icon}
        </div>
        <span
          style={{
            fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#7a4825",
                      background: "rgba(154,92,46,0.1)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      border: "1px solid rgba(154,92,46,0.22)",
          }}
        >
          {product.category}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1b140d",
            margin: "0 0 4px",
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </h3>
        <p
          style={{
            fontSize: "11px",
            color: "#9a5c2e",
            fontWeight: "700",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {product.subtitle}
        </p>
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "rgba(27,20,13,0.70)",
          lineHeight: 1.65,
          margin: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {product.description}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "7px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {product.highlights.map((highlight) => (
          <div
            key={highlight}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <CheckCircle2
              style={{
                width: "13px",
                height: "13px",
                color: "#4ade80",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "rgba(27,20,13,0.72)",
                fontWeight: "500",
              }}
            >
              {highlight}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(154,92,46,0.14)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "rgba(154,92,46,0.06)",
            borderRadius: "12px",
            padding: "10px 10px",
            textAlign: "center",
            border: "1px solid rgba(154,92,46,0.14)",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              color: "rgba(154,92,46,0.7)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 3px",
            }}
          >
            Setup
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#1b140d",
              margin: 0,
            }}
          >
            ${product.setup_fee}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(27,20,13,0.45)",
              margin: 0,
            }}
          >
            one-time
          </p>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(154,92,46,0.06)",
            borderRadius: "12px",
            padding: "10px 10px",
            textAlign: "center",
            border: "1px solid rgba(154,92,46,0.14)",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              color: "rgba(154,92,46,0.7)",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 3px",
            }}
          >
            Monthly
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#9a5c2e",
              margin: 0,
            }}
          >
            ${product.monthly_fee}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(27,20,13,0.45)",
              margin: 0,
            }}
          >
            per month
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => setShowDemo(true)}
          style={{
            flex: 1,
            borderRadius: "9999px",
            padding: "2px",
            background: "rgba(100,116,139,0.1)",
            border: "1.5px solid rgba(100,116,139,0.22)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(100,116,139,0.15)";
            e.currentTarget.style.borderColor = "rgba(100,116,139,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(100,116,139,0.1)";
            e.currentTarget.style.borderColor = "rgba(100,116,139,0.22)";
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              height: "44px",
              color: "#64748b",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            <Play style={{ width: "14px", height: "14px" }} /> Watch Demo
          </span>
        </button>

        <button
          onClick={toggle}
          style={{
            flex: 1.2,
            borderRadius: "9999px",
            padding: "2px",
            background: inCart
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            border: "none",
            cursor: "pointer",
            boxShadow: inCart
              ? "0 4px 14px rgba(34,197,94,0.32)"
              : "0 4px 14px rgba(120,70,20,0.28)",
            transition: "all 0.2s",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              height: "44px",
              borderRadius: "9999px",
              background: inCart
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {inCart ? (
              <>
                <Check style={{ width: "14px", height: "14px" }} /> Added to Cart
              </>
            ) : (
              <>
                <Plus style={{ width: "14px", height: "14px" }} /> Add to Cart
              </>
            )}
          </span>
        </button>
      </div>

      {showDemo && (
        <DemoModal product={product} onClose={() => setShowDemo(false)} />
      )}

      {showDetails && (
        <DetailsModal product={product} onClose={() => setShowDetails(false)} />
      )}
    </div>
  );
}