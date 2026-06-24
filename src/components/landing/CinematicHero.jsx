import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import FloatingAutomationProofCards from "./FloatingAutomationProofCards.jsx";

export default function CinematicHero({ videoUrl, posterUrl }) {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="hero-section relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
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

      {/* Desktop floating proof cards — positioned around hero edges */}
      <FloatingAutomationProofCards variant="desktop" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20 text-center">
        {/* Accent line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-semibold mb-6 leading-relaxed max-w-2xl mx-auto"
          style={{ fontSize: "clamp(0.75rem, 1.2vw, 0.95rem)", color: "#D4D8E0" }}
        >
          Websites, AI follow-up, booking, missed-call recovery, reviews, and lead reactivation working as one system.
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-black mb-5 leading-[1.08] tracking-tight"
          style={{ fontFamily: "'Montserrat', sans-serif", color: "#FFFFFF", fontSize: "clamp(2rem, 6.5vw, 3.75rem)" }}
        >
          AI Automation Built Around Your Lead Flow.
        </motion.h1>

        {/* Supporting copy */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="font-normal max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ fontSize: "clamp(0.95rem, 2vw, 1.125rem)", color: "#D4D8E0" }}
        >
          Capture missed calls, follow up instantly, and turn more inquiries into booked appointments — without adding more staff.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => scrollToSection("pricing", "hero_compare_packages_click")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all duration-300 min-h-[44px]"
            style={{
              background: "linear-gradient(135deg, #0079CC 0%, #00AEEF 100%)",
              color: "#FFFFFF",
              boxShadow: "0 0 32px rgba(53, 189, 241, 0.45), 0 8px 24px rgba(0, 121, 193, 0.35)",
            }}
          >
            Compare Packages <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scrollToSection("automations", "hero_view_automations_click")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 hover:border-white/40 hover:bg-white/8 min-h-[44px]"
            style={{
              background: "rgba(8, 20, 44, 0.6)",
              border: "1.5px solid rgba(53, 189, 241, 0.35)",
              color: "#FFFFFF",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            View Automations <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </motion.div>

        {/* Mobile compact proof cards — inline below CTAs */}
        <FloatingAutomationProofCards variant="mobile" />
      </div>
    </section>
  );
}