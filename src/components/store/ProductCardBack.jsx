import { Check, Plus } from "lucide-react";

export default function ProductCardBack({ product, inCart, onToggle }) {
  const steps = product.highlights || [];

  return (
    <div
      style={{
        height: "100%",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        borderRadius: "18px",
        background: "#ffffff",
        border: "1.5px solid rgba(0,0,0,0.12)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            background: "rgba(154,92,46,0.07)",
            border: "1px solid rgba(154,92,46,0.14)",
            flexShrink: 0,
          }}
        >
          {product.icon}
        </div>
        <div>
          <p style={{ fontSize: "9px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            How It Works
          </p>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1b140d", margin: 0, lineHeight: 1.2 }}>
            {product.name}
          </h3>
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "10px",
              background: "rgba(154,92,46,0.04)",
              border: "1px solid rgba(154,92,46,0.1)",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.72)", fontWeight: "500", margin: 0, lineHeight: 1.5 }}>
              {step}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          borderRadius: "9999px",
          padding: "2px",
          background: inCart
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
          border: "none",
          cursor: "pointer",
          width: "100%",
          boxShadow: inCart ? "0 4px 14px rgba(34,197,94,0.32)" : "0 4px 14px rgba(120,70,20,0.28)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            height: "34px",
            borderRadius: "9999px",
            background: inCart
              ? "linear-gradient(135deg,#16a34a,#15803d)"
              : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#fff",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          {inCart
            ? <><Check style={{ width: "12px", height: "12px" }} /> In Cart</>
            : <><Plus style={{ width: "12px", height: "12px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
        </span>
      </button>
    </div>
  );
}