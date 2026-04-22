import { CheckCircle2, Plus, Check } from "lucide-react";
import { useCart } from "@/lib/cartContext";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((i) => i.product_id === product.product_id);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <div
      style={{
        borderRadius: "20px",
        border: inCart ? "2px solid rgba(154,92,46,0.6)" : "1.5px solid rgba(154,92,46,0.15)",
        background: inCart
          ? "linear-gradient(135deg, rgba(255,248,235,0.95) 0%, rgba(252,238,210,0.9) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(252,248,242,0.85) 100%)",
        boxShadow: inCart
          ? "0 8px 32px rgba(154,92,46,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        position: "relative",
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      {product.popular && (
        <div style={{ position: "absolute", top: "-10px", left: "20px", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 12px", borderRadius: "20px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Popular
        </div>
      )}

      {/* Icon + category */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "28px", lineHeight: 1 }}>{product.icon}</div>
        <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(154,92,46,0.7)", background: "rgba(154,92,46,0.08)", padding: "3px 9px", borderRadius: "20px", border: "1px solid rgba(154,92,46,0.15)" }}>
          {product.category}
        </span>
      </div>

      {/* Name */}
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1a1209", margin: "0 0 2px", lineHeight: 1.2 }}>{product.name}</h3>
        <p style={{ fontSize: "11px", color: "rgba(154,92,46,0.7)", fontWeight: "600", margin: 0 }}>{product.subtitle}</p>
      </div>

      <p style={{ fontSize: "12.5px", color: "rgba(26,18,9,0.6)", lineHeight: 1.6, margin: 0 }}>{product.description}</p>

      {/* Highlights */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {product.highlights.map((h) => (
          <div key={h} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <CheckCircle2 style={{ width: "12px", height: "12px", color: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: "11.5px", color: "rgba(26,18,9,0.65)", fontWeight: "500" }}>{h}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "8px", borderTop: "1px solid rgba(154,92,46,0.1)" }}>
        <div style={{ flex: 1, background: "rgba(154,92,46,0.06)", borderRadius: "10px", padding: "8px 10px", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: "rgba(26,18,9,0.4)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Setup</p>
          <p style={{ fontSize: "17px", fontWeight: "800", color: "#1a1209", margin: 0 }}>${product.setup_fee}</p>
          <p style={{ fontSize: "9px", color: "rgba(26,18,9,0.35)", margin: 0 }}>one-time</p>
        </div>
        <div style={{ flex: 1, background: "rgba(154,92,46,0.06)", borderRadius: "10px", padding: "8px 10px", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: "rgba(26,18,9,0.4)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Monthly</p>
          <p style={{ fontSize: "17px", fontWeight: "800", color: "#9a5c2e", margin: 0 }}>${product.monthly_fee}</p>
          <p style={{ fontSize: "9px", color: "rgba(26,18,9,0.35)", margin: 0 }}>per month</p>
        </div>
      </div>

      {/* Add/Remove button */}
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
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "42px", borderRadius: "9999px", background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#fff", fontWeight: "700", fontSize: "13px" }}>
          {inCart ? <><Check style={{ width: "14px", height: "14px" }} /> Added to Cart</> : <><Plus style={{ width: "14px", height: "14px" }} /> Add to Cart</>}
        </span>
      </button>
    </div>
  );
}