import { CheckCircle2, Plus, Check, Play } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import DemoModal from "@/components/store/DemoModal";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [showDemo, setShowDemo] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const toggle = () => {
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  const howItWorks = product.highlights || [];

  return (
    <>
      <style>{`
        .pcard-scene {
          perspective: 1000px;
          height: 340px;
        }
        .pcard-scene.coming-soon {
          height: 320px;
        }
        .pcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pcard-inner.is-flipped {
          transform: rotateY(180deg);
        }
        .pcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 18px;
          overflow: hidden;
        }
        .pcard-back {
          transform: rotateY(180deg);
        }
        .crystal-card {
          background: rgba(255,255,255,0.12);
          border: 1px solid;
          border-image: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(200,150,92,0.2) 50%, rgba(255,255,255,0.08) 100%) 1;
          border-radius: 18px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -1px 0 rgba(0,0,0,0.04),
            0 4px 24px rgba(111,67,31,0.07),
            0 1px 3px rgba(0,0,0,0.05);
          transition: box-shadow 0.4s ease, transform 0.4s ease, background 0.4s ease;
        }
        .crystal-card:hover {
          background: rgba(255,255,255,0.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 12px 40px rgba(111,67,31,0.13),
            0 2px 8px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .crystal-card.in-cart {
          background: rgba(240,253,244,0.25);
          border-image: linear-gradient(135deg, rgba(74,222,128,0.4) 0%, rgba(34,197,94,0.15) 100%) 1;
          box-shadow:
            inset 0 1px 0 rgba(134,239,172,0.4),
            0 8px 28px rgba(34,197,94,0.12);
        }
        .crystal-card.coming-soon-card {
          background: rgba(245,245,245,0.08);
          border-image: linear-gradient(135deg, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 100%) 1;
        }
        .price-chip {
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 14px;
          padding: 8px 14px;
          box-shadow: 0 4px 14px rgba(111,67,31,0.1), inset 0 1px 0 rgba(255,255,255,0.5);
        }
        .flip-hint {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 9px;
          font-weight: 700;
          color: rgba(154,92,46,0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .pcard-scene:hover .flip-hint {
          opacity: 1;
        }
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
              className={`crystal-card${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-card" : ""}`}
              style={{ height: "100%", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}
            >
              <span className="flip-hint">hover to see how it works →</span>

              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    background: product.coming_soon
                      ? "rgba(200,200,200,0.15)"
                      : "rgba(255,255,255,0.3)",
                    border: product.coming_soon
                      ? "1px solid rgba(180,180,180,0.2)"
                      : "1px solid rgba(255,255,255,0.45)",
                    boxShadow: product.coming_soon ? "none" : "0 2px 8px rgba(154,92,46,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                    filter: product.coming_soon ? "grayscale(60%)" : "none",
                    opacity: product.coming_soon ? 0.7 : 1,
                  }}
                >
                  {product.icon}
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: product.coming_soon ? "#999" : "#7a4825",
                    background: product.coming_soon ? "rgba(180,180,180,0.12)" : "rgba(255,255,255,0.3)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: product.coming_soon ? "1px solid rgba(180,180,180,0.2)" : "1px solid rgba(154,92,46,0.18)",
                  }}
                >
                  {product.category}
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: product.coming_soon ? "rgba(27,20,13,0.4)" : "#1b140d", margin: "0 0 2px", lineHeight: 1.2 }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: "10px", color: product.coming_soon ? "rgba(154,92,46,0.4)" : "#9a5c2e", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {product.subtitle}
                </p>
              </div>

              {/* Description */}
              <p style={{ fontSize: "12px", color: product.coming_soon ? "rgba(27,20,13,0.35)" : "rgba(27,20,13,0.68)", lineHeight: 1.6, margin: 0, flex: 1 }}>
                {product.description}
              </p>

              {/* Highlights */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {product.highlights.map((h) => (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 style={{ width: "11px", height: "11px", color: product.coming_soon ? "#ccc" : "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: product.coming_soon ? "rgba(100,100,100,0.45)" : "rgba(27,20,13,0.68)", fontWeight: "500" }}>
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price chip + CTA */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", marginTop: "auto" }}>
                <div className="price-chip" style={{ opacity: product.coming_soon ? 0.55 : 1 }}>
                  <p style={{ fontSize: "7px", color: "rgba(154,92,46,0.7)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Monthly</p>
                  <p style={{ fontSize: "22px", fontWeight: "900", color: "#9a5c2e", margin: 0, lineHeight: 1 }}>${product.monthly_fee}</p>
                  <p style={{ fontSize: "8px", color: "rgba(27,20,13,0.45)", margin: "2px 0 0", fontWeight: "600" }}>Setup ${product.setup_fee}</p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggle(); }}
                  disabled={product.coming_soon}
                  style={{
                    borderRadius: "9999px",
                    padding: "2px",
                    background: product.coming_soon
                      ? "linear-gradient(135deg,#c0c0c0,#b0b0b0)"
                      : inCart
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: product.coming_soon ? "not-allowed" : "pointer",
                    boxShadow: inCart ? "0 4px 14px rgba(34,197,94,0.32)" : product.coming_soon ? "none" : "0 4px 14px rgba(120,70,20,0.28)",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      height: "30px",
                      paddingLeft: "14px",
                      paddingRight: "14px",
                      borderRadius: "9999px",
                      background: product.coming_soon
                        ? "linear-gradient(135deg,#a0a0a0,#909090)"
                        : inCart
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "11px",
                      opacity: product.coming_soon ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.coming_soon ? "Coming Soon" : inCart ? <><Check style={{ width: "11px", height: "11px" }} /> Added</> : <><Plus style={{ width: "11px", height: "11px" }} /> Add</>}
                  </span>
                </button>
              </div>

              {/* Popular badge */}
              {product.popular && !product.coming_soon && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                    color: "#fff",
                    fontSize: "8px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "18px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    boxShadow: "0 2px 8px rgba(111,67,31,0.2)",
                  }}
                >
                  Popular
                </div>
              )}
            </div>
          </div>

          {/* ── BACK FACE — "How It Works" ── */}
          {!product.coming_soon && (
            <div className="pcard-face pcard-back">
              <div
                className="crystal-card"
                style={{
                  height: "100%",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: "rgba(255,255,255,0.18)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "26px" }}>{product.icon}</span>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>How It Works</p>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1b140d", margin: 0 }}>{product.name}</h3>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  {howItWorks.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.25)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
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
                      <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.75)", fontWeight: "500", margin: 0, lineHeight: 1.5 }}>{step}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggle(); }}
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
                      background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "12px",
                    }}
                  >
                    {inCart ? <><Check style={{ width: "12px", height: "12px" }} /> In Cart</> : <><Plus style={{ width: "12px", height: "12px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDemo && <DemoModal product={product} onClose={() => setShowDemo(false)} />}
    </>
  );
}