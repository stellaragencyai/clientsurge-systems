import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import { CinematicOrbitalFrame, MotionStyleShield, StaggerGroup, StaggerItem, premiumEase } from "./PremiumMotion.jsx";

const AUTOMATION_PILLS = [
  "Lead Capture",
  "Missed-Call Recovery",
  "Follow-Up",
  "AI Booking",
  "Reviews",
  "Reactivation",
  "Optional AI Phone Receptionist",
];

const TRUST_POINTS = [
  { value: "24/7", label: "lead-response posture" },
  { value: "6", label: "core automations packaged" },
  { value: "Proof", label: "checked before launch" },
];

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.38], [0, 72]);
  const atmosphereY = useTransform(scrollYProgress, [0, 0.38], [0, -50]);

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <MotionStyleShield />
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
        .cs-hero-shield .cs-motion-safe-gradient-text {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        .cs-hero-grid {
          background-image:
            linear-gradient(rgba(53,189,241,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,189,241,0.055) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse at 50% 35%, black 0%, rgba(0,0,0,0.72) 42%, transparent 76%);
        }
      `}</style>

      <section
        className="cs-hero-shield relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
        aria-label="ClientSurge AI automation storefront"
      >
        <motion.div className="absolute inset-0 overflow-hidden" style={{ y: shouldReduceMotion ? 0 : atmosphereY }}>
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 40%, #0A1B38 0%, #061025 70%, #040C1C 100%)" }}
          />
          <div className="cs-hero-grid absolute inset-0" aria-hidden="true" />
          <CinematicOrbitalFrame />
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "10%",
                  left: "8%",
                  width: 380,
                  height: 380,
                  background: "radial-gradient(circle, rgba(53,189,241,0.16), transparent 70%)",
                  filter: "blur(92px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, 34, 0], y: [0, 20, 0], scale: [1, 1.07, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  bottom: "8%",
                  right: "4%",
                  width: 430,
                  height: 430,
                  background: "radial-gradient(circle, rgba(0,121,193,0.14), transparent 72%)",
                  filter: "blur(96px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, -26, 0], y: [0, -18, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute left-[-20%] top-[18%] h-[160px] w-[140%] rotate-[-12deg]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), rgba(53,189,241,0.13), transparent)", filter: "blur(8px)" }}
                animate={{ x: ["-18%", "18%", "-18%"] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              />
            </>
          )}
        </motion.div>

        <motion.div
          className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center text-center pt-20 md:pt-24 pb-12 md:pb-16"
          style={{ y: shouldReduceMotion ? 0 : heroY }}
        >
          <motion.div
            className="cs-motion-node cs-hero-eyebrow"
            initial={shouldReduceMotion ? false : { "--cs-motion-opacity": 0, y: 12, filter: "blur(8px)" }}
            animate={shouldReduceMotion ? undefined : { "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: premiumEase }}
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
            className="cs-motion-node cs-motion-safe-gradient-text"
            initial={shouldReduceMotion ? false : { "--cs-motion-opacity": 0, y: 18, backgroundPosition: "0% 50%", filter: "blur(8px)" }}
            animate={shouldReduceMotion ? undefined : { "--cs-motion-opacity": 1, y: 0, backgroundPosition: "100% 50%", filter: "blur(0px)" }}
            transition={{ duration: 1.05, delay: 0.08, ease: premiumEase }}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "clamp(2.2rem, 5.3vw, 4.25rem)",
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: "-0.055em",
              margin: "0 0 20px 0",
              textWrap: "balance",
              textShadow: "0 2px 24px rgba(0, 0, 0, 0.6)",
              maxWidth: "1040px",
            }}
          >
            Capture. Follow Up. Book.
          </motion.h1>

          <motion.p
            className="cs-motion-node cs-hero-subcopy"
            initial={shouldReduceMotion ? false : { "--cs-motion-opacity": 0, y: 18, filter: "blur(8px)" }}
            animate={shouldReduceMotion ? undefined : { "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.72, delay: 0.18, ease: premiumEase }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(1rem, 1.9vw, 1.15rem)",
              fontWeight: 400,
              lineHeight: 1.7,
              maxWidth: "720px",
              margin: "0 auto 22px auto",
              letterSpacing: "-0.011em",
            }}
          >
            Choose a packaged AI system for missed calls, slow follow-up, booking friction, reviews, and lead reactivation. We configure it, test the launch path, and install it for your business.
          </motion.p>

          <StaggerGroup className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl" delayChildren={0.22} staggerChildren={0.045}>
            {AUTOMATION_PILLS.map((pill) => (
              <StaggerItem key={pill} y={14} duration={0.48}>
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold cs-cinematic-sheen"
                  style={{ borderColor: "rgba(53,189,241,0.28)", background: "rgba(8,20,44,0.72)", color: "#D4D8E0" }}
                >
                  {pill}
                </span>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <motion.div
            initial={shouldReduceMotion ? false : { "--cs-motion-opacity": 0, y: 16, filter: "blur(8px)" }}
            animate={shouldReduceMotion ? undefined : { "--cs-motion-opacity": 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.66, delay: 0.28, ease: premiumEase }}
            className="cs-motion-node flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-8"
          >
            <motion.button
              onClick={() => scrollToSection("pricing", "hero_choose_system_click")}
              type="button"
              className="cs-btn-primary cs-cinematic-sheen"
              style={{ width: "100%", maxWidth: "300px", height: "54px", padding: "0 32px" }}
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.018, boxShadow: "0 12px 36px rgba(0,121,193,0.55)" }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              Choose Your AI System <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => scrollToSection("automations", "hero_see_systems_click")}
              type="button"
              className="inline-flex items-center justify-center rounded-full border text-sm font-bold transition-all cs-cinematic-sheen"
              style={{
                width: "100%",
                maxWidth: "300px",
                height: "54px",
                borderColor: "rgba(53, 189, 241, 0.4)",
                background: "rgba(8, 20, 44, 0.7)",
                color: "#FFFFFF",
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.014, borderColor: "rgba(53,189,241,0.68)", boxShadow: "0 14px 36px rgba(53,189,241,0.16)" }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              See How It Works
            </motion.button>
          </motion.div>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl mb-6" delayChildren={0.36} staggerChildren={0.075}>
            {TRUST_POINTS.map((point) => (
              <StaggerItem key={point.label} y={16}>
                <div
                  className="rounded-2xl border px-5 py-4 cs-cinematic-sheen"
                  style={{ background: "rgba(7, 19, 42, 0.58)", borderColor: "rgba(53,189,241,0.20)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
                >
                  <div style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 900, letterSpacing: "-0.035em" }}>{point.value}</div>
                  <div className="cs-hero-subcopy" style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{point.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <p className="cs-hero-subcopy text-xs font-semibold">
            No long-term contract · Month-to-month · Proof checked before launch
          </p>
        </motion.div>
      </section>
    </>
  );
}
