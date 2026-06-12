/**
 * FounderOfferCard Component
 * Displays a single founder tier offer with savings callout
 */

import { motion } from "framer-motion";

export default function FounderOfferCard({ tier, offer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      style={{
        borderRadius: "18px",
        padding: "24px",
        background: "linear-gradient(135deg, #ffffff 0%, rgba(247,251,255,0.8) 100%)",
        border: "1.5px solid rgba(0,136,204,0.18)",
        boxShadow: "0 10px 28px rgba(0,59,143,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Savings Badge */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          borderRadius: "12px",
          padding: "6px 10px",
          background: "linear-gradient(135deg, #00AEEF, #00AEEF)",
          color: "#ffffff",
          fontSize: "9px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {offer.savings}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "32px", marginRight: "8px" }}>{offer.icon}</span>
        <h3 style={{ fontSize: "20px", fontWeight: "900", color: "#0A1628", margin: "0 0 4px" }}>
          {offer.name}
        </h3>
      </div>

      <div style={{ marginBottom: "18px", paddingBottom: "18px", borderBottom: "1px solid rgba(0,136,204,0.12)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px", fontWeight: "900", color: "#003B8F" }}>
            ${offer.founderSetupFee}
          </span>
          {offer.standardSetupFee > offer.founderSetupFee && (
            <span style={{ fontSize: "13px", color: "#999", textDecoration: "line-through" }}>
              ${offer.standardSetupFee}
            </span>
          )}
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", fontWeight: "600" }}>
            setup
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span style={{ fontSize: "24px", fontWeight: "900", color: "#0088CC" }}>
            ${offer.founderMonthly}
          </span>
          {offer.standardMonthly > offer.founderMonthly && (
            <span style={{ fontSize: "13px", color: "#999", textDecoration: "line-through" }}>
              ${offer.standardMonthly}
            </span>
          )}
          <span style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", fontWeight: "600" }}>
            /month
          </span>
          {offer.months && (
            <span style={{ fontSize: "11px", color: "#00AEEF", fontWeight: "700", marginLeft: "4px" }}>
              (for {offer.months}mo)
            </span>
          )}
        </div>
      </div>

      <button
        style={{
          width: "100%",
          minHeight: "44px",
          borderRadius: "999px",
          border: "none",
          background: "linear-gradient(135deg, #0088CC, #00AEEF)",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "800",
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(0,174,239,0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => (e.target.style.boxShadow = "0 10px 24px rgba(0,174,239,0.4)")}
        onMouseLeave={(e) => (e.target.style.boxShadow = "0 6px 16px rgba(0,174,239,0.3)")}
      >
        Get {offer.name}
      </button>
    </motion.div>
  );
}