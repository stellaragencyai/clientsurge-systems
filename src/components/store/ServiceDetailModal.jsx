import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react";

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
  const monthlyFee = product?.monthly_fee ?? "—";
  const setupFee = product?.setup_fee ?? "—";
  const setupLabel = setupFee === 0 ? "No setup fee" : `$${setupFee}`;

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
        @media (max-width: 560px) {
          .service-detail-modal-shell { padding: 12px !important; align-items: flex-end !important; }
          .service-detail-modal-card { max-height: 92vh !important; border-radius: 22px 22px 18px 18px !important; }
          .service-detail-modal-content { padding: 24px 18px 20px !important; }
          .service-detail-modal-header { gap: 12px !important; }
          .service-detail-modal-icon { width: 48px !important; height: 48px !important; font-size: 24px !important; }
          .service-detail-modal-price { flex-direction: column !important; align-items: stretch !important; }
          .service-detail-modal-divider { width: 100% !important; height: 1px !important; }
        }
      `}</style>
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "linear-gradient(135deg, rgba(245,251,255,0.70), rgba(5,54,92,0.34))",
            backdropFilter: "blur(12px) saturate(1.05)",
            WebkitBackdropFilter: "blur(12px) saturate(1.05)",
          }}
        />

        {/* Modal card */}
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
              maxWidth: "620px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "24px",
              background: "linear-gradient(180deg, #ffffff 0%, #f7fcff 58%, #f0f9ff 100%)",
              border: "1px solid rgba(0,174,239,0.28)",
              boxShadow: "0 34px 90px rgba(0,59,143,0.24), 0 14px 38px rgba(0,174,239,0.14), inset 0 1px 0 rgba(255,255,255,0.95)",
              position: "relative",
            }}
          >
            {/* Soft blue background accents */}
            <div style={{
              position: "absolute", top: "-110px", right: "-110px", width: "260px", height: "260px",
              borderRadius: "50%", background: "radial-gradient(circle, rgba(0,174,239,0.16), rgba(0,174,239,0) 66%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "-130px", left: "-120px", width: "280px", height: "280px",
              borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.10), rgba(34,197,94,0) 65%)",
              pointerEvents: "none",
            }} />

            {/* Blue top accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "4px",
              borderRadius: "24px 24px 0 0",
              background: "linear-gradient(90deg, #005691 0%, #00AEEF 48%, #8bdcff 100%)",
            }} />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close service details"
              style={{
                position: "absolute", top: "16px", right: "16px", zIndex: 2,
                width: "34px", height: "34px", borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(0,136,204,0.18)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 20px rgba(0,59,143,0.10)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,59,143,0.16)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.92)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,59,143,0.10)"; }}
            >
              <X style={{ width: "14px", height: "14px", color: "#0A1628" }} />
            </button>

            <div className="service-detail-modal-content" style={{ padding: "32px 28px 24px", position: "relative", zIndex: 1 }}>
              {/* Header */}
              <div className="service-detail-modal-header" style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px", paddingRight: "36px" }}>
                <div className="service-detail-modal-icon" style={{
                  width: "58px", height: "58px", borderRadius: "18px", flexShrink: 0,
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
                      fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
                      color: "#0079c1",
                      background: "rgba(0,174,239,0.08)",
                      padding: "4px 10px", borderRadius: "999px",
                      border: "1px solid rgba(0,174,239,0.18)",
                    }}>{product?.category}</span>
                    {product?.popular && (
                      <span style={{
                        fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em",
                        color: "#ffffff",
                        background: "linear-gradient(135deg,#0088CC,#00AEEF)",
                        padding: "4px 10px", borderRadius: "999px",
                        boxShadow: "0 6px 16px rgba(0,174,239,0.24)",
                      }}>Popular</span>
                    )}
                  </div>
                  <h2 id="service-detail-modal-title" style={{ fontSize: "22px", fontWeight: "850", color: "#0A1628", margin: "0 0 4px", lineHeight: 1.15 }}>
                    {product?.name}
                  </h2>
                  <p style={{ fontSize: "9px", color: "rgba(0,136,204,0.82)", fontWeight: "800", margin: 0, textTransform: "uppercase", letterSpacing: "0.11em" }}>
                    {product?.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.68)", lineHeight: 1.75, margin: "0 0 22px" }}>
                {product?.description}
              </p>

              {/* What's Included */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "9px", fontWeight: "850", color: "#005f99", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 10px" }}>
                  What's Included
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {highlights.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.05, duration: 0.25, ease: "easeOut" }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "10px",
                        padding: "10px 12px", borderRadius: "12px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,249,255,0.90))",
                        border: "1px solid rgba(0,174,239,0.16)",
                        boxShadow: "0 5px 14px rgba(0,59,143,0.045)",
                      }}
                    >
                      <CheckCircle2 style={{ width: "15px", height: "15px", color: "#16a34a", flexShrink: 0, marginTop: "1px" }} />
                      <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.76)", fontWeight: "600", lineHeight: 1.5 }}>{h}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Trust chips */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px" }}>
                {[
                  { icon: <Zap style={{ width: "10px", height: "10px" }} />, label: "Live in 5–7 days" },
                  { icon: <Clock style={{ width: "10px", height: "10px" }} />, label: "No contracts" },
                  { icon: <ArrowRight style={{ width: "10px", height: "10px" }} />, label: "Cancel anytime" },
                ].map((chip) => (
                  <div key={chip.label} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "6px 11px", borderRadius: "999px",
                    background: "rgba(255,255,255,0.86)",
                    border: "1px solid rgba(0,174,239,0.16)",
                    fontSize: "10px", fontWeight: "700", color: "#0079c1",
                    boxShadow: "0 4px 12px rgba(0,59,143,0.04)",
                  }}>
                    {chip.icon}{chip.label}
                  </div>
                ))}
              </div>

              {/* Pricing row */}
              <div className="service-detail-modal-price" style={{
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(0,174,239,0.08), rgba(255,255,255,0.96))",
                border: "1px solid rgba(0,136,204,0.16)",
                padding: "17px 18px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                gap: "14px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 22px rgba(0,59,143,0.06)",
              }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p style={{ fontSize: "8px", fontWeight: "850", color: "#0079c1", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 5px" }}>Monthly</p>
                  <p style={{ fontSize: "24px", fontWeight: "900", color: "#0A1628", margin: 0, lineHeight: 1 }}>
                    ${monthlyFee}<span style={{ fontSize: "11px", fontWeight: "700", color: "#005f99" }}>/mo</span>
                  </p>
                </div>
                <div className="service-detail-modal-divider" style={{ width: "1px", height: "40px", background: "rgba(0,136,204,0.18)" }} />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p style={{ fontSize: "8px", fontWeight: "850", color: "#0079c1", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 5px" }}>One-Time Setup</p>
                  <p style={{ fontSize: "24px", fontWeight: "900", color: "#0A1628", margin: 0, lineHeight: 1 }}>
                    {setupLabel}<span style={{ fontSize: "11px", fontWeight: "700", color: "#005f99" }}> setup</span>
                  </p>
                </div>
              </div>

              {/* CTA */}
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
                  background: inCart
                    ? "rgba(255,255,255,0.94)"
                    : "linear-gradient(90deg, #0079c1 0%, #005691 100%)",
                  boxShadow: inCart
                    ? "0 8px 22px rgba(34,197,94,0.16)"
                    : "0 10px 24px rgba(0,121,193,0.32)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!unavailable) { e.currentTarget.style.transform = "translateY(-1px)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  height: "48px", borderRadius: "9999px",
                  color: inCart ? "#16a34a" : "#ffffff",
                  fontWeight: "850", fontSize: "14px",
                  pointerEvents: "none",
                }}>
                  {unavailable
                    ? <><Clock style={{ width: "14px", height: "14px" }} /> Coming Soon</>
                    : inCart
                      ? <><Check style={{ width: "14px", height: "14px" }} /> Remove from Cart</>
                      : <><Plus style={{ width: "14px", height: "14px" }} /> Add to Cart — ${monthlyFee}/mo</>}
                </span>
              </button>

              <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(10,22,40,0.42)", margin: "11px 0 0", fontWeight: 600 }}>
                Secured by Stripe · Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
