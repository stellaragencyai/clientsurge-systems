import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Refinement #4: Custom spring cubic-bezier — eliminates mechanical browser defaults
const springEase = [0.34, 1.56, 0.64, 1];
const smoothEase = [0.25, 0.46, 0.45, 0.94];

// Refinement #3: Stagger tightened to 80ms for rhythmic discovery feel
const heroCopyReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: smoothEase,
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const heroRevealItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.56, ease: smoothEase },
  },
};

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax: background moves at 40% of scroll speed (slower = depth)
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  // Refinement #1: Scroll-driven content fade — hero content fades+scales out as user scrolls
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94]);

  return (
    <section
      ref={sectionRef}
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "92svh",
        width: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Parallax background layer ── */}
      {/* To use a real photo: replace `background` with `backgroundImage: "url('YOUR_URL')"` */}


      {/* Refinement #2: Orbital glow orbs — living, breathing atmosphere */}
      <div aria-hidden="true" className="hero-orb hero-orb-1" />
      <div aria-hidden="true" className="hero-orb hero-orb-2" />
      <div aria-hidden="true" className="hero-orb hero-orb-3" />

      {/* ── Cinematic grid overlay ── */}
      <div aria-hidden="true" className="landing-hero__cinematicGrid" style={{ zIndex: 1 }} />

      {/* ── Content — Refinement #1: scroll-driven opacity+scale ── */}
      <motion.div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "clamp(7rem, 12vw, 10rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 7vw, 6rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          opacity: reduceMotion ? 1 : contentOpacity,
          scale: reduceMotion ? 1 : contentScale,
        }}
      >
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate={reduceMotion ? undefined : "visible"}
          variants={heroCopyReveal}
          style={{ width: "100%" }}
        >
          {/* Badge */}
          <motion.div variants={heroRevealItem} style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              borderRadius: "999px",
              padding: "6px 16px",
              background: "rgba(0,174,239,0.15)",
              border: "1px solid rgba(0,174,239,0.35)",
              color: "#66d9ff",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "999px",
                background: "#00AEEF",
                display: "inline-block",
                animation: "heroPulse 2s infinite",
              }} />
              AI Growth Systems for Local Businesses
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="landing-hero__headline"
            variants={heroRevealItem}
            style={{
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "clamp(2.4rem, 5.5vw, 3.75rem)",
              fontWeight: "800",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              margin: "0",
            }}
          >
            We Build the AI Growth Engines{" "}
            <span className="landing-hero__headlineAccent">
              That Turn Your Website Into a Booking Machine.
            </span>
          </motion.h1>

          {/* Beam divider */}
          <motion.div
            aria-hidden="true"
            className="landing-hero__headlineBeam"
            variants={heroRevealItem}
            style={{ margin: "18px auto 22px" }}
          />

          {/* Sub-headline */}
          <motion.p
            className="landing-hero__body"
            variants={heroRevealItem}
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.15rem)",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.65,
              maxWidth: "660px",
              margin: "0 auto 32px",
            }}
          >
            Don't just launch a website. We install the complete automation stack that captures every lead, recovers every missed call, and books appointments for you 24/7.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={heroRevealItem}
            style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
          >
            {/* Refinement #6: Glow-border pulsing CTA + #7: depress on click */}
            <a
              href="/book"
              className="hero-primary-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "52px",
                padding: "0 30px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 0 0 1px rgba(0,174,239,0.5), 0 0 12px rgba(0, 174, 239, 0.38), 0 4px 12px rgba(0,159,212,0.3)",
                transition: "box-shadow 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1.5px rgba(0,174,239,0.85), 0 0 32px rgba(0,159,212,0.7), 0 4px 20px rgba(0,159,212,0.45)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,174,239,0.5), 0 0 12px rgba(0, 174, 239, 0.38), 0 4px 12px rgba(0,159,212,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(-1px) scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1)"; }}
            >
              Get Your Free Automation Audit
            </a>
            <a
              href="/store"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "52px",
                padding: "0 28px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "background 0.3s ease, border-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              }}
            >
              View Systems &amp; Pricing
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            variants={heroRevealItem}
            style={{
              marginTop: "44px",
              display: "flex",
              gap: "36px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "6", label: "AI Automations Installed" },
              { value: "24/7", label: "Lead Response Coverage" },
              { value: "48hr", label: "Average Go-Live Time" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.50)", marginTop: "5px", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        .landing-hero__cinematicGrid {
          position: absolute;
          inset: 0;
          opacity: 0.14;
          background-image:
            linear-gradient(rgba(0,174,239,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,174,239,0.15) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 22%, black 64%, transparent 100%);
          animation: heroCinematicGridDrift 14s linear infinite;
          will-change: transform;
          transform: translateZ(0);
        }
        @media (max-width: 768px) {
          .landing-hero__cinematicGrid { display: none !important; }
        }
        .landing-hero__headlineAccent {
          display: block;
          color: #66d9ff !important;
          text-shadow: 0 0 24px rgba(0, 174, 239, 0.6), 0 0 50px rgba(0, 174, 239, 0.28);
        }
        .landing-hero__headlineBeam {
          width: min(480px, 80vw);
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(0,174,239,0.05), rgba(0,174,239,0.7), rgba(0,59,143,0.2), rgba(0,174,239,0.05));
          box-shadow: 0 0 22px rgba(0,174,239,0.35);
          animation: heroHeadlineBeam 3.4s ease-in-out infinite;
        }
        @keyframes heroCinematicGridDrift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(42px, 42px, 0); }
        }
        @keyframes heroHeadlineBeam {
          0%, 100% { opacity: 0.5; transform: scaleX(0.72); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes heroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (max-width: 640px) {
          .landing-hero__inner {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }
          .landing-hero__headline {
            font-size: clamp(2rem, 8vw, 2.6rem) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-hero__cinematicGrid,
          .landing-hero__headlineBeam,
          .hero-orb {
            animation: none !important;
          }
        }
        /* Refinement #2: Orbital glow orbs */
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(72px);
          will-change: transform, opacity;
          z-index: 1;
        }
        .hero-orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(0,174,239,0.14) 0%, transparent 70%);
          top: -10%; left: -8%;
          animation: orbDrift1 18s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(0,59,143,0.16) 0%, transparent 70%);
          bottom: 0%; right: -5%;
          animation: orbDrift2 24s ease-in-out infinite;
        }
        .hero-orb-3 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(0,174,239,0.10) 0%, transparent 70%);
          top: 40%; left: 60%;
          animation: orbDrift3 20s ease-in-out infinite;
        }
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          33% { transform: translate(40px, 30px) scale(1.08); opacity: 1; }
          66% { transform: translate(-20px, 50px) scale(0.95); opacity: 0.7; }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          40% { transform: translate(-50px, -30px) scale(1.1); opacity: 0.9; }
          70% { transform: translate(30px, -50px) scale(0.92); opacity: 0.6; }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-40px, 20px) scale(1.15); opacity: 0.8; }
        }
        /* Refinement #6: Glow border pulse on primary CTA */
        .hero-primary-cta {
          animation: heroCtaGlowPulse 3s ease-in-out infinite;
        }
        @keyframes heroCtaGlowPulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0,174,239,0.5), 0 0 28px rgba(0,159,212,0.55), 0 4px 16px rgba(0,159,212,0.35); }
          50% { box-shadow: 0 0 0 2px rgba(0,174,239,0.75), 0 0 40px rgba(0,159,212,0.7), 0 6px 24px rgba(0,159,212,0.5); }
        }
        .hero-primary-cta:hover {
          animation: none;
        }
      `}</style>
    </section>
  );
}