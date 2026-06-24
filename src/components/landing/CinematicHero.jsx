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
      style={{ minHeight: "100svh", paddingTop: "var(--cs-nav-height)" }}
    >
      {/* Dark cinematic background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Deep navy base gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #0A1628 0%, #0D1F3A 40%, #0A1628 100%)" }}
        />

        {/* Animated blue glow orbs */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                top: "12%",
                left: "8%",
                width: 380,
                height: 380,
                background: "radial-gradient(circle, rgba(0,174,239,0.15), transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                bottom: "8%",
                right: "6%",
                width: 420,
                height: 420,
                background: "radial-gradient(circle, rgba(0,107,176,0.18), transparent 70%)",
                filter: "blur(70px)",
              }}
              animate={{ x: [0, -25, 0], y: [0, -18, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,174,239,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,239,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
      </div>

      {/* Desktop floating proof cards — positioned around hero edges */}
      <FloatingAutomationProofCards variant="desktop" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
        {/* Accent line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs md:text-sm font-semibold text-white/60 mb-6 leading-relaxed max-w-2xl mx-auto"
        >
          Websites, AI follow-up, booking, missed-call recovery, reviews, and lead reactivation working as one system.
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.08] tracking-tight"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          AI Automation Built Around Your Lead Flow.
        </motion.h1>

        {/* Supporting copy */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-base md:text-lg font-normal text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Capture missed calls, follow up instantly, and turn more inquiries into booked appointments — without adding more staff.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => scrollToSection("pricing", "hero_compare_packages_click")}
            className="cs-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white"
            style={{ boxShadow: "0 4px 20px rgba(0,121,193,0.45)" }}
          >
            Compare Packages <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollToSection("automations", "hero_view_automations_click")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white transition-all duration-300 hover:bg-white/10"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            View Automations <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Mobile compact proof cards — inline below CTAs */}
        <FloatingAutomationProofCards variant="mobile" />
      </div>
    </section>
  );
}