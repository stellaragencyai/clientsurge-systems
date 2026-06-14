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

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94]);

  return (
    <section
      ref={sectionRef}
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100svh",
        width: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Full-viewport cinematic background image with parallax ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-10%",
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          y: reduceMotion ? 0 : bgY,
          zIndex: 0,
        }}
      />

      {/* ── Dark cinematic gradient overlay — ensures text legibility ── */}
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(2,8,20,0.72) 0%, rgba(2,8,30,0.55) 50%, rgba(2,8,20,0.80) 100%)",
        zIndex: 1,
      }} />

      {/* ── Subtle electric tint layer ── */}
      <div aria-hidden="true" style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 0%, rgba(0,174,239,0.18) 0%, transparent 65%)",
        zIndex: 2,
      }} />

      {/* ── Cinematic grid overlay ── */}
      <div aria-hidden="true" className="landing-hero__cinematicGrid" style={{ zIndex: 3 }} />

      {/* ── Content ── */}
      <motion.div
        className="landing-hero__inner"
        style={{
          position: "relative",
          zIndex: 4,
          width: "100%",
          maxWidth: "920px",
          margin: "0 auto",
          padding: "clamp(8rem, 14vw, 11rem) clamp(1.5rem, 5vw, 3rem) clamp(5rem, 8vw, 7rem)",
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
          {/* Glass Badge */}
          <motion.div variants={heroRevealItem} style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              borderRadius: "999px",
              padding: "7px 18px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#a8e8ff",
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

          {/* Headline — white on dark bg */}
          <motion.h1
            className="landing-hero__headline"
            variants={heroRevealItem}
            style={{
              fontFamily: "'Montserrat', 'Trebuchet MS', sans-serif",
              fontSize: "clamp(2.8rem, 6.5vw, 4.6rem)",
              fontWeight: "900",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              margin: "0",
              textShadow: "0 2px 32px rgba(0,0,0,0.5)",
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
            style={{ margin: "20px auto 24px" }}
          />

          {/* Sub-headline — light on dark */}
          <motion.p
            className="landing-hero__body"
            variants={heroRevealItem}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontSize: "clamp(1.05rem, 2.4vw, 1.22rem)",
              color: "rgba(220,235,255,0.88)",
              lineHeight: 1.75,
              maxWidth: "680px",
              margin: "0 auto 40px",
              fontWeight: "400",
              letterSpacing: "-0.003em",
              textShadow: "0 1px 8px rgba(0,0,0,0.4)",
            }}
          >
            Don't just launch a website. We install the complete automation stack that captures every lead, recovers every missed call, and books appointments for you 24/7.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={heroRevealItem}
            style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <a
              href="/book"
              className="hero-primary-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "54px",
                padding: "0 32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00AEEF 0%, #0099d4 40%, #0088CC 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 0 0 1px rgba(0,174,239,0.5), 0 0 24px rgba(0,174,239,0.5), 0 4px 16px rgba(0,159,212,0.4)",
                transition: "box-shadow 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1.5px rgba(0,174,239,0.9), 0 0 40px rgba(0,174,239,0.75), 0 4px 24px rgba(0,159,212,0.55)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,174,239,0.5), 0 0 24px rgba(0,174,239,0.5), 0 4px 16px rgba(0,159,212,0.4)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(-1px) scale(0.98)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1)"; }}
            >
              Get Your Free Automation Audit
            </a>
            {/* Glass secondary CTA */}
            <a
              href="/store"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "54px",
                padding: "0 30px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "background 0.3s ease, border-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
              }}
            >
              View Systems &amp; Pricing
            </a>
          </motion.div>

          {/* Glass stat cards */}
          <motion.div
            variants={heroRevealItem}
            style={{
              marginTop: "52px",
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
               { value: "6", label: "AI Automations Installed" },
               { value: "24/7", label: "Lead Response Coverage" },
               { value: "48hr", label: "Average Go-Live Time" },
             ].map(({ value, label }) => (
               <div key={label} style={{
                 textAlign: "center",
                 background: "rgba(255,255,255,0.08)",
                 backdropFilter: "blur(20px)",
                 WebkitBackdropFilter: "blur(20px)",
                 border: "1px solid rgba(255,255,255,0.15)",
                 borderRadius: "14px",
                 padding: "18px 28px",
                 minWidth: "120px",
               }}>
                 <div style={{ fontSize: "2.1rem", fontWeight: 900, color: "#00AEEF", lineHeight: 1, fontFamily: "'Montserrat', sans-serif", textShadow: "0 0 20px rgba(0,174,239,0.6)" }}>{value}</div>
                 <div style={{ fontSize: "11px", color: "rgba(200,225,255,0.75)", marginTop: "8px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
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
          color: #5dd9ff !important;
          text-shadow: 0 0 32px rgba(0, 174, 239, 0.75), 0 0 60px rgba(0, 174, 239, 0.35);
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