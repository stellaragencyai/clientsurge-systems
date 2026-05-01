import { motion } from "framer-motion";

export default function CascadingChecklistItem({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: "easeOut",
      }}
      viewport={{ once: true, margin: "-80px" }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 14px 7px 10px",
        borderRadius: "9999px",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(200,150,92,0.22)",
        boxShadow: "0 2px 8px rgba(122,72,37,0.06)",
        width: "fit-content",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          flexShrink: 0,
          background: "linear-gradient(135deg,#26b05f,#16a34a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 12px rgba(34,199,89,0.4), 0 2px 6px rgba(34,197,94,0.25)",
        }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(27,20,13,0.8)", lineHeight: 1.4 }}>
        {item}
      </span>
    </motion.div>
  );
}