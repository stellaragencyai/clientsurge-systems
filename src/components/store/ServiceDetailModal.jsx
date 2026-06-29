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

  const handleToggle = () => {
    if (product?.coming_soon || product?.checkout_enabled === false) { onClose(); return; }
    onToggle();
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(10px) saturate(0.6)",
          WebkitBackdropFilter: "blur(10px) saturate(0.6)",
        }}
      />

      {/* Modal card */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 130, damping: 22, opacity: { duration: 0.4 } }}
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ? `${product.name} details` : "Service details"}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", inset: 0, zIndex: 1001,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
          pointerEvents: "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "20px",
            background: "linear-gradient(160deg, #0D1B2E 0%, #0A1628 60%, #060D18 100%)",
            border: "1px solid rgba(0,212,255,0.18)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
            position: "relative",
          }}
        >
          {/* Cyan top accent bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            borderRadius: "20px 20px 0 0",
            background: "linear-gradient(90deg, transparent 0%, #00D4FF 30%, #00FFB3 70%, transparent 100%)",
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "14px", right: "14px",
              width: "30px", height: "30px", borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <X style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.7)" }} />
          </button>

          <div style={{ padding: "28px 26px 24px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
                background: "linear-gradient(145deg, rgba(0,212,255,0.12), rgba(0,255,179,0.06))",
                border: "1px solid rgba(0,212,255,0.2)",
                boxShadow: "0 4px 16px rgba(0,212,255,0.1)",
              }}>
                {product.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                  <span style={{
                    fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
                    color: "#00D4FF",
                    background: "rgba(0,212,255,0.1)",
                    padding: "3px 9px", borderRadius: "999px",
                    border: "1px solid rgba(0,212,255,0.2)",
                  }}>{product.category}</span>
                  {product.popular && (
                    <span style={{
                      fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em",
                      color: "#0A0F1E",
                      background: "linear-gradient(135deg,#00D4FF,#00FFB3)",
                      padding: "3px 9px", borderRadius: "999px",
                    }}>Popular</span>
                  )}
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 3px", lineHeight: 1.15 }}>
                  {product.name}
                </h2>
                <p style={{ fontSize: "9px", color: "rgba(0,212,255,0.6)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {product.subtitle}
                </p>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, margin: "0 0 20px" }}>
              {product.description}
            </p>

            {/* What's Included */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 10px" }}>
                What's Included
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {product.highlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.28, ease: "easeOut" }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      padding: "9px 12px", borderRadius: "10px",
                      background: "rgba(0,212,255,0.04)",
                      border: "1px solid rgba(0,212,255,0.1)",
                    }}
                  >
                    <CheckCircle2 style={{ width: "14px", height: "14px", color: "#00FFB3", flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: "500", lineHeight: 1.5 }}>{h}</span>
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
                  padding: "5px 11px", borderRadius: "999px",
                  background: "rgba(0,255,179,0.06)",
                  border: "1px solid rgba(0,255,179,0.15)",
                  fontSize: "10px", fontWeight: "600", color: "rgba(0,255,179,0.8)",
                }}>
                  {chip.icon}{chip.label}
                </div>
              ))}
            </div>

            {/* Pricing row */}
            <div style={{
              borderRadius: "14px",
              background: "rgba(0,212,255,0.04)",
              border: "1px solid rgba(0,212,255,0.12)",
              padding: "16px 18px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: "12px",
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 3px" }}>Monthly</p>
                <p style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", margin: 0, lineHeight: 1 }}>
                  ${product.monthly_fee}<span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.4)" }}>/mo</span>
                </p>
              </div>
              <div style={{ width: "1px", height: "36px", background: "rgba(0,212,255,0.12)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(0,212,255,0.5)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 3px" }}>One-Time Setup</p>
                <p style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", margin: 0, lineHeight: 1 }}>
                  ${product.setup_fee}<span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.4)" }}> setup</span>
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleToggle}
              disabled={product?.coming_soon || product?.checkout_enabled === false}
              style={{
                width: "100%",
                border: "none",
                padding: "3px",
                borderRadius: "9999px",
                cursor: (product?.coming_soon || product?.checkout_enabled === false) ? "not-allowed" : "pointer",
                opacity: (product?.coming_soon || product?.checkout_enabled === false) ? 0.45 : 1,
                background: inCart
                  ? "rgba(0,255,179,0.12)"
                  : "linear-gradient(135deg,#00D4FF,#00FFB3)",
                boxShadow: inCart
                  ? "0 6px 20px rgba(0,255,179,0.2)"
                  : "0 6px 24px rgba(0,212,255,0.35)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { if (!product?.coming_soon) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                height: "46px", borderRadius: "9999px",
                color: inCart ? "#00FFB3" : "#0A0F1E",
                fontWeight: "800", fontSize: "14px",
                border: inCart ? "1px solid rgba(0,255,179,0.3)" : "none",
              }}>
                {inCart
                  ? <><Check style={{ width: "14px", height: "14px" }} /> Remove from Cart</>
                  : <><Plus style={{ width: "14px", height: "14px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
              </span>
            </button>

            <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "10px" }}>
              Secured by Stripe · Cancel anytime
            </p>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
