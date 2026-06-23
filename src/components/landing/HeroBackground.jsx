import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Reusable cinematic hero background.
 * - If videoUrl is provided AND user is on desktop AND no reduced motion: render looping muted video.
 * - Otherwise: animated fallback with dark gradients, blue/purple glow, blurred dashboard shapes, grid texture.
 * - Dark overlay always applied for text readability.
 */
export default function HeroBackground({ videoUrl, posterUrl }) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const showVideo = videoUrl && !shouldReduceMotion && !isMobile;

  if (showVideo) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={posterUrl}
          className="w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(10,14,39,0.72) 0%, rgba(10,14,39,0.88) 100%)" }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#0A0E27" }}>
      {/* Base radial gradients — blue + purple glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 18% 25%, rgba(0,174,239,0.16) 0%, transparent 50%), radial-gradient(ellipse at 82% 70%, rgba(124,58,237,0.18) 0%, transparent 50%)",
        }}
      />

      {/* Animated glow orbs */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              top: "12%",
              left: "8%",
              width: 340,
              height: 340,
              background: "radial-gradient(circle, rgba(0,174,239,0.22), transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: "8%",
              right: "6%",
              width: 380,
              height: 380,
              background: "radial-gradient(circle, rgba(124,58,237,0.22), transparent 70%)",
              filter: "blur(70px)",
            }}
            animate={{ x: [0, -25, 0], y: [0, -18, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* Blurred dashboard shapes */}
      <div
        className="absolute hidden md:block"
        style={{
          top: "22%",
          right: "14%",
          width: 220,
          height: 130,
          borderRadius: 12,
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.06)",
          filter: "blur(3px)",
        }}
      />
      <div
        className="absolute hidden md:block"
        style={{
          bottom: "18%",
          left: "10%",
          width: 170,
          height: 110,
          borderRadius: 12,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)",
          filter: "blur(4px)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
        }}
      />

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(10,14,39,0.35) 0%, rgba(10,14,39,0.55) 100%)" }}
      />
    </div>
  );
}