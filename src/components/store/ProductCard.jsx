import { CheckCircle2, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import ServiceDetailModal from "@/components/store/ServiceDetailModal";
import { motion } from "framer-motion";

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggle = (e) => {
    e.stopPropagation();
    // Coming soon products cannot be added to cart
    if (product.coming_soon || !product.checkout_enabled) return;
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
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
          border: 2px solid rgba(0,0,0,0.85);
          box-shadow: 0 4px 18px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3);
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease, height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          min-height: 340px;
          overflow: visible;
        }
        .pcard:hover {
          border-color: rgba(0,0,0,1);
          box-shadow: 0 8px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4);
          transform: translateY(-3px);
        }
        .pcard.in-cart {
          border-color: #22c55e;
          box-shadow: 0 8px 28px rgba(34,197,94,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
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
        .highlight-pills {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .highlight-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(154,92,46,0.08), rgba(200,150,92,0.04));
          border: 1px solid rgba(154,92,46,0.15);
          font-size: 10px;
          font-weight: 600;
          color: rgba(27,20,13,0.72);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .highlight-pill svg {
          width: 10px;
          height: 10px;
          color: #22c55e;
        }
        .features-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          font-size: 9px;
          font-weight: 700;
          color: #16a34a;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .see-more-btn {
          background: none;
          border: none;
          color: #9a5c2e;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.2s ease;
        }
        .see-more-btn:hover {
          color: #c8965c;
        }
        .price-highlight-box {
          background: linear-gradient(135deg, rgba(154,92,46,0.12) 0%, rgba(200,150,92,0.08) 100%);
          border: 1px solid rgba(154,92,46,0.22);
          border-radius: 14px;
          padding: 12px 14px;
          text-align: center;
          margin-bottom: 2px;
        }
        .price-highlight-box .price-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          font-size: 24px;
          font-weight: 900;
          color: #9a5c2e;
          line-height: 1;
          margin-bottom: 4px;
        }
        .price-highlight-box .price-value span {
          font-size: 10px;
          font-weight: 600;
          color: rgba(154,92,46,0.6);
        }
        .price-highlight-box .setup-fee {
          font-size: 8px;
          color: rgba(154,92,46,0.5);
          font-weight: 600;
        }
      `}</style>

      <motion.div
        className={`pcard${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-card" : ""}`}
        onClick={() => !product.coming_soon && setModalOpen(true)}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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

        {/* All Features - Grid (max 4, with see more) */}
        <div className="highlight-pills">
          {product.highlights.slice(0, 4).map((h) => (
            <div key={h} className="highlight-pill">
              <CheckCircle2 />
              <span>{h}</span>
            </div>
          ))}
        </div>
        
        {product.highlights.length > 4 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }} 
            className="see-more-btn"
          >
            + See {product.highlights.length - 4} more feature{product.highlights.length - 4 > 1 ? 's' : ''}
          </button>
        )}

        {/* Price Highlight Box */}
        <div className="price-highlight-box">
          <div className="price-value">
            <span>💰</span>
            ${product.monthly_fee}<span>/month</span>
          </div>
          <div className="setup-fee">${product.setup_fee} one-time setup</div>
        </div>

        {/* Full-Width CTA Footer */}
        <div style={{ marginTop: "auto", paddingTop: "2px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {!product.coming_soon && (
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.94, rotateY: 6, rotateX: -2 }}
              whileHover={{ y: -2, boxShadow: inCart ? "0 8px 20px rgba(34,197,94,0.4)" : "0 8px 20px rgba(120,70,20,0.38)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                width: "100%",
                borderRadius: "9999px", padding: "1px",
                background: inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#f5c518 0%,#ffd700 30%,#ffe566 50%,#ffd700 70%,#c9a800 100%)",
                border: "none", cursor: "pointer",
                boxShadow: inCart ? "0 4px 12px rgba(34,197,94,0.3)" : "0 4px 12px rgba(200,165,0,0.35)",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                width: "100%",
                height: "36px", paddingLeft: "16px", paddingRight: "16px", borderRadius: "9999px",
                background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#b8860b 0%,#d4a017 40%,#b8860b 100%)",
                color: "#fff", fontWeight: "700", fontSize: "11px", whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>
                {inCart ? <><Check style={{ width: "12px", height: "12px" }} /> Added to Cart</> : <><Plus style={{ width: "12px", height: "12px" }} /> Add to Cart</>}
              </span>
            </motion.button>
          )}

          {product.coming_soon && (
            <>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.4)", background: "rgba(154,92,46,0.06)", padding: "8px 12px", borderRadius: "9999px", border: "1px solid rgba(154,92,46,0.12)", whiteSpace: "nowrap", textAlign: "center" }}>
                <span style={{display:"inline-block",width:"7px",height:"7px",borderRadius:"50%",background:"#c8965c",marginRight:"5px",animation:"cs-pulse 1.4s ease-in-out infinite"}} />
                Coming Soon
              </span>
              <style>{`@keyframes cs-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.3)}}`}</style>
            </>
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
      </motion.div>

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