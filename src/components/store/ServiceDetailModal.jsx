import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react";

export default function ServiceDetailModal({ product, inCart, onToggle, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus trap: keep focus within modal while open
    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prev || "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleToggle = () => {
    // Guard: don't allow adding coming_soon or non-checkout items
    if (product?.coming_soon || product?.checkout_enabled === false) {
      onClose();
      return;
    }
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
        transition={{ duration: 0.45, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(4,2,1,0.35)",
          backdropFilter: "blur(8px) saturate(0.8)",
          WebkitBackdropFilter: "blur(8px) saturate(0.8)",
        }}
      />

      {/* Card — rises from below & scales into focus */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 80, scale: 0.88, rotateX: 6 }}
        animate={{ opacity: 1, y: 0,  scale: 1,    rotateX: 0 }}
        exit={{    opacity: 0, y: 40, scale: 0.93, rotateX: 2 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 22,
          mass: 1.2,
          opacity: { duration: 0.5, ease: "easeOut" },
        }}
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ? `${product.name} details` : "Service details"}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", inset: 0, zIndex: 1001,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
          pointerEvents: "none",
          perspective: "1200px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: "640px",
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: "24px",
            background: "linear-gradient(160deg, #ffffff 0%, #f0f7ff 100%)",
            border: "1.5px solid rgba(0,136,204,0.2)",
            boxShadow: "0 50px 130px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,136,204,0.08)",
            position: "relative",
          }}
        >
          {/* Top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            borderRadius: "24px 24px 0 0",
            background: "linear-gradient(90deg, #003B8F 0%, #0088CC 40%, #00AEEF 60%, #0088CC 80%, #003B8F 100%)",
          }} />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "14px", right: "14px",
              width: "30px", height: "30px", borderRadius: "50%",
              background: "rgba(0,136,204,0.07)", border: "1px solid rgba(0,136,204,0.18)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,136,204,0.16)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,136,204,0.07)"}
          >
            <X style={{ width: "13px", height: "13px", color: "#0088CC" }} />
          </button>

          <div style={{ padding: "26px 26px 22px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
                background: "linear-gradient(145deg, rgba(0,136,204,0.1), rgba(0,174,239,0.05))",
                border: "1.5px solid rgba(0,136,204,0.2)",
                boxShadow: "0 4px 14px rgba(0,136,204,0.12)",
              }}>
                {product.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{
                    fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
                    color: "rgba(0,136,204,0.85)", background: "rgba(0,136,204,0.08)",
                    padding: "3px 9px", borderRadius: "999px", border: "1px solid rgba(0,136,204,0.2)",
                  }}>{product.category}</span>
                  {product.popular && (
                    <span style={{
                      fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em",
                      color: "#fff", background: "linear-gradient(135deg,#0088CC,#00AEEF)",
                      padding: "3px 9px", borderRadius: "999px",
                    }}>Popular</span>
                  )}
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: "0 0 2px", lineHeight: 1.15 }}>
                  {product.name}
                </h2>
                <p style={{ fontSize: "9px", color: "rgba(0,136,204,0.7)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {product.subtitle}
                </p>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.65)", lineHeight: 1.7, margin: "0 0 18px" }}>
              {product.description}
            </p>

            {/* Highlights */}
            <div style={{ marginBottom: "18px" }}>
              <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(0,136,204,0.65)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 8px" }}>
                What's Included
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {product.highlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.32, ease: "easeOut" }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "10px",
                      padding: "9px 12px", borderRadius: "10px",
                      background: "rgba(0,136,204,0.04)", border: "1px solid rgba(0,136,204,0.1)",
                    }}
                  >
                    <CheckCircle2 style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "12px", color: "rgba(27,20,13,0.7)", fontWeight: "500", lineHeight: 1.5 }}>{h}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trust chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {[
                { icon: <Zap style={{ width: "10px", height: "10px" }} />, label: "Live in 5–7 days" },
                { icon: <Clock style={{ width: "10px", height: "10px" }} />, label: "No contracts" },
                { icon: <ArrowRight style={{ width: "10px", height: "10px" }} />, label: "Cancel anytime" },
              ].map((chip) => (
                <div key={chip.label} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "5px 10px", borderRadius: "999px",
                  background: "rgba(0,136,204,0.06)", border: "1px solid rgba(0,136,204,0.15)",
                  fontSize: "10px", fontWeight: "600", color: "rgba(0,136,204,0.8)",
                }}>
                  {chip.icon}{chip.label}
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(0,136,204,0.06), rgba(0,174,239,0.03))",
              border: "1.5px solid rgba(0,136,204,0.15)",
              padding: "16px 18px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: "12px",
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(0,136,204,0.6)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 2px" }}>Monthly</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,136,204,0.65)" }}>$</span>
                  <span style={{ fontSize: "38px", fontWeight: "900", color: "#0088CC", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.monthly_fee}</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(0,136,204,0.5)", alignSelf: "flex-end", paddingBottom: "3px" }}>/mo</span>
                </div>
              </div>
              <div style={{ width: "1px", height: "48px", background: "rgba(0,136,204,0.15)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(0,136,204,0.6)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 2px" }}>One-Time Setup</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(27,20,13,0.45)" }}>$</span>
                  <span style={{ fontSize: "38px", fontWeight: "900", color: "#1b140d", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.setup_fee}</span>
                </div>
              </div>
              <div style={{ width: "1px", height: "48px", background: "rgba(0,136,204,0.15)" }} />
              <div style={{ flex: 1, minWidth: "120px" }}>
                <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(0,136,204,0.6)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 4px" }}>Includes</p>
                <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.6)", lineHeight: 1.5, margin: 0, fontWeight: "500" }}>
                  Full setup, config, testing & ongoing management.
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleToggle}
              disabled={product?.coming_soon || product?.checkout_enabled === false}
              style={{
                width: "100%", borderRadius: "9999px", padding: "2px",
                background: inCart
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "linear-gradient(135deg,#00AEEF 0%,#0088CC 40%,#003B8F 100%)",
                border: "none",
                cursor: (product?.coming_soon || product?.checkout_enabled === false) ? "not-allowed" : "pointer",
                opacity: (product?.coming_soon || product?.checkout_enabled === false) ? 0.45 : 1,
                boxShadow: inCart ? "0 6px 20px rgba(34,197,94,0.35)" : "0 6px 22px rgba(0,136,204,0.4)",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                height: "46px", borderRadius: "9999px",
                background: inCart
                  ? "linear-gradient(135deg,#16a34a,#15803d)"
                  : "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                color: "#fff", fontWeight: "700", fontSize: "14px",
              }}>
                {inCart
                  ? <><Check style={{ width: "14px", height: "14px" }} /> Remove from Cart</>
                  : <><Plus style={{ width: "14px", height: "14px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
              </span>
            </button>

            <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(27,20,13,0.35)", marginTop: "8px" }}>
              Secured by Stripe · Cancel anytime
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}