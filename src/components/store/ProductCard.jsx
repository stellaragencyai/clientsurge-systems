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
        borderRadius: "16px",
        border: inCart
          ? "1px solid rgba(154,92,46,0.3)"
          : product.coming_soon
          ? "1px solid rgba(154,92,46,0.08)"
          : "1px solid rgba(154,92,46,0.12)",
        background: inCart
          ? "linear-gradient(180deg, rgba(255,248,235,0.85) 0%, rgba(248,235,215,0.82) 100%)"
          : product.coming_soon
          ? "linear-gradient(180deg, rgba(242,242,242,0.7) 0%, rgba(235,235,235,0.65) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(252,248,242,0.78) 100%)",
        boxShadow: inCart
          ? "0 6px 20px rgba(111,67,31,0.08)"
          : product.coming_soon
          ? "0 1px 4px rgba(0,0,0,0.02)"
          : "0 2px 8px rgba(111,67,31,0.04)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        transition: "all 0.3s ease",
        overflow: "hidden",
        opacity: product.coming_soon ? 0.6 : 1,
      }}
    >
      <div
        className="card-glow"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "22px",
          background: product.coming_soon
            ? "transparent"
            : "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,150,92,0.16) 0%, transparent 72%)",
          opacity: 0,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <style>{`
        .product-card:hover .card-glow { opacity: 1 !important; }
        .product-card:hover {
        border-color: rgba(154,92,46,0.25) !important;
        box-shadow: 0 8px 24px rgba(111,67,31,0.1) !important;
        transform: translateY(-2px);
        background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(252,248,242,0.88) 100%) !important;
        }
      `}</style>

      {product.popular ? (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "18px",
            background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
            color: "#fff",
            fontSize: "9px",
            fontWeight: "700",
            padding: "4px 10px",
            borderRadius: "18px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            zIndex: 2,
            opacity: 0,
            transform: "scale(0.8)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            pointerEvents: "none",
          }}
          className="popular-badge"
        >
          Popular
        </div>
      ) : null}
      <style>{`
        .product-card:hover .popular-badge {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
      `}</style>

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
            style={{ display: "flex", alignItems: "center", gap: "8px", opacity: product.coming_soon ? 0.5 : 1 }}
          >
            <CheckCircle2
              style={{
                width: "13px",
                height: "13px",
                color: product.coming_soon ? "#b0b0b0" : "#4ade80",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: product.coming_soon ? "rgba(100,100,100,0.65)" : "rgba(27,20,13,0.72)",
                fontWeight: "500",
              }}
            >
              {highlight}
            </span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingTop: "4px", opacity: product.coming_soon ? 0.5 : 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "9px",
                color: product.coming_soon ? "rgba(100,100,100,0.5)" : "rgba(154,92,46,0.7)",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 2px",
              }}
            >
              Monthly
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: product.coming_soon ? "#a0a0a0" : "#9a5c2e",
                margin: 0,
                lineHeight: 1,
              }}
            >
              ${product.monthly_fee}
            </p>
          </div>
          <div style={{ fontSize: "12px", color: product.coming_soon ? "rgba(100,100,100,0.5)" : "rgba(27,20,13,0.5)", lineHeight: 1.4 }}>
            <p style={{ margin: 0, fontWeight: "600" }}>Setup</p>
            <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: "700" }}>${product.setup_fee}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center", position: "relative", zIndex: 1, pointerEvents: product.coming_soon ? "none" : "auto" }}>
        <button
          onClick={() => setShowDemo(true)}
          disabled={product.coming_soon}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            padding: "0",
            background: product.coming_soon ? "rgba(100,100,100,0.08)" : "rgba(100,116,139,0.1)",
            border: product.coming_soon ? "1px solid rgba(100,100,100,0.1)" : "1px solid rgba(100,116,139,0.22)",
            cursor: product.coming_soon ? "not-allowed" : "pointer",
            boxShadow: "none",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: product.coming_soon ? 0.5 : 1,
          }}
          title={product.coming_soon ? "Coming soon" : "Watch demo"}
          onMouseEnter={(e) => {
            if (!product.coming_soon) {
              e.currentTarget.style.background = "rgba(100,116,139,0.15)";
              e.currentTarget.style.borderColor = "rgba(100,116,139,0.35)";
            }
          }}
          onMouseLeave={(e) => {
            if (!product.coming_soon) {
              e.currentTarget.style.background = "rgba(100,116,139,0.1)";
              e.currentTarget.style.borderColor = "rgba(100,116,139,0.22)";
            }
          }}
        >
          <Play style={{ width: "14px", height: "14px", color: product.coming_soon ? "#a0a0a0" : "#64748b" }} />
        </button>

        <button
          onClick={toggle}
          disabled={product.coming_soon}
          style={{
            flex: 1,
            borderRadius: "9999px",
            padding: "2px",
            background: product.coming_soon
              ? "linear-gradient(135deg,#c0c0c0,#b0b0b0)"
              : inCart
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            border: "none",
            cursor: product.coming_soon ? "not-allowed" : "pointer",
            boxShadow: inCart
              ? "0 4px 14px rgba(34,197,94,0.32)"
              : product.coming_soon
              ? "none"
              : "0 4px 14px rgba(120,70,20,0.28)",
            transition: "all 0.2s",
            opacity: product.coming_soon ? 0.6 : 1,
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
              background: product.coming_soon
                ? "linear-gradient(135deg,#a0a0a0,#909090)"
                : inCart
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {product.coming_soon ? (
              "Coming Soon"
            ) : inCart ? (
              <>
                <Check style={{ width: "14px", height: "14px" }} /> Added
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