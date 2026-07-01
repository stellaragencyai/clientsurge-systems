import StardustOverlay from "./StardustOverlay";
import { ArrowRight, Phone, Shield, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { MotionStyleShield, PremiumHoverCard, Reveal, StaggerGroup } from "./PremiumMotion.jsx";

const MotionLink = motion(Link);

const INSTALL_STEPS = [
  { step: "01", title: "Choose your system", body: "Pick Starter, Growth, Pro, or the automation module that matches your biggest gap." },
  { step: "02", title: "Complete guided intake", body: "Tell us your lead sources, tools, booking path, phone/email setup, and launch goals." },
  { step: "03", title: "We install and test", body: "ClientSurge configures the workflows and checks proof before treating the system as live." },
];

export default function FinalCTA() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="build-stack" className="bg-white pt-16 md:pt-20 pb-20 md:pb-28 px-6 relative overflow-hidden">
      <MotionStyleShield />
      <StardustOverlay seed={13} opacity={0.6} />
      <div
        className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,174,239,0.13), transparent 66%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        <Reveal y={24}>
          <div className="cs-section-header cs-section-header--center" style={{ marginBottom: 0 }}>
            <p className="cs-section-eyebrow">Ready to Install Your Lead Flow System?</p>
            <div className="cs-section-title-row justify-center" style={{ gap: "10px" }}>
              <span className="cs-section-bar" aria-hidden="true" />
              <h2 className="cs-section-title" style={{ fontSize: "clamp(1.5rem, 3.8vw, 2.5rem)" }}>
                Build Your AI Revenue System in One Flow
              </h2>
            </div>
            <p className="cs-section-subtitle mx-auto">
              Pick the package, complete guided intake, and ClientSurge handles setup, provider connections, testing, and launch readiness.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-12 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-center" delayChildren={0.08} staggerChildren={0.1}>
          {INSTALL_STEPS.map((item) => (
            <PremiumHoverCard key={item.step} className="flex flex-col gap-2 rounded-2xl px-4 py-5 cs-cinematic-sheen" lift={6} glow="0 22px 56px rgba(0, 174, 239, 0.14)" style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(0,174,239,0.12)" }}>
              <span className="font-display text-4xl font-black" style={{ color: "rgba(0,174,239,0.25)", lineHeight: 1 }}>{item.step}</span>
              <p className="font-semibold text-foreground text-sm">{item.title}</p>
              <p className="text-foreground text-xs leading-relaxed">{item.body}</p>
            </PremiumHoverCard>
          ))}
        </StaggerGroup>

        <Reveal y={14} delay={0.08}>
          <p className="mt-6 text-xs text-foreground">Month-to-month · proof checked before launch · support available</p>
        </Reveal>
      </div>

      <Reveal className="max-w-3xl mx-auto text-center mt-4 relative z-10" y={22} delay={0.08}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <MotionLink
            to="/pricing"
            onClick={() => trackCTA("compare_packages", "final_cta")}
            className="cs-btn-primary focus:outline-none focus:ring-2 focus:ring-primary rounded-lg cs-cinematic-sheen"
            style={{ padding: "0 40px", height: "56px", fontSize: "1rem" }}
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.015, boxShadow: "0 12px 36px rgba(0,121,193,0.50)" }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            Compare Packages <ArrowRight className="w-5 h-5" />
          </MotionLink>
          <MotionLink
            to="/store"
            onClick={() => trackCTA("browse_automation_store", "final_cta")}
            className="inline-flex items-center justify-center h-14 px-6 rounded-lg border-2 border-primary/30 bg-white text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 cs-cinematic-sheen"
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.012 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            Browse Automation Store
          </MotionLink>
          <MotionLink
            to="/book"
            onClick={() => trackCTA("guided_system_match", "final_cta")}
            className="inline-flex items-center justify-center h-14 px-6 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-primary/5 transition-all duration-200 cs-cinematic-sheen"
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.012 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            Get Help Choosing
          </MotionLink>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="tel:+16025843227" className="text-xs text-foreground font-medium hover:text-primary transition-colors inline-flex items-center gap-1" style={{ textDecoration: "none" }}><Phone className="w-3.5 h-3.5" /> (602) 584-3227</a>
          <span className="hidden sm:block text-foreground/30">|</span>
          <span className="text-xs text-foreground font-medium inline-flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 30-day performance review included</span>
          <span className="hidden sm:block text-foreground/30">|</span>
          <span className="text-xs text-foreground font-medium inline-flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Launch path tested before go-live</span>
        </div>
      </Reveal>
    </section>
  );
}
