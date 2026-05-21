import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useRef } from "react";

export const premiumEase = [0.22, 1, 0.36, 1];

export function HomepageMotionShell({ children }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: premiumEase }}
      style={{ minHeight: "100vh", position: "relative", isolation: "isolate", maxWidth: "100vw", overflowX: "clip" }}
    >
      <motion.div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #00AEEF, #009DFF, #003B8F)",
          boxShadow: "0 0 18px rgba(0,174,239,0.55)",
          scaleX: scrollYProgress,
          transformOrigin: "left",
          zIndex: 80,
        }}
      />
      <div className="homepage-cinematic-atmosphere" aria-hidden="true">
        <span className="homepage-cinematic-atmosphere__grain" />
        <span className="homepage-cinematic-atmosphere__scan" />
        <span className="homepage-cinematic-atmosphere__vignette" />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <style>{`
        .homepage-cinematic-atmosphere {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          contain: paint;
          max-width: 100vw;
        }
        .homepage-cinematic-atmosphere__grain {
          position: absolute;
          inset: 0;
          opacity: 0.18;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(0,174,239,0.08) 0 1px, transparent 1px),
            radial-gradient(circle at 70% 60%, rgba(0,59,143,0.07) 0 1px, transparent 1px);
          background-size: 24px 24px, 32px 32px;
          mix-blend-mode: multiply;
        }
        .homepage-cinematic-atmosphere__scan {
          position: absolute;
          top: -20%;
          left: -40%;
          width: 60%;
          height: 140%;
          background: linear-gradient(105deg, transparent 0%, rgba(0,174,239,0.06) 45%, rgba(0,174,239,0.16) 50%, rgba(0,174,239,0.05) 55%, transparent 100%);
          transform: skewX(-18deg);
          animation: csCinematicScan 9s ease-in-out infinite;
        }
        .homepage-cinematic-atmosphere__vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 18%, transparent 0%, transparent 45%, rgba(0,23,56,0.035) 100%),
            linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(0,80,160,0.025) 100%);
        }
        .cinematic-text-sheen {
          background-image: linear-gradient(110deg, #00AEEF 0%, #00AEEF 36%, #9eeaff 50%, #00AEEF 64%, #0088CC 100%);
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent !important;
          animation: csTextSheen 5s ease-in-out infinite;
        }
        .cinematic-corner-card::before,
        .cinematic-corner-card::after {
          content: "";
          position: absolute;
          width: 34px;
          height: 34px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.28s ease, transform 0.28s ease;
        }
        .cinematic-corner-card::before {
          top: 10px;
          left: 10px;
          border-top: 1px solid rgba(0,174,239,0.55);
          border-left: 1px solid rgba(0,174,239,0.55);
          transform: translate(5px, 5px);
        }
        .cinematic-corner-card::after {
          right: 10px;
          bottom: 10px;
          border-right: 1px solid rgba(0,174,239,0.55);
          border-bottom: 1px solid rgba(0,174,239,0.55);
          transform: translate(-5px, -5px);
        }
        .cinematic-corner-card:hover::before,
        .cinematic-corner-card:hover::after {
          opacity: 1;
          transform: translate(0, 0);
        }
        .cinematic-orbit-ring {
          position: absolute;
          inset: -22px;
          border-radius: 42px;
          border: 1px solid rgba(0,174,239,0.18);
          pointer-events: none;
          animation: csOrbitRing 16s linear infinite;
        }
        .cinematic-orbit-ring::before {
          content: "";
          position: absolute;
          top: -4px;
          left: 50%;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #00AEEF;
          box-shadow: 0 0 18px rgba(0,174,239,0.85);
        }
        .cinematic-orbit-ring--two {
          inset: -38px;
          animation-duration: 22s;
          animation-direction: reverse;
          opacity: 0.65;
        }
        .cinematic-pulse-rings {
          position: absolute;
          inset: -10px;
          border-radius: inherit;
          pointer-events: none;
          overflow: hidden;
        }
        .cinematic-pulse-rings::before,
        .cinematic-pulse-rings::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.42);
          animation: csPulseRing 2.8s ease-out infinite;
        }
        .cinematic-pulse-rings::after {
          animation-delay: 1.35s;
        }
        .cinematic-data-pulse {
          position: relative;
        }
        .cinematic-data-pulse::after {
          content: "";
          position: absolute;
          left: 18px;
          top: 28px;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #00AEEF;
          box-shadow: 0 0 16px rgba(0,174,239,0.75);
          animation: csDataPulse 2.4s ease-in-out infinite;
        }
        .cinematic-icon-badge {
          background: linear-gradient(135deg, rgba(0,174,239,0.12), rgba(0,59,143,0.08));
          border: 1px solid rgba(0,174,239,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
        }
        .cinematic-gradient-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          padding: 2px;
          border: none;
          background: linear-gradient(135deg, #00AEEF 0%, #009DFF 45%, #003B8F 100%);
          box-shadow: 0 4px 18px rgba(0,174,239,0.4), 0 16px 38px rgba(0,59,143,0.16);
          cursor: pointer;
          text-decoration: none;
        }
        .cinematic-gradient-button__inner {
          position: relative;
          z-index: 1;
          display: inline-flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9999px;
          padding: 0 34px;
          background: linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%);
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 800;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          white-space: nowrap;
        }
        @keyframes csCinematicScan {
          0%, 18% { transform: translateX(0) skewX(-18deg); opacity: 0; }
          28%, 70% { opacity: 1; }
          100% { transform: translateX(180vw) skewX(-18deg); opacity: 0; }
        }
        @keyframes csTextSheen {
          0%, 18% { background-position: 0% 50%; }
          54%, 100% { background-position: 100% 50%; }
        }
        @keyframes csOrbitRing {
          to { transform: rotate(360deg); }
        }
        @keyframes csPulseRing {
          0% { opacity: 0.65; transform: scale(0.92); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        @keyframes csDataPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.72); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @media (max-width: 720px) {
          .homepage-cinematic-atmosphere__scan {
            width: 90%;
            animation-duration: 11s;
          }
          .cinematic-orbit-ring {
            display: none;
          }
          .cinematic-gradient-button,
          .cinematic-gradient-button__inner {
            width: 100%;
          }
          .cinematic-gradient-button__inner {
            min-height: 50px;
            padding: 0 22px;
            white-space: normal;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .homepage-cinematic-atmosphere__scan,
          .cinematic-text-sheen,
          .cinematic-orbit-ring,
          .cinematic-pulse-rings::before,
          .cinematic-pulse-rings::after,
          .cinematic-data-pulse::after {
            animation: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export function CinematicSectionDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: "clamp(36px, 7vw, 72px)",
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <motion.span
        initial={{ x: "-45%", opacity: 0 }}
        whileInView={{ x: "45%", opacity: [0, 1, 0] }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 1.8, ease: premiumEase }}
        style={{
          position: "absolute",
          top: "50%",
          left: "20%",
          width: "60%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0,174,239,0.28), rgba(0,174,239,0.78), rgba(0,174,239,0.28), transparent)",
          boxShadow: "0 0 22px rgba(0,174,239,0.34)",
        }}
      />
    </div>
  );
}

export function CinematicPulseRings({ className = "" }) {
  return <span className={`cinematic-pulse-rings ${className}`} aria-hidden="true" />;
}

export function MotionIconBadge({ children, className = "", ...props }) {
  return (
    <motion.div
      className={`cinematic-icon-badge flex items-center justify-center ${className}`}
      whileHover={{ rotate: 5, scale: 1.08 }}
      transition={{ duration: 0.24, ease: premiumEase }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CinematicButton({
  children,
  className = "",
  innerClassName = "",
  strength = 0.12,
  type = "button",
  ...props
}) {
  const { style, ...buttonProps } = props;
  const magnetic = useMagneticMotion(strength);

  return (
    <motion.button
      ref={magnetic.ref}
      type={type}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className={`cinematic-gradient-button focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      style={{
        ...magnetic.motionStyle,
        ...style,
      }}
      {...magnetic.magneticHandlers}
      {...buttonProps}
    >
      <CinematicPulseRings />
      <span className={`cinematic-gradient-button__inner ${innerClassName}`}>
        {children}
      </span>
    </motion.button>
  );
}

export function CinematicCard({ as: Component = motion.div, children, className = "", ...props }) {
  return (
    <Component
      className={`cinematic-corner-card relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function MotionSection({ children, delay = 0, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: premiumEase }}
    >
      {children}
    </motion.div>
  );
}

export function useMagneticMotion(strength = 0.16) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 24, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 280, damping: 24, mass: 0.45 });

  const onPointerMove = (event) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {
    ref,
    motionStyle: { x: springX, y: springY },
    magneticHandlers: { onPointerMove, onPointerLeave },
  };
}

export const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export const revealItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: premiumEase },
  },
};
