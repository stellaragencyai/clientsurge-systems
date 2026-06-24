import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import HeroTrustLogos from "./HeroTrustLogos.jsx";

const AUTOMATION_PILLS = [
  { label: "Lead Capture", icon: "📥" },
  { label: "Missed-Call Recovery", icon: "☎️" },
  { label: "Instant Follow-Up", icon: "⚡" },
  { label: "AI Booking", icon: "📅" },
  { label: "Review Requests", icon: "⭐" },
  { label: "Lead Reactivation", icon: "🔄" },
];

export default function CinematicHero({ videoUrl, posterUrl }) {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
      aria-label="AI Automation Command Center"
    >
      {/* Dark cinematic background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Deep navy base with radial gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, #0A1B38 0%, #061025 100%)" }}
        />

        {/* Subtle circular rings */}
        {!shouldReduceMotion && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, transparent 10%, #08142C 20%, transparent 30%),
                radial-gradient(circle at center, transparent 35%, rgba(53, 189, 241, 0.05) 40%, transparent 50%)
              `,
              opacity: 0.6,
            }}
          />
        )}

        {/* Cyan glow accent orbs */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                top: "20%",
                left: "15%",
                width: 320,
                height: 320,
                background: "radial-gradient(circle, rgba(53,189,241,0.12), transparent 70%)",
                filter: "blur(80px)",
                willChange: "transform",
              }}
              animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                bottom: "18%",
                right: "12%",
                width: 350,
                height: 350,
                background: "radial-gradient(circle, rgba(53,189,241,0.10), transparent 70%)",
                filter: "blur(90px)",
                willChange: "transform",
              }}
              animate={{ x: [0, -20, 0], y: [0, -12, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </div>

      {/* Content — HARD ISOLATED, NO INHERITANCE */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20 text-center flex flex-col items-center justify-center min-h-screen">
        
        {/* EYEBROW — Pure cyan, no class inheritance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#35BDF1",
            textShadow: "0 0 16px rgba(53,189,241,0.4)",
            textTransform: "uppercase",
            margin: "0 0 24px 0",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          AI Automation Command Center
        </motion.div>

        {/* TITLE — HARD WHITE GUARANTEE, ZERO INHERITANCE */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "clamp(2.2rem, 6.8vw, 4rem)",
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: "-0.035em",
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            margin: "0 0 24px 0",
            textWrap: "balance",
            textShadow: "0 2px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          AI Automation Built<br />Around Your Lead Flow.
        </motion.h1>

        {/* SUBCOPY — Pure light blue/gray, NOT dark */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(1rem, 1.9vw, 1.15rem)",
            fontWeight: 400,
            lineHeight: 1.7,
            color: "#D4D8E0",
            maxWidth: "560px",
            margin: "0 auto 40px auto",
            letterSpacing: "-0.011em",
          }}
        >
          Capture missed calls, follow up instantly, and turn more inquiries into booked appointments — without adding more staff.
        </motion.p>

        {/* PRIMARY CTA BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-12"
        >
          <button
            onClick={() => scrollToSection("pricing", "hero_compare_packages_click")}
            type="button"
            style={{
              width: "100%",
              maxWidth: "280px",
              height: "48px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "0 32px",
              borderRadius: "9999px",
              border: "none",
              background: "linear-gradient(135deg, #0079CC 0%, #00AEEF 100%)",
              color: "#FFFFFF",
              fontSize: "clamp(0.875rem, 1.1vw, 1rem)",
              fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
              boxShadow: "0 0 32px rgba(53, 189, 241, 0.45), 0 8px 24px rgba(0, 121, 193, 0.35)",
              transition: "all 300ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = "0 0 48px rgba(53, 189, 241, 0.6), 0 12px 32px rgba(0, 121, 193, 0.45)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = "0 0 32px rgba(53, 189, 241, 0.45), 0 8px 24px rgba(0, 121, 193, 0.35)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Compare Packages <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToSection("automations", "hero_view_automations_click")}
            type="button"
            style={{
              width: "100%",
              maxWidth: "280px",
              height: "48px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "0 32px",
              borderRadius: "9999px",
              border: "1.5px solid rgba(53, 189, 241, 0.35)",
              background: "rgba(8, 20, 44, 0.6)",
              color: "#FFFFFF",
              fontSize: "clamp(0.875rem, 1.1vw, 1rem)",
              fontWeight: 600,
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all 300ms ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(53, 189, 241, 0.6)";
              e.target.style.background = "rgba(8, 20, 44, 0.8)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(53, 189, 241, 0.35)";
              e.target.style.background = "rgba(8, 20, 44, 0.6)";
            }}
          >
            View Automations <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* COMPACT AUTOMATION PILLS — Direct inline, pure white */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="flex flex-wrap justify-center gap-2 mb-16 max-w-3xl"
        >
          {AUTOMATION_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "40px",
                padding: "0 16px",
                borderRadius: "20px",
                border: "1px solid rgba(53, 189, 241, 0.25)",
                background: "rgba(53, 189, 241, 0.08)",
                color: "#FFFFFF",
                fontSize: "0.8125rem",
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                transition: "all 200ms ease",
                boxShadow: "0 0 12px rgba(53, 189, 241, 0.15)",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "rgba(53, 189, 241, 0.5)";
                e.target.style.background = "rgba(53, 189, 241, 0.15)";
                e.target.style.boxShadow = "0 0 24px rgba(53, 189, 241, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(53, 189, 241, 0.25)";
                e.target.style.background = "rgba(53, 189, 241, 0.08)";
                e.target.style.boxShadow = "0 0 12px rgba(53, 189, 241, 0.15)";
              }}
            >
              <span style={{ fontSize: "1.2em" }}>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Trust Logos */}
        <HeroTrustLogos />
      </div>
    </section>
  );
}