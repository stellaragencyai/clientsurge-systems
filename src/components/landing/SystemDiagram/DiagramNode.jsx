import { motion } from "framer-motion";

export default function DiagramNode({ node, isActive, isHighlighted, onClick, style = {} }) {
  const isService = node.type === "service";
  const isTrigger = node.type === "trigger";
  const isOutcome = node.type === "outcome";
  const isSystem = node.type === "system";

  const baseSize = isService ? 88 : isTrigger ? 80 : isOutcome ? 80 : 72;

  return (
    <motion.div
      onClick={() => onClick(node)}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * (node.order || 0), type: "spring", stiffness: 280, damping: 22 }}
      whileHover={{ scale: 1.08, y: -3 }}
      whileTap={{ scale: 0.96 }}
      style={{
        position: "absolute",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px",
        userSelect: "none",
        zIndex: isActive ? 10 : 3,
        ...style,
      }}
    >
      {/* Node circle */}
      <div
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          borderRadius: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          background: isActive
            ? `radial-gradient(circle at 35% 35%, ${node.color}ff, ${node.color}bb)`
            : `radial-gradient(circle at 35% 35%, ${node.color}22, ${node.color}11)`,
          border: `2.5px solid ${isActive ? node.color : node.color + "55"}`,
          boxShadow: isActive
            ? `0 0 0 6px ${node.color}22, 0 8px 24px ${node.color}44`
            : isHighlighted
            ? `0 0 0 3px ${node.color}33`
            : "0 4px 12px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
          position: "relative",
        }}
      >
        {/* Pulse ring for active */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "50%",
              border: `2px solid ${node.color}44`,
              animation: "diagramPulse 2s ease-in-out infinite",
            }}
          />
        )}

        <span style={{ fontSize: isService ? "22px" : "20px", lineHeight: 1 }}>{node.icon}</span>
        {node.stat && (
          <span
            style={{
              fontSize: "8px",
              fontWeight: "800",
              color: isActive ? "rgba(255,255,255,0.9)" : node.color,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.2,
              padding: "0 6px",
            }}
          >
            {node.stat}
          </span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          color: isActive ? node.color : "rgba(15,20,40,0.75)",
          textAlign: "center",
          maxWidth: "80px",
          lineHeight: 1.3,
          transition: "color 0.3s ease",
        }}
      >
        {node.label}
      </div>
    </motion.div>
  );
}