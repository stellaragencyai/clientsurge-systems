import { CheckCircle2, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import DemoModal from "@/components/store/DemoModal";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [hovered, setHovered] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  const isRevealed = hovered && !product.coming_soon;

  return (
    <>
      <style>{`
        .pcard-wrap {
          position: relative;
          height: 360px;
          border-radius: 20px;
          overflow: hidden;
          cursor: default;
        }
        .pcard-wrap.coming-soon { height: 320px; }

        /* ── Base card ── */
        .pcard-front {
          position: absolute;
          inset: 0;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          border-radius: 20px;
          background: rgba(255,255,255,0.92);
          border: 1.5px solid rgba(154,92,46,0.14);
          box-shadow: 0 4px 18px rgba(111,67,31,0.08);
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }
        .pcard-wrap:hover .pcard-front {
          border-color: rgba(154,92,46,0.32);
          box-shadow: 0 10px 40px rgba(111,67,31,0.14);
        }
        .pcard-front.in-cart {
          border-color: rgba(34,197,94,0.4);
          box-shadow: 0 8px 28px rgba(34,197,94,0.1);
        }

        /* ── Cinematic reveal panel ── */
        .pcard-reveal {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          border-radius: 20px;
          background: linear-gradient(160deg, rgba(255,252,248,0.99) 0%, rgba(255,246,236,0.99) 100%);
          border-top: 2px solid rgba(154,92,46,0.2);
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transform: translateY(100%);
          opacity: 0;
          transition:
            transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.45s ease;
          will-change: transform, opacity;
          box-shadow: 0 -4px 32px rgba(111,67,31,0.14);
          z-index: 10;
        }
        .pcard-wrap:hover .pcard-reveal {
          transform: translateY(0%);
          opacity: 1;
        }

        /* Stagger each step row */
        .pcard-reveal .step-row {
          opacity: 0;
          transform: translateY(10px);
          transition:
            opacity 0.4s ease,
            transform 0.4s ease;
        }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(1) { opacity: 1; transform: none; transition-delay: 0.18s; }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(2) { opacity: 1; transform: none; transition-delay: 0.26s; }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(3) { opacity: 1; transform: none; transition-delay: 0.34s; }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(4) { opacity: 1; transform: none; transition-delay: 0.42s; }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(5) { opacity: 1; transform: none; transition-delay: 0.50s; }
        .pcard-wrap:hover .pcard-reveal .step-row:nth-child(6) { opacity: 1; transform: none; transition-delay: 0.56s; }

        .pcard-reveal .reveal-cta {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.35s ease 0.55s, transform 0.35s ease 0.55s;
        }
        .pcard-wrap:hover .pcard-reveal .reveal-cta {
          opacity: 1;
          transform: none;
        }

        /* price chip */
        .price-chip {
          background: linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.05) 100%);
          border: 1.5px solid rgba(154,92,46,0.18);
          border-radius: 12px;
          padding: 7px 12px;
        }

        /* Subtle top shimmer bar on hover */
        .pcard-shimmer {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 20px 20px 0 0;
          background: linear-gradient(90deg, transparent 0%, #c8965c 40%, #f5d9a8 60%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .pcard-wrap:hover .pcard-shimmer { opacity: 1; }
      `}</style>

      <div
        className={`pcard-wrap${product.coming_soon ? " coming-soon" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Shimmer bar */}
        <div className="pcard-shimmer" />

        {/* ── FRONT ── */}
        <div className={`pcard-front${inCart ? " in-cart" : ""}`}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{
              width: "46px", height: "46px", borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
              background: product.coming_soon ? "rgba(200,190,180,0.2)" : "rgba(154,92,46,0.08)",
              border: `1px solid ${product.coming_soon ? "rgba(154,92,46,0.08)" : "rgba(154,92,46,0.18)"}`,
              filter: product.coming_soon ? "grayscale(60%) opacity(0.5)" : "none",
            }}>
              {product.icon}
            </div>
            <span style={{
              fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
              color: product.coming_soon ? "rgba(154,92,46,0.3)" : "rgba(154,92,46,0.7)",
              background: product.coming_soon ? "rgba(154,92,46,0.04)" : "rgba(154,92,46,0.07)",
              padding: "4px 10px", borderRadius: "999px",
              border: `1px solid ${product.coming_soon ? "rgba(154,92,46,0.08)" : "rgba(154,92,46,0.14)"}`,
            }}>
              {product.category}
            </span>
          </div>

          {/* Title */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: product.coming_soon ? "rgba(27,20,13,0.3)" : "#1b140d", margin: "0 0 2px", lineHeight: 1.2 }}>
              {product.name}
            </h3>
            <p style={{ fontSize: "9px", color: product.coming_soon ? "rgba(154,92,46,0.3)" : "rgba(154,92,46,0.7)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {product.subtitle}
            </p>
          </div>

          {/* Description */}
          <p style={{ fontSize: "12px", color: product.coming_soon ? "rgba(27,20,13,0.3)" : "rgba(27,20,13,0.65)", lineHeight: 1.6, margin: 0, flex: 1 }}>
            {product.description}
          </p>

          {/* Highlights */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {product.highlights.map((h) => (
              <div key={h} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <CheckCircle2 style={{ width: "11px", height: "11px", color: product.coming_soon ? "rgba(154,92,46,0.2)" : "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: product.coming_soon ? "rgba(27,20,13,0.3)" : "rgba(27,20,13,0.6)", fontWeight: "500" }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", marginTop: "auto" }}>
            <div className="price-chip" style={{ opacity: product.coming_soon ? 0.4 : 1 }}>
              <p style={{ fontSize: "7px", color: "rgba(154,92,46,0.55)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>$/mo</p>
              <p style={{ fontSize: "22px", fontWeight: "900", color: "#9a5c2e", margin: 0, lineHeight: 1 }}>${product.monthly_fee}</p>
              <p style={{ fontSize: "8px", color: "rgba(154,92,46,0.5)", margin: "2px 0 0", fontWeight: "600" }}>+${product.setup_fee} setup</p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              disabled={product.coming_soon}
              style={{
                borderRadius: "9999px", padding: "2px",
                background: product.coming_soon ? "rgba(154,92,46,0.15)" : inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                border: "none", cursor: product.coming_soon ? "not-allowed" : "pointer",
                boxShadow: inCart ? "0 4px 16px rgba(34,197,94,0.3)" : product.coming_soon ? "none" : "0 4px 14px rgba(120,70,20,0.28)",
                transition: "all 0.2s",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                height: "30px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "9999px",
                background: product.coming_soon ? "rgba(200,180,160,0.5)" : inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: product.coming_soon ? "rgba(154,92,46,0.5)" : "#fff",
                fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap",
              }}>
                {product.coming_soon ? "Coming Soon" : inCart ? <><Check style={{ width: "11px", height: "11px" }} /> Added</> : <><Plus style={{ width: "11px", height: "11px" }} /> Add</>}
              </span>
            </button>
          </div>

          {/* Popular badge */}
          {product.popular && !product.coming_soon && (
            <div style={{
              position: "absolute", top: "12px", right: "12px",
              background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
              color: "#fff", fontSize: "8px", fontWeight: "700",
              padding: "4px 10px", borderRadius: "18px",
              letterSpacing: "0.08em", textTransform: "uppercase",
              boxShadow: "0 2px 8px rgba(120,70,20,0.3)",
            }}>
              Popular
            </div>
          )}
        </div>

        {/* ── CINEMATIC REVEAL OVERLAY ── */}
        {!product.coming_soon && (
          <div className="pcard-reveal">
            {/* Accent bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #c8965c 40%, #f5d9a8 60%, transparent)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "18px" }}>{product.icon}</span>
              <div>
                <p style={{ fontSize: "7px", fontWeight: "800", color: "rgba(154,92,46,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", margin: 0 }}>How It Works</p>
                <p style={{ fontSize: "12px", fontWeight: "700", color: "#1b140d", margin: 0 }}>{product.name}</p>
              </div>
            </div>

            {product.highlights.map((step, i) => (
              <div key={i} className="step-row" style={{
                display: "flex", alignItems: "flex-start", gap: "9px",
                padding: "7px 10px", borderRadius: "9px",
                background: "rgba(154,92,46,0.04)",
                border: "1px solid rgba(154,92,46,0.09)",
              }}>
                <div style={{
                  width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                  background: "linear-gradient(135deg,#9a5c2e,#7a4825)",
                  color: "#fff", fontSize: "8px", fontWeight: "900",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.68)", fontWeight: "500", margin: 0, lineHeight: 1.45 }}>{step}</p>
              </div>
            ))}

            <button
              className="reveal-cta"
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              style={{
                borderRadius: "9999px", padding: "2px",
                background: inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                border: "none", cursor: "pointer", width: "100%", marginTop: "2px",
                boxShadow: inCart ? "0 4px 14px rgba(34,197,94,0.3)" : "0 4px 14px rgba(120,70,20,0.28)",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                height: "32px", borderRadius: "9999px",
                background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#fff", fontWeight: "700", fontSize: "11px",
              }}>
                {inCart ? <><Check style={{ width: "11px", height: "11px" }} /> In Cart</> : <><Plus style={{ width: "11px", height: "11px" }} /> Add — ${product.monthly_fee}/mo</>}
              </span>
            </button>
          </div>
        )}
      </div>

      {showDemo && <DemoModal product={product} onClose={() => setShowDemo(false)} />}
    </>
  );
}