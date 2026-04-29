import { CheckCircle2, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import DemoModal from "@/components/store/DemoModal";
import ProductCardBack from "@/components/store/ProductCardBack";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [showDemo, setShowDemo] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <>
      <style>{`
        .pcard-scene {
          perspective: 1200px;
          height: 360px;
        }
        .pcard-scene.coming-soon { height: 320px; }
        .pcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 1.44s cubic-bezier(0.34, 1.10, 0.64, 1);
          will-change: transform;
        }
        .pcard-inner.is-flipped { transform: rotateY(180deg); }
        .pcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          overflow: hidden;
        }
        .pcard-back { transform: rotateY(180deg); }

        .light-card {
          height: 100%;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          position: relative;
          border-radius: 20px;
          background: rgba(255,255,255,0.92);
          border: 1.5px solid rgba(154,92,46,0.14);
          box-shadow: 0 4px 18px rgba(111,67,31,0.08);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          overflow: hidden;
        }
        .light-card:hover {
          border-color: rgba(154,92,46,0.35);
          box-shadow: 0 12px 36px rgba(111,67,31,0.14);
          transform: translateY(-2px);
        }
        .light-card.in-cart {
          border-color: rgba(34,197,94,0.4);
          box-shadow: 0 8px 28px rgba(34,197,94,0.1);
        }
        .light-card.coming-soon-card {
          background: rgba(250,248,245,0.8);
          border-color: rgba(154,92,46,0.08);
        }

        .price-chip {
          background: linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.05) 100%);
          border: 1.5px solid rgba(154,92,46,0.18);
          border-radius: 12px;
          padding: 7px 12px;
        }

        .flip-hint {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 8px;
          font-weight: 700;
          color: rgba(154,92,46,0.35);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .pcard-scene:hover .flip-hint { opacity: 1; }
      `}</style>

      <div
        className={`pcard-scene${product.coming_soon ? " coming-soon" : ""}`}
        onMouseEnter={() => !product.coming_soon && setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <div className={`pcard-inner${flipped ? " is-flipped" : ""}`}>

          {/* ── FRONT FACE ── */}
          <div className="pcard-face">
            <div className={`light-card${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-card" : ""}`}>
              <span className="flip-hint">flip to see how it works →</span>

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
                  fontSize: "8px", fontWeight: "800", textTransform: "uppercase",
                  letterSpacing: "0.16em",
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
                    <span style={{ fontSize: "11px", color: product.coming_soon ? "rgba(27,20,13,0.3)" : "rgba(27,20,13,0.6)", fontWeight: "500" }}>
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price chip + CTA */}
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
                    background: product.coming_soon
                      ? "rgba(154,92,46,0.15)"
                      : inCart
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: product.coming_soon ? "not-allowed" : "pointer",
                    boxShadow: inCart ? "0 4px 16px rgba(34,197,94,0.3)" : product.coming_soon ? "none" : "0 4px 14px rgba(120,70,20,0.28)",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                    height: "30px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "9999px",
                    background: product.coming_soon
                      ? "rgba(200,180,160,0.5)"
                      : inCart
                      ? "linear-gradient(135deg,#16a34a,#15803d)"
                      : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                    color: product.coming_soon ? "rgba(154,92,46,0.5)" : "#fff",
                    fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap",
                  }}>
                    {product.coming_soon ? "Coming Soon" : inCart
                      ? <><Check style={{ width: "11px", height: "11px" }} /> Added</>
                      : <><Plus style={{ width: "11px", height: "11px" }} /> Add</>}
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
          </div>

          {/* ── BACK FACE ── */}
          {!product.coming_soon && (
            <div className="pcard-face pcard-back">
              <ProductCardBack product={product} inCart={inCart} onToggle={toggle} />
            </div>
          )}
        </div>
      </div>

      {showDemo && <DemoModal product={product} onClose={() => setShowDemo(false)} />}
    </>
  );
}