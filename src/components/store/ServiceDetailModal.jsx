import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, CheckCircle2, Clock, Zap, ArrowRight, ShieldCheck } from "lucide-react";

const CHECK_GREEN = "#16A34A";
const CHECK_GREEN_BG = "rgba(22, 163, 74, 0.1)";
const PRIMARY_BLUE = "#0079c1";
const DEEP_BLUE = "#005691";
const INK = "#0A1628";

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "—") return "—";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return `$${numeric.toLocaleString()}`;
  const stringValue = String(value);
  return stringValue.startsWith("$") ? stringValue : `$${stringValue}`;
};

export default function ServiceDetailModal({ product, inCart, onToggle, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = prev || ""; document.removeEventListener("keydown", handleKeyDown); };
  }, [onClose]);

  const unavailable = product?.coming_soon || product?.checkout_enabled === false;
  const highlights = Array.isArray(product?.highlights) ? product.highlights : [];
  const monthlyLabel = formatMoney(product?.monthly_fee ?? "—");
  const setupLabel = product?.setup_fee === 0 ? "No setup fee" : formatMoney(product?.setup_fee ?? "—");
  const availabilityLabel = product?.availability_label || (unavailable ? "Coming Soon" : "Self-Serve Checkout");
  const fulfillmentLabel = product?.fulfillment_label || "Done-for-you setup included";

  const handleToggle = () => {
    if (unavailable) return;
    onToggle();
    onClose();
  };

  return (
    <>
      <style>{`
        .service-detail-modal-card::-webkit-scrollbar { width: 8px; }
        .service-detail-modal-card::-webkit-scrollbar-track { background: rgba(0,174,239,0.06); border-radius: 999px; }
        .service-detail-modal-card::-webkit-scrollbar-thumb { background: rgba(0,136,204,0.34); border-radius: 999px; }
        .service-modal-highlight-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,0.84);
          border: 1px solid rgba(0,174,239,0.14);
          box-shadow: 0 6px 16px rgba(0,59,143,0.045);
        }
        .service-modal-highlight-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: ${CHECK_GREEN_BG};
          flex-shrink: 0;
          margin-top: -1px;
        }
        .service-modal-price-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .service-modal-price-box {
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff, rgba(248,250,252,0.94));
          border: 1px solid rgba(0,136,204,0.16);
          padding: 15px 16px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.82), 0 10px 24px rgba(15,23,42,0.05);
        }
        .service-modal-price-label {
          font-size: 9px;
          font-weight: 850;
          color: rgba(10,22,40,0.48);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin: 0 0 7px;
        }
        .service-modal-price-value {
          display: flex;
          align-items: baseline;
          gap: 5px;
          color: ${INK};
          font-size: 27px;
          font-weight: 900;
          line-height: 1;
          margin: 0;
        }
        .service-modal-price-value span {
          font-size: 10px;
          font-weight: 850;
          color: rgba(0,95,153,0.72);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .service-modal-proof-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 20px;
        }
        .service-modal-proof-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 34px;
          padding: 7px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(0,174,239,0.16);
          font-size: 10px;
          font-weight: 800;
          color: ${PRIMARY_BLUE};
          box-shadow: 0 4px 12px rgba(0,59,143,0.04);
          text-align: center;
        }
        @media (max-width: 560px) {
          .service-detail-modal-shell { padding: 12px !important; align-items: flex-end !important; }
          .service-detail-modal-card { max-height: 92vh !important; border-radius: 24px 24px 18px 18px !important; }
          .service-detail-modal-content { padding: 26px 18px 20px !important; }
          .service-detail-modal-header { gap: 12px !important; }
          .service-detail-modal-icon { width: 48px !important; height: 48px !important; font-size: 24px !important; }
          .service-modal-price-grid { grid-template-columns: 1fr !important; }
          .service-modal-proof-strip { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "linear-gradient(135deg, rgba(248,252,255,0.82), rgba(0,86,145,0.24))",
            backdropFilter: "blur(14px) saturate(1.08)",
            WebkitBackdropFilter: "blur(14px) saturate(1.08)",
          }}
        />

        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 46, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 150, damping: 24, opacity: { duration: 0.28 } }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-modal-title"
          aria-label={product?.name ? `${product.name} details` : "Service details"}
          onClick={(e) => e.stopPropagation()}
          className="service-detail-modal-shell"
          style={{
            position: "fixed", inset: 0, zIndex: 1001,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            pointerEvents: "none",
          }}
        >
          <div
            className="service-detail-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "28px",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fcff 56%, #eef8ff 100%)",
              border: "1px solid rgba(0,174,239,0.24)",
              boxShadow: "0 36px 92px rgba(0,59,143,0.22), 0 14px 38px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
              position: "relative",
              overflow: "hidden auto",
            }}
          >
            <div style={{ position: "absolute", top: "-120px", right: "-118px", width: "290px", height: "290px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,174,239,0.15), rgba(0,174,239,0) 66%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-142px", left: "-128px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(22,163,74,0.10), rgba(22,163,74,0) 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "5px", borderRadius: "28px 28px 0 0", background: "linear-gradient(90deg, #005691 0%, #00AEEF 52%, #8bdcff 100%)" }} />

            <button
              onClick={onClose}
              aria-label="Close service details"
              style={{
                position: "absolute", top: "16px", right: "16px", zIndex: 2,
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(0,136,204,0.18)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 20px rgba(0,59,143,0.10)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,59,143,0.16)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.92)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,59,143,0.10)"; }}
            >
              <X style={{ width: "14px", height: "14px", color: INK }} />
            </button>

            <div className="service-detail-modal-content" style={{ padding: "34px 30px 26px", position: "relative", zIndex: 1 }}>
              <div className="service-detail-modal-header" style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px", paddingRight: "38px" }}>
                <div className="service-detail-modal-icon" style={{
                  width: "60px", height: "60px", borderRadius: "19px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(232,247,255,0.92))",
                  border: "1px solid rgba(0,174,239,0.22)",
                  boxShadow: "0 10px 24px rgba(0,136,204,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}>
                  {product?.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "8px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.16em",
                      color: PRIMARY_BLUE, background: "rgba(0,174,239,0.08)", padding: "5px 10px", borderRadius: "999px",
                      border: "1px solid rgba(0,174,239,0.18)",
                    }}>{product?.category}</span>
                    <span style={{
                      fontSize: "8px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.12em",
                      color: unavailable ? "#64748B" : DEEP_BLUE,
                      background: unavailable ? "rgba(100,116,139,0.08)" : "rgba(0,174,239,0.07)",
                      padding: "5px 10px", borderRadius: "999px",
                      border: unavailable ? "1px solid rgba(100,116,139,0.16)" : "1px solid rgba(0,174,239,0.16)",
                    }}>{availabilityLabel}</span>
                    {product?.popular && !unavailable && (
                      <span style={{
                        fontSize: "8px", fontWeight: "850", textTransform: "uppercase", letterSpacing: "0.12em",
                        color: "#ffffff", background: "linear-gradient(135deg,#0088CC,#00AEEF)",
                        padding: "5px 10px", borderRadius: "999px", boxShadow: "0 6px 16px rgba(0,174,239,0.24)",
                      }}>Popular</span>
                    )}
                  </div>
                  <h2 id="service-detail-modal-title" style={{ fontSize: "23px", fontWeight: "900", color: INK, margin: "0 0 5px", lineHeight: 1.15 }}>
                    {product?.name}
                  </h2>
                  <p style={{ fontSize: "9px", color: "rgba(0,136,204,0.82)", fontWeight: "850", margin: 0, textTransform: "uppercase", letterSpacing: "0.11em" }}>
                    {product?.subtitle}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.68)", lineHeight: 1.75, margin: "0 0 22px" }}>
                {product?.description}
              </p>

              <div className="service-modal-proof-strip">
                {[
                  { icon: <Zap style={{ width: "11px", height: "11px" }} />, label: "Fast launch" },
                  { icon: <ShieldCheck style={{ width: "11px", height: "11px" }} />, label: "Proof tested" },
                  { icon: <Clock style={{ width: "11px", height: "11px" }} />, label: "No contracts" },
                ].map((chip) => (
                  <div key={chip.label} className="service-modal-proof-chip">{chip.icon}{chip.label}</div>
                ))}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "9px", fontWeight: "850", color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: "0.18em", margin: 0 }}>
                    What's Included
                  </p>
                  <span style={{ borderRadius: "999px", background: CHECK_GREEN_BG, color: CHECK_GREEN, padding: "5px 9px", fontSize: "9px", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Installed
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {highlights.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.25, ease: "easeOut" }}
                      className="service-modal-highlight-row"
                    >
                      <span className="service-modal-highlight-icon">
                        <CheckCircle2 style={{ width: "16px", height: "16px", color: CHECK_GREEN }} />
                      </span>
                      <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.76)", fontWeight: "650", lineHeight: 1.5 }}>{h}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="service-modal-price-grid">
                <div className="service-modal-price-box">
                  <p className="service-modal-price-label">Monthly plan</p>
                  <p className="service-modal-price-value">{monthlyLabel}<span>/mo</span></p>
                </div>
                <div className="service-modal-price-box">
                  <p className="service-modal-price-label">One-time setup</p>
                  <p className="service-modal-price-value">{setupLabel}<span>{product?.setup_fee === 0 ? "" : "setup"}</span></p>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                borderRadius: "16px",
                padding: "12px 14px",
                marginBottom: "18px",
                background: "rgba(0,174,239,0.055)",
                border: "1px solid rgba(0,174,239,0.14)",
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(10,22,40,0.48)", fontWeight: 850, textTransform: "uppercase", letterSpacing: "0.14em" }}>Delivery included</p>
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "rgba(10,22,40,0.68)", fontWeight: 700 }}>{fulfillmentLabel}</p>
                </div>
                <CheckCircle2 style={{ width: "19px", height: "19px", color: CHECK_GREEN, flexShrink: 0 }} />
              </div>

              <button
                onClick={handleToggle}
                disabled={unavailable}
                style={{
                  width: "100%",
                  border: inCart ? "1px solid rgba(34,197,94,0.28)" : "none",
                  padding: "0",
                  borderRadius: "9999px",
                  cursor: unavailable ? "not-allowed" : "pointer",
                  opacity: unavailable ? 0.55 : 1,
                  background: inCart ? "rgba(255,255,255,0.94)" : "linear-gradient(90deg, #0079c1 0%, #005691 100%)",
                  boxShadow: inCart ? "0 8px 22px rgba(34,197,94,0.16)" : "0 10px 24px rgba(0,121,193,0.32)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!unavailable) { e.currentTarget.style.transform = "translateY(-1px)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  height: "50px", borderRadius: "9999px",
                  color: inCart ? CHECK_GREEN : "#ffffff",
                  fontWeight: "850", fontSize: "14px",
                  pointerEvents: "none",
                }}>
                  {unavailable
                    ? <><Clock style={{ width: "14px", height: "14px" }} /> Coming Soon</>
                    : inCart
                      ? <><Check style={{ width: "14px", height: "14px" }} /> Remove from Cart</>
                      : <><Plus style={{ width: "14px", height: "14px" }} /> Add Automation — {monthlyLabel}/mo</>}
                </span>
              </button>

              <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(10,22,40,0.42)", margin: "11px 0 0", fontWeight: 650 }}>
                Secured by Stripe · Cancel anytime · Setup verified before launch
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
