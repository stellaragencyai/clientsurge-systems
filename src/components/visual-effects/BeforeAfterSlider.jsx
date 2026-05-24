import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function BeforeAfterSlider({ before, after, beforeLabel = "Before", afterLabel = "After" }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef(null);

  const updatePosition = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, newPosition)));
  };

  const handleMouseMove = (e) => {
    updatePosition(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!e.touches[0]) return;
    updatePosition(e.touches[0].clientX);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPosition((current) => Math.max(0, current - 5));
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPosition((current) => Math.min(100, current + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={`${beforeLabel} and ${afterLabel} comparison slider`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "col-resize",
        userSelect: "none",
        touchAction: "pan-y",
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
          background: "linear-gradient(90deg, #00AEEF, #DDF4FF, #00AEEF)",
          transform: "translateX(-50%)",
          boxShadow: "0 0 20px rgba(0,174,239,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #0088CC, #00AEEF)",
            border: "2px solid #ffffff",
            boxShadow: "0 8px 24px rgba(0, 136, 204, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
          }}
        >
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              style={{
                width: "2px",
                height: "16px",
                borderRadius: "9999px",
                background: "#ffffff",
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      </motion.div>

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
