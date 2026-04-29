import { CheckCircle2, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import ServiceDetailModal from "@/components/store/ServiceDetailModal";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = (e) => {
    e.stopPropagation();
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <>
      <style>{`
        .pcard {
          position: relative;
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(255,255,255,0.93);
          border: 1.5px solid rgba(154,92,46,0.14);
          box-shadow: 0 4px 18px rgba(111,67,31,0.07);
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          height: 340px;
          overflow: hidden;
        }
        .pcard:hover {
          border-color: rgba(154,92,46,0.32);
          box-shadow: 0 14px 40px rgba(111,67,31,0.13);
          transform: translateY(-3px);
        }
        .pcard.in-cart {
          border-color: rgba(34,197,94,0.38);
          box-shadow: 0 8px 28px rgba(34,197,94,0.1);
        }
        .pcard.coming-soon-card {
          cursor: default;
          opacity: 0.62;
        }
        .pcard-click-hint {
          position: absolute;
          bottom: 12px;
          right: 14px;
          font-size: 9px;
          font-weight: 700;
          color: rgba(154,92,46,0.35);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .pcard:hover .pcard-click-hint { opacity: 1; }
        .price-chip-light {
          background: linear-gradient(135deg, rgba(154,92,46,0.07), rgba(200,150,92,0.04));
          border: 1.5px solid rgba(154,92,46,0.18);
          border-radius: 14px;
          padding: 8px 14px;
        }
      `}</style>

      <div
        className={`pcard${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-card" : ""}`}
        onClick={() => !product.coming_soon && setModalOpen(true)}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
            background: "rgba(154,92,46,0.08)",
            border: "1px solid rgba(154,92,46,0.16)",
          }}>
            {product.icon}
          </div>
          <span style={{
            fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
            color: "rgba(154,92,46,0.7)", background: "rgba(154,92,46,0.07)",
            padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(154,92,46,0.14)",
          }}>
            {product.category}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1b140d", margin: "0 0 3px", lineHeight: 1.2 }}>
            {product.name}
          </h3>
          <p style={{ fontSize: "9px", color: "rgba(154,92,46,0.65)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {product.subtitle}
          </p>
        </div>

        {/* Description */}
        <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.62)", lineHeight: 1.65, margin: 0, flex: 1 }}>
          {product.description}
        </p>

        {/* Highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {product.highlights.slice(0, 3).map((h) => (
            <div key={h} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <CheckCircle2 style={{ width: "11px", height: "11px", color: "#22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "rgba(27,20,13,0.58)", fontWeight: "500" }}>{h}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10px", marginTop: "auto" }}>
          <div className="price-chip-light">
            <p style={{ fontSize: "7px", color: "rgba(154,92,46,0.5)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>monthly</p>
            <p style={{ fontSize: "22px", fontWeight: "900", color: "#9a5c2e", margin: 0, lineHeight: 1 }}>${product.monthly_fee}</p>
            <p style={{ fontSize: "8px", color: "rgba(154,92,46,0.45)", margin: "2px 0 0", fontWeight: "600" }}>+${product.setup_fee} setup</p>
          </div>

          {!product.coming_soon && (
            <button
              onClick={toggle}
              style={{
                borderRadius: "9999px", padding: "2px",
                background: inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                border: "none", cursor: "pointer",
                boxShadow: inCart ? "0 4px 14px rgba(34,197,94,0.3)" : "0 4px 14px rgba(120,70,20,0.28)",
                transition: "all 0.2s",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                height: "30px", paddingLeft: "14px", paddingRight: "14px", borderRadius: "9999px",
                background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#fff", fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap",
              }}>
                {inCart ? <><Check style={{ width: "11px", height: "11px" }} /> Added</> : <><Plus style={{ width: "11px", height: "11px" }} /> Add</>}
              </span>
            </button>
          )}

          {product.coming_soon && (
            <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.4)", background: "rgba(154,92,46,0.06)", padding: "6px 14px", borderRadius: "9999px", border: "1px solid rgba(154,92,46,0.12)" }}>
              Coming Soon
            </span>
          )}
        </div>

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

        {!product.coming_soon && <span className="pcard-click-hint">tap for details →</span>}
      </div>

      {modalOpen && (
        <ServiceDetailModal
          product={product}
          inCart={inCart}
          onToggle={() => { if (inCart) removeItem(product.product_id); else addItem(product); }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}