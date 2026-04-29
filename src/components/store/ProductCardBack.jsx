import { Check, Plus } from "lucide-react";

export default function ProductCardBack({ product, inCart, onToggle }) {
  const steps = product.highlights || [];

  return (
    <div style={{
      height: "100%", padding: "18px",
      display: "flex", flexDirection: "column", gap: "12px",
      borderRadius: "20px",
      background: "linear-gradient(145deg, rgba(16,10,4,0.96) 0%, rgba(24,16,8,0.98) 100%)",
      border: "1px solid rgba(200,150,92,0.28)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        pointerEvents: "none", position: "absolute", inset: 0, borderRadius: "20px", opacity: 0.04,
        backgroundImage: "linear-gradient(rgba(200,150,92,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,92,1) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
          background: "rgba(200,150,92,0.1)", border: "1px solid rgba(200,150,92,0.22)",
          boxShadow: "0 0 12px rgba(200,150,92,0.1)",
        }}>
          {product.icon}
        </div>
        <div>
          <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(200,150,92,0.65)", textTransform: "uppercase", letterSpacing: "0.18em", margin: 0 }}>
            // HOW IT WORKS
          </p>
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "rgba(245,225,195,0.92)", margin: 0, lineHeight: 1.2 }}>
            {product.name}
          </h3>
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px", position: "relative" }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "8px 11px", borderRadius: "10px",
            background: "rgba(200,150,92,0.05)",
            border: "1px solid rgba(200,150,92,0.12)",
          }}>
            <div style={{
              width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0,
              background: "rgba(200,150,92,0.15)", border: "1px solid rgba(200,150,92,0.3)",
              color: "#c8965c", fontSize: "9px", fontWeight: "900",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "monospace",
            }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <p style={{ fontSize: "11px", color: "rgba(220,190,150,0.75)", fontWeight: "500", margin: 0, lineHeight: 1.5 }}>
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          borderRadius: "9999px", padding: "2px",
          background: inCart
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
          border: "none", cursor: "pointer", width: "100%",
          boxShadow: inCart ? "0 4px 16px rgba(34,197,94,0.35)" : "0 4px 16px rgba(200,130,60,0.4)",
          position: "relative",
        }}
      >
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          height: "34px", borderRadius: "9999px",
          background: inCart
            ? "linear-gradient(135deg,#16a34a,#15803d)"
            : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
          color: "#fff", fontWeight: "700", fontSize: "12px",
        }}>
          {inCart
            ? <><Check style={{ width: "12px", height: "12px" }} /> In Cart</>
            : <><Plus style={{ width: "12px", height: "12px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
        </span>
      </button>
    </div>
  );
}