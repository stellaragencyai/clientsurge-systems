import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";

const AUTOMATION_PILLS = [
  "Lead Capture",
  "Missed-Call Recovery",
  "Follow-Up",
  "AI Booking",
  "Reviews",
  "Reactivation",
  "Optional AI Phone Receptionist",
];

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <style>{`
        .cs-hero-shield,
        .cs-hero-shield h1,
        .cs-hero-shield h2,
        .cs-hero-shield h3,
        .cs-hero-shield p,
        .cs-hero-shield span,
        .cs-hero-shield div,
        .cs-hero-shield button,
        .cs-hero-shield a {
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
        aria-label="ClientSurge AI automation storefront"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 40%, #0A1B38 0%, #061025 70%, #040C1C 100%)" }}
          />
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

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center text-center pt-20 md:pt-24 pb-12 md:pb-16">
          <motion.div
            className="cs-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
              fontWeight: 800,
              letterSpacing: "0.25em",
              textShadow: "0 0 16px rgba(53,189,241,0.4)",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            AI Automation Storefront
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{
              fontFamily: "'Montserrat', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(2.25rem, 5.4vw, 4.45rem)",
              fontWeight: 900,
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
              margin: "0 0 20px 0",
              textTransform: "uppercase",
              textWrap: "balance",
              textShadow: "0 2px 24px rgba(0, 0, 0, 0.6)",
              maxWidth: "1100px",
              fontFeatureSettings: "'kern' 1",
            }}
          >
            <span style={{ display: "block", color: "#FFFFFF" }}>Turn Your Website Into a 24/7 AI Sales Machine</span>
          </motion.h1>

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
              maxWidth: "680px",
              margin: "0 auto 20px auto",
              letterSpacing: "-0.011em",
            }}
          >
            Choose a packaged AI system for missed calls, slow follow-up, booking friction, reviews, and lead reactivation. We configure it, test the launch path, and install it for your business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl"
          >
            {AUTOMATION_PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(53,189,241,0.28)", background: "rgba(8,20,44,0.72)", color: "#D4D8E0" }}
              >
                {pill}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-8"
          >
            <button
              onClick={() => scrollToSection("pricing", "hero_choose_system_click")}
              type="button"
              className="cs-btn-primary"
              style={{ width: "100%", maxWidth: "300px", height: "54px", padding: "0 32px" }}
            >
              Choose Your AI System <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("automations", "hero_see_systems_click")}
              type="button"
              className="inline-flex items-center justify-center rounded-full border text-sm font-bold transition-all"
              style={{
                width: "100%",
                maxWidth: "300px",
                height: "54px",
                borderColor: "rgba(53, 189, 241, 0.4)",
                background: "rgba(8, 20, 44, 0.7)",
                color: "#FFFFFF",
              }}
            >
              See How It Works
            </button>
          </motion.div>

          <p className="cs-hero-subcopy text-xs font-semibold">
            No long-term contract · Month-to-month · Proof checked before launch
          </p>
        </div>
      </section>
    </>
  );
}
