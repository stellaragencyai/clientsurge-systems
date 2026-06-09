import { useEffect, useRef } from "react";

// Floating stat badges that drift above hero content
export function FloatingStatBadges({ stats }) {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            animation: `floatBadge ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
          }}
        >
          <span style={{ fontSize: "14px" }}>{stat.icon}</span>
          <span className="text-xs font-bold text-white/90">{stat.value}</span>
          <span className="text-[10px] text-white/60">{stat.shortLabel || stat.label}</span>
        </div>
      ))}
      <style>{`
        @keyframes floatBadge {
          from { transform: translateY(0px); }
          to   { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// Scroll-down indicator
export function ScrollIndicator() {
  const ref = useRef(null);

  useEffect(() => {
    const handler = () => {
      if (ref.current) {
        ref.current.style.opacity = window.scrollY > 80 ? "0" : "1";
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
      style={{ transition: "opacity 0.3s ease", pointerEvents: "none" }}
    >
      <div
        className="w-6 h-9 rounded-full border-2 flex items-start justify-center pt-1.5"
        style={{ borderColor: "rgba(255,255,255,0.3)" }}
      >
        <div
          className="w-1 h-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.7)", animation: "scrollDot 1.5s ease-in-out infinite" }}
        />
      </div>
      <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>Scroll</span>
      <style>{`
        @keyframes scrollDot {
          0%,100% { transform: translateY(0); opacity: 1; }
          50%      { transform: translateY(8px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// Industry-specific hero gradient overlay (on top of background image)
export function IndustryHeroOverlay({ industry }) {
  const overlays = {
    hvac: "linear-gradient(120deg, rgba(0,59,143,0.82) 0%, rgba(0,136,204,0.55) 55%, rgba(0,174,239,0.22) 100%)",
    roofing: "linear-gradient(120deg, rgba(15,23,42,0.88) 0%, rgba(0,59,143,0.62) 55%, rgba(0,136,204,0.2) 100%)",
    contractors: "linear-gradient(120deg, rgba(30,27,30,0.88) 0%, rgba(91,79,207,0.5) 55%, rgba(0,136,204,0.2) 100%)",
    "med-spa": "linear-gradient(120deg, rgba(76,29,149,0.78) 0%, rgba(139,92,246,0.5) 55%, rgba(236,72,153,0.2) 100%)",
    dental: "linear-gradient(120deg, rgba(0,59,143,0.82) 0%, rgba(0,136,204,0.55) 55%, rgba(0,174,239,0.22) 100%)",
    chiropractic: "linear-gradient(120deg, rgba(14,116,144,0.82) 0%, rgba(0,136,204,0.5) 55%, rgba(0,174,239,0.2) 100%)",
  };

  return (
    <div
      className="absolute inset-0 z-[1]"
      style={{ background: overlays[industry] || overlays.hvac, mixBlendMode: "multiply" }}
    />
  );
}