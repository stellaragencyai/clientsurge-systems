import { useEffect, useState } from "react";
import { X, Check, Plus, CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react";

export default function ServiceDetailModal({ product, inCart, onToggle, onClose }) {
  const [phase, setPhase] = useState("enter"); // enter → visible → exit

  useEffect(() => {
    // Phase 1: mount with "enter" (shrunk, offset), then kick to "visible"
    const t = setTimeout(() => setPhase("visible"), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleClose = () => {
    setPhase("exit");
    setTimeout(onClose, 420);
  };

  const handleToggle = () => {
    onToggle();
    handleClose();
  };

  const isVisible = phase === "visible";
  const isExit = phase === "exit";

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        // Backdrop: deep cinematic dimming
        background: isVisible && !isExit
          ? "rgba(6,3,1,0.72)"
          : "rgba(6,3,1,0)",
        backdropFilter: isVisible && !isExit ? "blur(20px) saturate(0.6)" : "blur(0px)",
        WebkitBackdropFilter: isVisible && !isExit ? "blur(20px) saturate(0.6)" : "blur(0px)",
        transition: "background 0.55s ease, backdrop-filter 0.55s ease, -webkit-backdrop-filter 0.55s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "24px",
          background: "linear-gradient(160deg, #ffffff 0%, #fdf8f2 100%)",
          border: "1.5px solid rgba(154,92,46,0.18)",
          boxShadow: isVisible && !isExit
            ? "0 48px 120px rgba(0,0,0,0.45), 0 0 0 1px rgba(154,92,46,0.1)"
            : "0 0 0 rgba(0,0,0,0)",
          // The card-to-center animation: starts small+low, springs to full size
          opacity: isVisible && !isExit ? 1 : 0,
          transform: isVisible && !isExit
            ? "scale(1) translateY(0px)"
            : isExit
            ? "scale(0.92) translateY(24px)"
            : "scale(0.78) translateY(60px)",
          transition: isExit
            ? "opacity 0.32s ease, transform 0.32s ease, box-shadow 0.32s ease"
            : "opacity 0.52s cubic-bezier(0.22,1,0.36,1), transform 0.52s cubic-bezier(0.22,1,0.36,1), box-shadow 0.52s ease",
        }}
      >
        {/* Top gradient bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          borderRadius: "24px 24px 0 0",
          background: "linear-gradient(90deg, #7a4825 0%, #c8965c 40%, #f5d9a8 60%, #c8965c 80%, #7a4825 100%)",
        }} />

        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: "14px", right: "14px",
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.14)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(154,92,46,0.16)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(154,92,46,0.07)"}
        >
          <X style={{ width: "13px", height: "13px", color: "#9a5c2e" }} />
        </button>

        <div style={{ padding: "26px 26px 22px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
              background: "linear-gradient(145deg, rgba(154,92,46,0.1), rgba(200,150,92,0.05))",
              border: "1.5px solid rgba(154,92,46,0.18)",
              boxShadow: "0 4px 14px rgba(154,92,46,0.1)",
            }}>
              {product.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{
                  fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.16em",
                  color: "rgba(154,92,46,0.7)", background: "rgba(154,92,46,0.07)",
                  padding: "3px 9px", borderRadius: "999px", border: "1px solid rgba(154,92,46,0.14)",
                }}>{product.category}</span>
                {product.popular && (
                  <span style={{
                    fontSize: "8px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em",
                    color: "#fff", background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                    padding: "3px 9px", borderRadius: "999px",
                  }}>Popular</span>
                )}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1b140d", margin: "0 0 2px", lineHeight: 1.15 }}>
                {product.name}
              </h2>
              <p style={{ fontSize: "9px", color: "rgba(154,92,46,0.6)", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
            <p style={{ fontSize: "9px", fontWeight: "800", color: "rgba(154,92,46,0.55)", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 8px" }}>
              What's Included
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {product.highlights.map((h, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "9px 12px", borderRadius: "10px",
                  background: "rgba(154,92,46,0.04)", border: "1px solid rgba(154,92,46,0.09)",
                  animation: `modalStepIn 0.38s ease ${0.12 + i * 0.06}s both`,
                }}>
                  <CheckCircle2 style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "12px", color: "rgba(27,20,13,0.7)", fontWeight: "500", lineHeight: 1.5 }}>{h}</span>
                </div>
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
                background: "rgba(154,92,46,0.05)", border: "1px solid rgba(154,92,46,0.11)",
                fontSize: "10px", fontWeight: "600", color: "rgba(154,92,46,0.75)",
              }}>
                {chip.icon}{chip.label}
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div style={{
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(154,92,46,0.06), rgba(200,150,92,0.03))",
            border: "1.5px solid rgba(154,92,46,0.14)",
            padding: "16px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            gap: "12px",
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 2px" }}>Monthly</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(154,92,46,0.55)" }}>$</span>
                <span style={{ fontSize: "38px", fontWeight: "900", color: "#9a5c2e", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.monthly_fee}</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(154,92,46,0.45)", alignSelf: "flex-end", paddingBottom: "3px" }}>/mo</span>
              </div>
            </div>

            <div style={{ width: "1px", height: "48px", background: "rgba(154,92,46,0.14)" }} />

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 2px" }}>One-Time Setup</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(27,20,13,0.45)" }}>$</span>
                <span style={{ fontSize: "38px", fontWeight: "900", color: "#1b140d", lineHeight: 1, letterSpacing: "-0.02em" }}>{product.setup_fee}</span>
              </div>
            </div>

            <div style={{ width: "1px", height: "48px", background: "rgba(154,92,46,0.14)" }} />

            <div style={{ flex: 1, minWidth: "120px" }}>
              <p style={{ fontSize: "8px", fontWeight: "800", color: "rgba(154,92,46,0.5)", textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 4px" }}>Includes</p>
              <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.6)", lineHeight: 1.5, margin: 0, fontWeight: "500" }}>
                Full setup, config, testing & ongoing management.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleToggle}
            style={{
              width: "100%", borderRadius: "9999px", padding: "2px",
              background: inCart
                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                : "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              border: "none", cursor: "pointer",
              boxShadow: inCart ? "0 6px 20px rgba(34,197,94,0.35)" : "0 6px 22px rgba(120,70,20,0.35)",
            }}
          >
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              height: "46px", borderRadius: "9999px",
              background: inCart
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
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

        <style>{`
          @keyframes modalStepIn {
            from { opacity: 0; transform: translateX(-8px); }
            to   { opacity: 1; transform: none; }
          }
        `}</style>
      </div>
    </div>
  );
}