import { motion } from "framer-motion";
import { revealItem } from "@/components/landing/PremiumHomepageMotion";

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function CascadingChecklistItem({ item }) {
  return (
    <motion.div
      className="hero-check-item"
      variants={revealItem}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        minHeight: "42px",
        padding: "9px 12px 9px 10px",
        borderRadius: "14px",
        border: "1px solid rgba(0,174,239,0.14)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,250,255,0.76))",
        boxShadow:
          "0 10px 26px rgba(0,80,160,0.07), inset 0 1px 0 rgba(255,255,255,0.75)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "linear-gradient(135deg, #00AEEF, #003B8F)",
          boxShadow: "0 0 16px rgba(0,174,239,0.28)",
        }}
      >
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          initial="hidden"
          animate="visible"
        >
          <motion.path
            d="M5 12.5l4.2 4.2L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkVariants}
          />
        </motion.svg>
      </span>
      <span
        style={{
          color: "rgba(27,20,13,0.78)",
          fontSize: "13px",
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        {item}
      </span>
    </motion.div>
  );
}
