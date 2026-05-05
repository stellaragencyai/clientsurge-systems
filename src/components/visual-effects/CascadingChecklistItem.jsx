import { motion } from "framer-motion";

const checkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 }
};

export default function CascadingChecklistItem({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03, boxShadow: "0 6px 24px rgba(0,174,239,0.18)" }}
      transition={{
        duration: 0.55,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true, margin: "-60px" }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "7px 14px 7px 10px",
        borderRadius: "9999px",
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(0,174,239,0.18)",
        boxShadow: "0 2px 12px rgba(0,174,239,0.08)",
        width: "fit-content",
        cursor: "default",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)"
      }} className=" hidden">
      
      {/* Animated check circle */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        whileInView={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 18,
          delay: index * 0.1 + 0.25
        }}
        viewport={{ once: true }}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          flexShrink: 0,
          background: "linear-gradient(135deg,#26b05f,#16a34a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 14px rgba(34,199,89,0.45), 0 2px 6px rgba(34,197,94,0.25)"
        }}>
        
        <motion.svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.4 }}>
          
          <motion.path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkVariants}
            transition={{ duration: 0.35, ease: "easeOut" }} />
          
        </motion.svg>
      </motion.div>

      {/* Text with slight slide-in */}
      <motion.span
        initial={{ opacity: 0, x: -6 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.3, ease: "easeOut" }}
        viewport={{ once: true }}
        style={{ fontSize: "12px", fontWeight: "600", color: "rgba(27,20,13,0.8)", lineHeight: 1.4 }}>
        
        {item}
      </motion.span>
    </motion.div>);

}