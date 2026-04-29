import { Check, Plus } from "lucide-react";

export default function ProductCardBack({ product, inCart, onToggle }) {
  const steps = product.highlights || [];

  return (
    <>
      <style>{`
        @keyframes shimmer-bg {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .pcard-back-shell {
          height: 100%;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 18px;
          border: 1.5px solid rgba(154,92,46,0.22);
          background: linear-gradient(
            135deg,
            #fff8f0 0%,
            #fff3e6 25%,
            #fdf6ee 50%,
            #fff0e0 75%,
            #fff8f0 100%
          );
          background-size: 300% 300%;
          animation: shimmer-bg 6s ease infinite;
          box-shadow:
            0 2px 12px rgba(154,92,46,0.08),
            inset 0 1px 0 rgba(255,255,255,0.8);
        }
      `}</style>

      <div className="pcard-back-shell">
        {/* Header */}
        <div className="pcard-back-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "26px" }}>{product.icon}</span>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
              How It Works
            </p>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1b140d", margin: 0 }}>
              {product.name}
            </h3>
          </div>
        </div>

        {/* Steps */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="pcard-back-step"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(154,92,46,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(154,92,46,0.3)",
                }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.75)", fontWeight: "500", margin: 0, lineHeight: 1.5 }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="pcard-back-cta"
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
              height: "36px",
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
    </>
  );
}