import { motion, useReducedMotion } from "framer-motion";

export const premiumEase = [0.22, 1, 0.36, 1];

export function MotionStyleShield() {
  return (
    <style>{`
      .cs-motion-node {
        opacity: var(--cs-motion-opacity, 1) !important;
        will-change: transform, filter, opacity, background-position;
      }
      .cs-premium-card {
        transform-style: preserve-3d;
        backface-visibility: hidden;
      }
      .cs-cinematic-sheen {
        position: relative;
        isolation: isolate;
        overflow: hidden;
      }
      .cs-cinematic-sheen::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.16) 42%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.12) 58%, transparent 100%);
        transform: translateX(-135%);
        transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
        z-index: 1;
      }
      .cs-cinematic-sheen:hover::after {
        transform: translateX(135%);
      }
      .cs-orbital-ring {
        border: 1px solid rgba(53, 189, 241, 0.18);
        box-shadow: 0 0 48px rgba(53, 189, 241, 0.14), inset 0 0 32px rgba(53, 189, 241, 0.05);
      }
      .cs-motion-safe-gradient-text {
        background: linear-gradient(100deg, #ffffff 0%, #eaf8ff 38%, #35bdf1 52%, #ffffff 72%, #ffffff 100%);
        background-size: 240% 100%;
        -webkit-background-clip: text;
        background-clip: text;
      }
      @media (prefers-reduced-motion: reduce) {
        .cs-motion-node {
          transform: none !important;
          filter: none !important;
        }
        .cs-cinematic-sheen::after {
          display: none;
        }
      }
    `}</style>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  amount = 0.22,
  duration = 0.72,
  as = "div",
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (shouldReduceMotion) {
    const StaticComponent = as;
    return (
      <StaticComponent className={className} {...props}>
        {children}
      </StaticComponent>
    );
  }

  return (
    <Component
      className={`cs-motion-node ${className}`.trim()}
      initial={{ "--cs-motion-opacity": 0, y, filter: "blur(10px)" }}
      whileInView={{ "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: premiumEase }}
      viewport={{ once: true, amount }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerGroup({ children, className = "", delayChildren = 0.08, staggerChildren = 0.08, ...props }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px", amount: 0.18 }}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren, staggerChildren } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", y = 22, duration = 0.62, ...props }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      className={`cs-motion-node ${className}`.trim()}
      variants={{
        hidden: { "--cs-motion-opacity": 0, y, filter: "blur(8px)" },
        visible: { "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)", transition: { duration, ease: premiumEase } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PremiumHoverCard({ children, className = "", style, lift = 8, glow = "0 24px 70px rgba(0, 174, 239, 0.18)", ...props }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={`cs-premium-card ${className}`.trim()} style={style} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`cs-motion-node cs-premium-card ${className}`.trim()}
      variants={{
        hidden: { "--cs-motion-opacity": 0, y: 22, filter: "blur(8px)" },
        visible: { "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)", transition: { duration: 0.62, ease: premiumEase } },
      }}
      whileHover={{ y: -lift, scale: 1.012, boxShadow: glow }}
      whileTap={{ scale: 0.992 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      style={{ ...style, transformPerspective: 1200 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CinematicOrbitalFrame({ className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()} aria-hidden="true">
      <motion.div
        className="cs-orbital-ring absolute left-1/2 top-1/2 rounded-full"
        style={{ width: "min(72vw, 920px)", height: "min(72vw, 920px)", x: "-50%", y: "-50%" }}
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="cs-orbital-ring absolute left-1/2 top-1/2 rounded-full"
        style={{ width: "min(54vw, 680px)", height: "min(54vw, 680px)", x: "-50%", y: "-50%" }}
        animate={shouldReduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[1px] w-[120vw] origin-center"
        style={{ x: "-50%", y: "-50%", background: "linear-gradient(90deg, transparent, rgba(53,189,241,0.18), transparent)" }}
        animate={shouldReduceMotion ? undefined : { rotate: [0, 8, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
