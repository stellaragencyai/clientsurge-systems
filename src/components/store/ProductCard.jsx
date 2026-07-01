import { CheckCircle2, Plus, Check, ArrowRight, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cartContext";
import ServiceDetailModal from "@/components/store/ServiceDetailModal";
import { motion } from "framer-motion";

const CHECK_GREEN = "#16A34A";
const CHECK_GREEN_BG = "rgba(22, 163, 74, 0.1)";
const PRIMARY_BLUE = "#0079c1";
const DEEP_BLUE = "#005691";

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "—") return "—";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `$${numeric.toLocaleString()}`;
  const stringValue = String(value);
  return stringValue.startsWith("$") ? stringValue : `$${stringValue}`;
};

export default function ProductCard({ product }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((item) => item.product_id === product.product_id);
  const [modalOpen, setModalOpen] = useState(false);

  const unavailable = product.coming_soon || !product.checkout_enabled;
  const monthlyLabel = formatMoney(product.monthly_fee);
  const setupLabel = product.setup_fee === 0 ? "No setup fee" : formatMoney(product.setup_fee);
  const visibleHighlights = Array.isArray(product.highlights) ? product.highlights.slice(0, 4) : [];
  const remainingHighlightCount = Array.isArray(product.highlights) ? Math.max(product.highlights.length - 4, 0) : 0;

  const toggle = (e) => {
    e.stopPropagation();
    if (unavailable) return;
    if (inCart) removeItem(product.product_id);
    else addItem(product);
  };

  return (
    <>
      <style>{`
        .pcard {
          position: relative;
          border-radius: 24px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,252,255,0.96) 100%);
          border: 1.5px solid rgba(0,136,204,0.18);
          box-shadow: 0 14px 36px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
          cursor: pointer;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          min-height: 380px;
          overflow: visible;
          isolation: isolate;
        }
        .pcard::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 18% 0%, rgba(0,174,239,0.1), transparent 36%), radial-gradient(circle at 100% 16%, rgba(0,86,145,0.07), transparent 34%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: -1;
        }
        .pcard:hover {
          border-color: rgba(0,136,204,0.42);
          box-shadow: 0 22px 48px rgba(0,59,143,0.13), inset 0 1px 0 rgba(255,255,255,0.86);
          transform: translateY(-3px);
        }
        .pcard:hover::before { opacity: 1; }
        .pcard.in-cart {
          border-color: rgba(22,163,74,0.52);
          box-shadow: 0 16px 42px rgba(22,163,74,0.18), inset 0 1px 0 rgba(255,255,255,0.86);
        }
        .pcard.coming-soon-card {
          cursor: default;
          opacity: 0.78;
        }
        .pcard-click-hint {
          position: absolute;
          bottom: 14px;
          right: 16px;
          font-size: 9px;
          font-weight: 800;
          color: rgba(0,95,153,0.5);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .pcard:hover .pcard-click-hint { opacity: 1; }
        .automation-card-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          max-width: 100%;
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: ${DEEP_BLUE};
          background: rgba(0,174,239,0.07);
          border: 1px solid rgba(0,174,239,0.16);
          border-radius: 999px;
          padding: 5px 10px;
        }
        .automation-highlight-pills {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .automation-highlight-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 9px;
          border-radius: 13px;
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(0,174,239,0.14);
          font-size: 10px;
          font-weight: 700;
          color: rgba(10,22,40,0.74);
          line-height: 1.25;
          min-width: 0;
        }
        .automation-highlight-pill span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .automation-highlight-pill svg {
          width: 13px;
          height: 13px;
          color: ${CHECK_GREEN};
          flex-shrink: 0;
        }
        .automation-card-more-btn {
          background: none;
          border: none;
          color: ${PRIMARY_BLUE};
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
          padding: 0;
          margin-top: -2px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .automation-card-more-btn:hover {
          color: ${DEEP_BLUE};
          transform: translateX(2px);
        }
        .automation-price-panel {
          background: linear-gradient(180deg, #ffffff, rgba(248,250,252,0.92));
          border: 1px solid rgba(0,136,204,0.16);
          border-radius: 18px;
          padding: 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.82), 0 10px 24px rgba(15,23,42,0.05);
        }
        .automation-price-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .automation-price-label {
          font-size: 9px;
          font-weight: 850;
          color: rgba(10,22,40,0.48);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin: 0 0 5px;
        }
        .automation-price-value {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 25px;
          font-weight: 900;
          color: #0A1628;
          line-height: 1;
          margin: 0;
        }
        .automation-price-value span {
          font-size: 10px;
          font-weight: 800;
          color: rgba(0,95,153,0.72);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .automation-setup-row {
          margin-top: 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 14px;
          background: rgba(0,174,239,0.055);
          border: 1px solid rgba(0,174,239,0.13);
        }
        .automation-card-cta-label {
          font-size: 11px;
        }
        @media (max-width: 480px) {
          .automation-card-cta-label { font-size: 10px; }
          .automation-highlight-pills { grid-template-columns: 1fr; }
        }
      `}</style>

      <motion.div
        className={`pcard${inCart ? " in-cart" : ""}${product.coming_soon ? " coming-soon-card" : ""}`}
        onClick={() => !unavailable && setModalOpen(true)}
        variants={{
          hidden: { opacity: 0, y: 32 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
        }}
        whileHover={{ y: unavailable ? 0 : -5, boxShadow: inCart ? "0 18px 44px rgba(22,163,74,0.22)" : "0 20px 48px rgba(0,59,143,0.14)" }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div style={{
              width: "50px", height: "50px", borderRadius: "16px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
              background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(232,247,255,0.9))",
              border: "1px solid rgba(0,174,239,0.18)",
              boxShadow: "0 10px 22px rgba(0,136,204,0.09)",
              flexShrink: 0,
            }}>
              {product.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="automation-card-kicker">
                <BadgeCheck style={{ width: "10px", height: "10px" }} />
                {product.category}
              </span>
            </div>
          </div>
          {product.popular && !product.coming_soon && (
            <span style={{
              background: "linear-gradient(135deg,#0088CC,#00AEEF)", color: "#fff",
              fontSize: "8px", fontWeight: "850", padding: "5px 10px", borderRadius: "999px",
              letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 7px 18px rgba(0,174,239,0.28)", flexShrink: 0,
            }}>
              Popular
            </span>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: "17px", fontWeight: "850", color: "#0A1628", margin: "0 0 5px", lineHeight: 1.18 }}>
            {product.name}
          </h2>
          <p style={{ fontSize: "9px", color: "rgba(0,136,204,0.82)", fontWeight: "850", margin: 0, textTransform: "uppercase", letterSpacing: "0.11em" }}>
            {product.subtitle}
          </p>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.66)", lineHeight: 1.65, margin: 0, flex: 1 }}>
          {product.description}
        </p>

        <div className="automation-highlight-pills">
          {visibleHighlights.map((h) => (
            <div key={h} className="automation-highlight-pill">
              <CheckCircle2 />
              <span>{h}</span>
            </div>
          ))}
        </div>

        {remainingHighlightCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            className="automation-card-more-btn"
          >
            + See {remainingHighlightCount} more feature{remainingHighlightCount > 1 ? "s" : ""} <ArrowRight style={{ width: "10px", height: "10px", display: "inline", verticalAlign: "-1px" }} />
          </button>
        )}

        <div className="automation-price-panel">
          <div className="automation-price-row">
            <div>
              <p className="automation-price-label">Monthly plan</p>
              <p className="automation-price-value">{monthlyLabel}<span>/mo</span></p>
            </div>
            <span style={{
              flexShrink: 0,
              borderRadius: "999px",
              padding: "5px 9px",
              fontSize: "8px",
              fontWeight: "850",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: unavailable ? "#64748B" : PRIMARY_BLUE,
              background: unavailable ? "rgba(100,116,139,0.08)" : "rgba(0,174,239,0.07)",
              border: unavailable ? "1px solid rgba(100,116,139,0.14)" : "1px solid rgba(0,174,239,0.16)",
            }}>
              {product.availability_label || (unavailable ? "Coming Soon" : "Self-Serve")}
            </span>
          </div>
          <div className="automation-setup-row">
            <div>
              <p style={{ margin: 0, fontSize: "9px", color: "rgba(10,22,40,0.48)", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.14em" }}>One-time setup</p>
              <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(10,22,40,0.5)", fontWeight: 700 }}>{product.fulfillment_label || "Done-for-you setup included"}</p>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 900, color: DEEP_BLUE, whiteSpace: "nowrap" }}>{setupLabel}</span>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "2px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {!unavailable && (
            <motion.button
              onClick={toggle}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2, boxShadow: inCart ? "0 9px 22px rgba(22,163,74,0.36)" : "0 9px 24px rgba(0,121,193,0.34)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                width: "100%",
                borderRadius: "9999px",
                background: inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(90deg, #0079c1 0%, #005691 100%)",
                border: "none",
                cursor: "pointer",
                boxShadow: inCart ? "0 6px 15px rgba(34,197,94,0.28)" : "0 6px 18px rgba(0,121,193,0.28)",
                padding: 0,
              }}
            >
              <span className="automation-card-cta-label" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                width: "100%", height: "40px", paddingLeft: "16px", paddingRight: "16px", borderRadius: "9999px",
                color: "#fff", fontWeight: "850", whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                {inCart ? <><Check style={{ width: "13px", height: "13px" }} /> Added to Cart</> : <><Plus style={{ width: "13px", height: "13px" }} /> Add Automation</>}
              </span>
            </motion.button>
          )}

          {unavailable && (
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#475569", background: "rgba(100,116,139,0.08)", padding: "10px 12px", borderRadius: "9999px", border: "1px solid rgba(100,116,139,0.16)", whiteSpace: "nowrap", textAlign: "center" }}>
              Early Access — Not Checkout Enabled
            </span>
          )}
        </div>

        {!unavailable && <span className="pcard-click-hint">details →</span>}
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
