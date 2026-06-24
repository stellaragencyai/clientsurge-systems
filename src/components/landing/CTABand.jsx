import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import SectionHeader from "@/components/design-system/SectionHeader";

function scrollToSection(id, ctaName, location) {
  trackCTA(ctaName, location);
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CTABand({ headline, subcopy, primaryLabel, primaryAction, secondaryLabel, secondaryAction, location }) {
  const shouldReduceMotion = useReducedMotion();

  const handlePrimary = () => {
    if (primaryAction === "contact") {
      trackCTA("free_audit_cta_click", location);
      window.location.href = "/contact";
    } else if (primaryAction === "pricing") {
      scrollToSection("pricing", "compare_packages", location);
    }
  };

  const handleSecondary = () => {
    if (secondaryAction === "automations") {
      scrollToSection("automations", "view_automations", location);
    } else if (secondaryAction === "pricing") {
      scrollToSection("pricing", "compare_packages", location);
    }
  };

  return (
    <section className="relative py-14 md:py-20 overflow-hidden" style={{ background: "#ffffff" }}>
      {/* Subtle glow gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(0,174,239,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(0,174,239,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <SectionHeader
          title={headline}
          subtitle={subcopy}
          align="center"
        />
        <div className="mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryLabel && (
            <button
              onClick={handlePrimary}
              className="cs-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white w-full sm:w-auto"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              {primaryLabel}
            </button>
          )}
          {secondaryLabel && (
            <button
              onClick={handleSecondary}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-foreground transition-all duration-300 hover:bg-muted w-full sm:w-auto"
              style={{ background: "#ffffff", border: "1.5px solid rgba(0,174,239,0.3)", minHeight: "unset", minWidth: "unset" }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}