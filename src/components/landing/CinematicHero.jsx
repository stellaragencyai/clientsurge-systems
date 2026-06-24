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
    <>
      {/* ══ CSS SHIELD — forces white text on ALL hero descendants ══ */}
      <style>{`
        .cs-hero-shield,
        .cs-hero-shield h1,
        .cs-hero-shield h2,
        .cs-hero-shield h3,
        .cs-hero-shield h4,
        .cs-hero-shield h5,
        .cs-hero-shield h6,
        .cs-hero-shield p,
        .cs-hero-shield span,
        .cs-hero-shield div,
        .cs-hero-shield button,
        .cs-hero-shield a,
        .cs-hero-shield label,
        .cs-hero-shield li {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-hero-shield .cs-hero-eyebrow {
          color: #35BDF1 !important;
          -webkit-text-fill-color: #35BDF1 !important;
        }
        .cs-hero-shield .cs-hero-subcopy {
          color: #D4D8E0 !important;
          -webkit-text-fill-color: #D4D8E0 !important;
        }
      `}</style>

      <section
        className="cs-hero-shield relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
        aria-label="AI Automation Command Center"
      >
        {/* Dark cinematic background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Deep navy base */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 40%, #0A1B38 0%, #061025 70%, #040C1C 100%)" }}
          />

          {/* Subtle circular rings */}
          {!shouldReduceMotion && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 40%, transparent 8%, rgba(53, 189, 241, 0.03) 18%, transparent 28%),
                  radial-gradient(circle at 50% 40%, transparent 32%, rgba(53, 189, 241, 0.04) 42%, transparent 52%)
                `,
                opacity: 0.5,
              }}
            />
          )}

          {/* Cyan glow accent orbs */}
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "15%",
                  left: "10%",
                  width: 340,
                  height: 340,
                  background: "radial-gradient(circle, rgba(53,189,241,0.10), transparent 70%)",
                  filter: "blur(80px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  bottom: "12%",
                  right: "8%",
                  width: 380,
                  height: 380,
                  background: "radial-gradient(circle, rgba(53,189,241,0.08), transparent 70%)",
                  filter: "blur(90px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, -20, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20 text-center flex flex-col items-center justify-center min-h-screen">
          
          {/* EYEBROW */}
          <motion.div
            className="cs-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: "clamp(0.75rem, 1.1vw, 0.875rem)",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textShadow: "0 0 16px rgba(53,189,241,0.4)",
              textTransform: "uppercase",
              margin: "0 0 28px 0",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            AI Automation Command Center
          </motion.div>

          {/* TITLE */}
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
              margin: "0 0 24px 0",
              textWrap: "balance",
              textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
              maxWidth: "900px",
            }}
          >
            AI Automation Built<br />Around Your Lead Flow.
          </motion.h1>

          {/* SUBCOPY */}
          <motion.p
            className="cs-hero-subcopy"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(1rem, 1.9vw, 1.15rem)",
              fontWeight: 400,
              lineHeight: 1.7,
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
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-10"
          >
            <button
              onClick={() => scrollToSection("pricing", "hero_compare_packages_click")}
              type="button"
              style={{
                width: "100%",
                maxWidth: "280px",
                height: "52px",
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
                boxShadow: "0 0 32px rgba(53, 189, 241, 0.4), 0 8px 24px rgba(0, 121, 193, 0.3)",
                transition: "all 300ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 48px rgba(53, 189, 241, 0.55), 0 12px 32px rgba(0, 121, 193, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 32px rgba(53, 189, 241, 0.4), 0 8px 24px rgba(0, 121, 193, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
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
                height: "52px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 32px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(53, 189, 241, 0.4)",
                background: "rgba(8, 20, 44, 0.7)",
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
                e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.7)";
                e.currentTarget.style.background = "rgba(8, 20, 44, 0.85)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.4)";
                e.currentTarget.style.background = "rgba(8, 20, 44, 0.7)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              View Automations <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* COMPACT AUTOMATION PILLS */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="flex flex-wrap justify-center gap-2 mb-12 max-w-3xl"
          >
            {AUTOMATION_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "20px",
                  border: "1px solid rgba(53, 189, 241, 0.3)",
                  background: "rgba(8, 20, 44, 0.6)",
                  color: "#FFFFFF",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  transition: "all 200ms ease",
                  boxShadow: "0 0 12px rgba(53, 189, 241, 0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.6)";
                  e.currentTarget.style.background = "rgba(53, 189, 241, 0.12)";
                  e.currentTarget.style.boxShadow = "0 0 24px rgba(53, 189, 241, 0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.3)";
                  e.currentTarget.style.background = "rgba(8, 20, 44, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 12px rgba(53, 189, 241, 0.12)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: "1.1em", lineHeight: 1, color: "#FFFFFF" }}>{pill.icon}</span>
                <span style={{ color: "#FFFFFF" }}>{pill.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Trust Logos */}
          <HeroTrustLogos />
        </div>
      </section>
    </>
  );
}