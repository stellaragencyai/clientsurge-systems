import { CheckCircle2, Plus, Check } from "lucide-react";
import { useState, useRef } from "react";
import { useCart } from "@/lib/cartContext";
import DemoModal from "@/components/store/DemoModal";
import ProductCardBack from "@/components/store/ProductCardBack";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [showDemo, setShowDemo] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  // Holographic shimmer follows mouse
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mx", `${x}%`);
    cardRef.current.style.setProperty("--my", `${y}%`);
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

        /* ── Dark glass card ── */
        .dark-glass-card {
          height: 100%;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          position: relative;
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(18,12,6,0.92) 0%, rgba(28,18,10,0.94) 100%);
          border: 1px solid rgba(200,150,92,0.22);
          box-shadow:
            0 4px 24px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
          overflow: hidden;
        }
        .dark-glass-card:hover {
          border-color: rgba(200,150,92,0.55);
          box-shadow:
            0 16px 48px rgba(0,0,0,0.6),
            0 0 0 1px rgba(200,150,92,0.2),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateY(-3px);
        }
        .dark-glass-card.in-cart {
          border-color: rgba(74,222,128,0.45);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.5),
            0 0 20px rgba(34,197,94,0.12),
            inset 0 1px 0 rgba(134,239,172,0.12);
        }
        .dark-glass-card.coming-soon-dark {
          background: linear-gradient(145deg, rgba(14,12,10,0.8) 0%, rgba(20,16,12,0.85) 100%);
          border-color: rgba(100,80,60,0.15);
        }

        /* Holographic shimmer layer */
        .holo-shimmer {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: radial-gradient(
            circle at var(--mx, 50%) var(--my, 50%),
            rgba(200,150,92,0.18) 0%,
            rgba(100,180,255,0.08) 30%,
            transparent 65%
          );
          mix-blend-mode: screen;
        }
        .dark-glass-card:hover .holo-shimmer { opacity: 1; }

        /* Scanning top line */
        .scan-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #c8965c 40%, #f5d9a8 60%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .dark-glass-card:hover .scan-line { opacity: 1; }

        /* Price chip — data readout style */
        .price-chip-dark {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(200,150,92,0.3);
          border-radius: 12px;
          padding: 7px 12px;
          font-family: 'Space Grotesk', monospace;
          box-shadow: 0 0 12px rgba(200,150,92,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .flip-hint-dark {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 8px;
          font-weight: 700;
          color: rgba(200,150,92,0.4);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .pcard-scene:hover .flip-hint-dark { opacity: 1; }
      `}</style>

      <div
        className={`pcard-scene${product.coming_soon ? " coming-soon" : ""}`}
        onMouseEnter={() => !product.coming_soon && setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <div className={`pcard-inner${flipped ? " is-flipped" : ""}`}>

          {/* ── FRONT FACE ── */}
          <div className="pcard-face">
            <div
              ref={cardRef}
              className={`dark-glass-card${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-dark" : ""}`}
              onMouseMove={handleMouseMove}
            >
              <div className="holo-shimmer" />
              <div className="scan-line" />
              <span className="flip-hint-dark">flip to see how it works →</span>

              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
                  background: product.coming_soon ? "rgba(60,50,40,0.4)" : "rgba(200,150,92,0.1)",
                  border: `1px solid ${product.coming_soon ? "rgba(100,80,60,0.2)" : "rgba(200,150,92,0.25)"}`,
                  boxShadow: product.coming_soon ? "none" : "0 0 16px rgba(200,150,92,0.12)",
                  filter: product.coming_soon ? "grayscale(70%) brightness(0.6)" : "none",
                }}>
                  {product.icon}
                </div>
                <span style={{
                  fontSize: "8px", fontWeight: "800", textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: product.coming_soon ? "rgba(120,100,80,0.5)" : "rgba(200,150,92,0.75)",
                  background: product.coming_soon ? "rgba(40,30,20,0.4)" : "rgba(200,150,92,0.08)",
                  padding: "4px 10px", borderRadius: "999px",
                  border: `1px solid ${product.coming_soon ? "rgba(80,60,40,0.2)" : "rgba(200,150,92,0.2)"}`,
                }}>
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: product.coming_soon ? "rgba(180,150,110,0.35)" : "rgba(245,230,208,0.95)", margin: "0 0 2px", lineHeight: 1.2 }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: "9px", color: product.coming_soon ? "rgba(154,92,46,0.3)" : "rgba(200,150,92,0.7)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {product.subtitle}
                </p>
              </div>

              {/* Description */}
              <p style={{ fontSize: "12px", color: product.coming_soon ? "rgba(180,160,130,0.3)" : "rgba(220,195,160,0.72)", lineHeight: 1.6, margin: 0, flex: 1 }}>
                {product.description}
              </p>

              {/* Highlights */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {product.highlights.map((h) => (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 style={{ width: "11px", height: "11px", color: product.coming_soon ? "rgba(80,70,60,0.4)" : "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: product.coming_soon ? "rgba(140,120,90,0.35)" : "rgba(220,195,160,0.65)", fontWeight: "500" }}>
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price chip + CTA */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", marginTop: "auto" }}>
                <div className="price-chip-dark" style={{ opacity: product.coming_soon ? 0.4 : 1 }}>
                  <p style={{ fontSize: "7px", color: "rgba(200,150,92,0.6)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0, fontFamily: "monospace" }}>$/mo</p>
                  <p style={{ fontSize: "22px", fontWeight: "900", color: "#c8965c", margin: 0, lineHeight: 1, fontFamily: "'Space Grotesk', monospace", textShadow: "0 0 14px rgba(200,150,92,0.4)" }}>${product.monthly_fee}</p>
                  <p style={{ fontSize: "8px", color: "rgba(200,150,92,0.45)", margin: "2px 0 0", fontWeight: "600", fontFamily: "monospace" }}>+${product.setup_fee} setup</p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggle(); }}
                  disabled={product.coming_soon}
                  style={{
                    borderRadius: "9999px", padding: "2px",
                    background: product.coming_soon
                      ? "rgba(80,60,40,0.3)"
                      : inCart
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: product.coming_soon ? "not-allowed" : "pointer",
                    boxShadow: inCart ? "0 4px 16px rgba(34,197,94,0.35)" : product.coming_soon ? "none" : "0 4px 16px rgba(200,130,60,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                    height: "30px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "9999px",
                    background: product.coming_soon
                      ? "rgba(60,45,30,0.6)"
                      : inCart
                      ? "linear-gradient(135deg,#16a34a,#15803d)"
                      : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                    color: product.coming_soon ? "rgba(180,150,100,0.4)" : "#fff",
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
                  boxShadow: "0 0 14px rgba(200,130,60,0.45)",
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