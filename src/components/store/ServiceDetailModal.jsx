import { useEffect, useState } from "react";
import { X, Check, Plus, CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react";

export default function ServiceDetailModal({ product, inCart, onToggle, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the CSS transition fires after mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 380);
  };

  const handleToggle = () => {
    onToggle();
    handleClose();
  };

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        background: `rgba(10,6,3,${visible ? 0.6 : 0})`,
        backdropFilter: `blur(${visible ? 18 : 0}px)`,
        WebkitBackdropFilter: `blur(${visible ? 18 : 0}px)`,
        transition: "background 0.4s ease, backdrop-filter 0.4s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "28px",
          background: "linear-gradient(160deg, #fff 0%, #fdf8f2 100%)",
          border: "1.5px solid rgba(154,92,46,0.18)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(154,92,46,0.08)",
          opacity: visible ? 1 : 0,
          transform: `scale(${visible ? 1 : 0.88}) translateY(${visible ? 0 : 32}px)`,
          transition: "opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Top gradient accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "4px",
          borderRadius: "28px 28px 0 0",
          background: "linear-gradient(90deg, #7a4825 0%, #c8965c 40%, #f5d9a8 60%, #c8965c 80%, #7a4825 100%)",
        }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.14)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(154,92,46,0.16)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(154,92,46,0.08)"}
        >
          <X style={{ width: "14px", height: "14px", color: "#9a5c2e" }} />
        </button>

        <div style={{ padding: "32px 32px 28px" }}>

          {/* Hero header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "18px", marginBottom: "24px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "18px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
              background: "linear-gradient(145deg, rgba(154,92,46,0.1), rgba(200,150,92,0.06))",
              border: "1.5px solid rgba(154,92,46,0.2)",
              boxShadow: "0 4px 16px rgba(154,92,46,0.12)",
            }}>
              {product.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{
                  fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.18em",
                  color: "rgba(154,92,46,0.7)", background: "rgba(154,92,46,0.07)",
                  padding: "3px 10px", borderRadius: "999px", border: "1px solid rgba(154,92,46,0.14)",
                }}>
                  {product.category}
                </span>
                {product.popular && (
                  <span style={{
                    fontSize: "9px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em",
                    color: "#fff", background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                    padding: "3px 10px", borderRadius: "999px",
                  }}>
                    Popular
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1b140d", margin: "0 0 4px", lineHeight: 1.1 }}>
                {product.name}
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(154,92,46,0.65)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {product.subtitle}
              </p>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.68)", lineHeight: 1.75, margin: "0 0 24px" }}>
            {product.description}
          </p>

          {/* What's included */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: "800", color: "rgba(154,92,46,0.6)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 10px" }}>
              What's Included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {product.highlights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "11px 14px", borderRadius: "12px",
                    background: "rgba(154,92,46,0.04)", border: "1px solid rgba(154,92,46,0.09)",
                    animation: `modalStepIn 0.4s ease ${0.1 + i * 0.07}s both`,
                  }}
                >
                  <CheckCircle2 style={{ width: "15px", height: "15px", color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "13px", color: "rgba(27,20,13,0.72)", fontWeight: "500", lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline chips */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
            {[
              { icon: <Zap style={{ width: "11px", height: "11px" }} />, label: "Goes live in 5–7 days" },
              { icon: <Clock style={{ width: "11px", height: "11px" }} />, label: "No long-term contracts" },
              { icon: <ArrowRight style={{ width: "11px", height: "11px" }} />, label: "Cancel anytime" },
            ].map((chip) => (
              <div key={chip.label} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "999px",
                background: "rgba(154,92,46,0.05)", border: "1px solid rgba(154,92,46,0.12)",
                fontSize: "11px", fontWeight: "600", color: "rgba(154,92,46,0.8)",
              }}>
                {chip.icon} {chip.label}
              </div>
            ))}
          </div>

          {/* Pricing block */}
          <div style={{
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(154,92,46,0.06) 0%, rgba(200,150,92,0.04) 100%)",
            border: "1.5px solid rgba(154,92,46,0.15)",
            padding: "20px 22px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            {/* Monthly */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 2px" }}>Monthly</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.6)", marginBottom: "2px" }}>$</span>
                <span style={{ fontSize: "44px", fontWeight: "900", color: "#9a5c2e", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.monthly_fee}</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(154,92,46,0.5)", alignSelf: "flex-end", paddingBottom: "4px" }}>/mo</span>
              </div>
            </div>

            <div style={{ width: "1px", height: "56px", background: "rgba(154,92,46,0.15)", flexShrink: 0 }} />

            {/* Setup */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 2px" }}>One-Time Setup</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "rgba(154,92,46,0.6)", marginBottom: "2px" }}>$</span>
                <span style={{ fontSize: "44px", fontWeight: "900", color: "#1b140d", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.setup_fee}</span>
              </div>
            </div>

            <div style={{ width: "1px", height: "56px", background: "rgba(154,92,46,0.15)", flexShrink: 0 }} />

            {/* What you get summary */}
            <div style={{ flex: 1, minWidth: "140px" }}>
              <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 6px" }}>You Get</p>
              <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.65)", lineHeight: 1.5, margin: 0, fontWeight: "500" }}>
                Full setup, configuration, testing, and ongoing automation management.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleToggle}
            style={{
              width: "100%", borderRadius: "9999px", padding: "2px",
              background: inCart ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              border: "none", cursor: "pointer",
              boxShadow: inCart ? "0 6px 20px rgba(34,197,94,0.35)" : "0 6px 24px rgba(120,70,20,0.35)",
              transition: "all 0.2s",
            }}
          >
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              height: "52px", borderRadius: "9999px",
              background: inCart ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
              color: "#fff", fontWeight: "700", fontSize: "15px",
            }}>
              {inCart
                ? <><Check style={{ width: "16px", height: "16px" }} /> Remove from Cart</>
                : <><Plus style={{ width: "16px", height: "16px" }} /> Add to Cart — ${product.monthly_fee}/mo</>}
            </span>
          </button>

          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(27,20,13,0.38)", marginTop: "10px" }}>
            Secured by Stripe · Cancel anytime · No long-term contracts
          </p>
        </div>

        <style>{`
          @keyframes modalStepIn {
            from { opacity: 0; transform: translateX(-10px); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    </div>
  );
}