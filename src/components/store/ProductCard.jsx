import { CheckCircle2, Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cartContext";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <div
      style={{
        borderRadius: "20px",
        border: inCart ? "2px solid rgba(240,200,120,0.55)" : "1.5px solid rgba(200,150,92,0.25)",
        background: inCart
          ? "rgba(154,92,46,0.22)"
          : "rgba(255,255,255,0.07)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: inCart
          ? "0 8px 36px rgba(154,92,46,0.28), inset 0 1px 0 rgba(255,255,255,0.15)"
          : "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
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
          }}
        >
          Popular
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "28px", lineHeight: 1 }}>{product.icon}</div>
        <span
          style={{
            fontSize: "9px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#f0c878",
            background: "rgba(200,150,92,0.18)",
            padding: "3px 9px",
            borderRadius: "20px",
            border: "1px solid rgba(200,150,92,0.35)",
          }}
        >
          {product.category}
        </span>
      </div>

      <div>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#fff",
            margin: "0 0 2px",
            lineHeight: 1.2,
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          {product.name}
        </h3>
        <p style={{ fontSize: "11px", color: "rgba(240,200,120,0.85)", fontWeight: "600", margin: 0 }}>
          {product.subtitle}
        </p>
      </div>

      <p style={{ fontSize: "12.5px", color: "rgba(255,225,175,0.72)", lineHeight: 1.6, margin: 0 }}>
        {product.description}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {product.highlights.map((highlight) => (
          <div key={highlight} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <CheckCircle2 style={{ width: "12px", height: "12px", color: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: "11.5px", color: "rgba(255,220,170,0.8)", fontWeight: "500" }}>
              {highlight}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", paddingTop: "8px", borderTop: "1px solid rgba(200,150,92,0.2)" }}>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "8px 10px",
            textAlign: "center",
            border: "1px solid rgba(200,150,92,0.18)",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              color: "rgba(240,200,120,0.6)",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 2px",
            }}
          >
            Setup
          </p>
          <p style={{ fontSize: "17px", fontWeight: "800", color: "#fff", margin: 0 }}>
            ${product.setup_fee}
          </p>
          <p style={{ fontSize: "9px", color: "rgba(255,200,120,0.45)", margin: 0 }}>one-time</p>
        </div>
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "8px 10px",
            textAlign: "center",
            border: "1px solid rgba(200,150,92,0.18)",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              color: "rgba(240,200,120,0.6)",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 2px",
            }}
          >
            Monthly
          </p>
          <p style={{ fontSize: "17px", fontWeight: "800", color: "#f0c878", margin: 0 }}>
            ${product.monthly_fee}
          </p>
          <p style={{ fontSize: "9px", color: "rgba(255,200,120,0.45)", margin: 0 }}>per month</p>
        </div>
      </div>

      <button
        onClick={toggle}
        style={{
          borderRadius: "9999px",
          padding: "2px",
          background: inCart
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
          border: "none",
          cursor: "pointer",
          boxShadow: inCart ? "0 4px 14px rgba(34,197,94,0.35)" : "0 4px 14px rgba(120,70,20,0.3)",
          transition: "all 0.2s",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            height: "42px",
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
  );
}