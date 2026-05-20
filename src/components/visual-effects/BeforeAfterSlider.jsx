import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function BeforeAfterSlider({ before, after, beforeLabel = "Before", afterLabel = "After" }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, newPosition)));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "col-resize",
        userSelect: "none",
        background: "#f0f0f0",
      }}
    >
      {/* After (background) */}
      <div style={{ position: "absolute", inset: 0 }}>
        {after}
      </div>

      {/* Before (foreground, clipped) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          width: `${position}%`,
          transition: "width 0.1s ease-out",
        }}
      >
        {before}
      </div>

      {/* Divider */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: `${position}%`,
          width: "3px",
          height: "100%",
          background: "linear-gradient(90deg, #c8965c, #f5d9a8, #c8965c)",
          transform: "translateX(-50%)",
          boxShadow: "0 0 20px rgba(200,150,92,0.6)",
        }}
      />

      {/* Labels */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {beforeLabel}
      </div>
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {afterLabel}
      </div>
    </div>
  );
}