import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { premiumEase } from "@/components/landing/PremiumHomepageMotion";

const heroCopyReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.74,
      ease: premiumEase,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const heroRevealItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease: premiumEase },
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

  return (
    <section
      ref={sectionRef}
      className="landing-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "92svh",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Parallax background layer ── */}
      {/* To use a real photo: replace `background` with `backgroundImage: "url('YOUR_URL')"` */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-20%",
          y: reduceMotion ? 0 : bgY,
          willChange: "transform",
          background: "linear-gradient(160deg, #0a1628 0%, #0d2447 30%, #071535 60%, #050e22 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />

      {/* ── Dark overlay for text readability ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(5,14,34,0.72) 0%, rgba(5,14,34,0.55) 50%, rgba(5,14,34,0.80) 100%)",
          zIndex: 1,
        }}
      />

      {/* ── Subtle blue radial glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,174,239,0.18) 0%, transparent 65%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── Cinematic grid overlay ── */}
      <div aria-hidden="true" className="landing-hero__cinematicGrid" style={{ zIndex: 1 }} />

      {/* ── Content ── */}
      <div
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
            <a
              href="/book"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "52px",
                padding: "0 28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #009FD4 0%, #007AAA 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 0 28px rgba(0,159,212,0.55), 0 4px 16px rgba(0,159,212,0.35)",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 44px rgba(0,159,212,0.8), 0 8px 24px rgba(0,159,212,0.55)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 28px rgba(0,159,212,0.55), 0 4px 16px rgba(0,159,212,0.35)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
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
      </div>

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
          .landing-hero__headlineBeam {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}