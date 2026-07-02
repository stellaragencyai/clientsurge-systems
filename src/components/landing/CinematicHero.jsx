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

const TRUST_LOGOS = ["asana", "cloudflare", "openai", "twilio", "stripe", "resend"];

function IntegrationLogo({ name }) {
  switch (name) {
    case "asana":
      return (
        <span className="cs-brand-logo cs-brand-asana" aria-label="Asana logo">
          <span className="cs-asana-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="cs-brand-word">asana</span>
        </span>
      );
    case "cloudflare":
      return (
        <span className="cs-brand-logo cs-brand-cloudflare" aria-label="Cloudflare logo">
          <span className="cs-cloudflare-mark" aria-hidden="true"><i /><b /></span>
          <span className="cs-brand-word">CLOUDFLARE</span>
        </span>
      );
    case "openai":
      return (
        <span className="cs-brand-logo cs-brand-openai" aria-label="OpenAI logo">
          <span className="cs-openai-mark" aria-hidden="true">◎</span>
          <span className="cs-brand-word">OpenAI</span>
        </span>
      );
    case "twilio":
      return (
        <span className="cs-brand-logo cs-brand-twilio" aria-label="Twilio logo">
          <span className="cs-twilio-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="cs-brand-word">twilio</span>
        </span>
      );
    case "stripe":
      return (
        <span className="cs-brand-logo cs-brand-stripe" aria-label="Stripe logo">
          <span className="cs-brand-word">stripe</span>
        </span>
      );
    case "resend":
      return (
        <span className="cs-brand-logo cs-brand-resend" aria-label="Resend logo">
          <span className="cs-resend-mark" aria-hidden="true">R</span>
          <span className="cs-brand-word">Resend</span>
        </span>
      );
    default:
      return null;
  }
}

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
        .cs-hero-logo-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: nowrap;
          gap: clamp(18px, 2.8vw, 34px);
          width: 100%;
          padding: 12px 0 2px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
        }
        .cs-hero-logo-strip::-webkit-scrollbar {
          display: none;
        }
        .cs-brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          flex: 0 0 auto;
          height: 24px;
          opacity: 0.94;
          transform: translateZ(0);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .cs-brand-logo:hover {
          opacity: 1;
          transform: translateY(-1px);
        }
        .cs-brand-word {
          display: inline-block;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1;
          letter-spacing: -0.035em;
          white-space: nowrap;
        }
        .cs-brand-asana .cs-brand-word {
          font-size: 24px;
          font-weight: 500;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-asana-mark {
          position: relative;
          width: 24px;
          height: 22px;
          display: inline-block;
        }
        .cs-asana-mark i {
          position: absolute;
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #FF6D5A;
          box-shadow: 0 0 12px rgba(255, 109, 90, 0.24);
        }
        .cs-asana-mark i:nth-child(1) { left: 7.5px; top: 0; }
        .cs-asana-mark i:nth-child(2) { left: 1px; bottom: 1px; }
        .cs-asana-mark i:nth-child(3) { right: 1px; bottom: 1px; }
        .cs-brand-cloudflare .cs-brand-word {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.13em;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-cloudflare-mark {
          position: relative;
          width: 34px;
          height: 20px;
          display: inline-block;
        }
        .cs-cloudflare-mark i {
          position: absolute;
          left: 0;
          bottom: 3px;
          width: 30px;
          height: 11px;
          border-radius: 999px 999px 4px 4px;
          background: linear-gradient(90deg, #F6821F, #FDBB30);
        }
        .cs-cloudflare-mark b {
          position: absolute;
          right: 0;
          top: 5px;
          width: 14px;
          height: 10px;
          border-radius: 999px;
          background: #F6821F;
        }
        .cs-brand-openai .cs-openai-mark {
          font-size: 26px;
          font-weight: 700;
          line-height: 0.8;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-brand-openai .cs-brand-word {
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          letter-spacing: -0.02em;
        }
        .cs-brand-twilio {
          color: #F22F46 !important;
          -webkit-text-fill-color: #F22F46 !important;
        }
        .cs-twilio-mark {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 3px solid #F22F46;
          display: grid;
          grid-template-columns: repeat(2, 4px);
          grid-template-rows: repeat(2, 4px);
          place-content: center;
          gap: 3px;
        }
        .cs-twilio-mark i {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: #F22F46;
        }
        .cs-brand-twilio .cs-brand-word {
          font-size: 24px;
          font-weight: 900;
          color: #F22F46 !important;
          -webkit-text-fill-color: #F22F46 !important;
          letter-spacing: -0.06em;
        }
        .cs-brand-stripe .cs-brand-word {
          font-size: 26px;
          font-weight: 900;
          color: #635BFF !important;
          -webkit-text-fill-color: #635BFF !important;
          letter-spacing: -0.065em;
        }
        .cs-brand-resend .cs-resend-mark {
          font-size: 19px;
          font-weight: 900;
          line-height: 1;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          letter-spacing: -0.08em;
        }
        .cs-brand-resend .cs-brand-word {
          font-size: 22px;
          font-weight: 800;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          letter-spacing: -0.055em;
        }
        @media (max-width: 720px) {
          .cs-hero-logo-strip {
            justify-content: flex-start;
            max-width: calc(100vw - 32px);
          }
          .cs-brand-logo {
            transform: scale(0.88);
            transform-origin: center;
          }
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
              fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "clamp(1.5rem, 3.6vw, 3rem)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="mt-6 w-full max-w-4xl"
            aria-label="ClientSurge integration logos"
          >
            <p className="cs-hero-eyebrow mb-3 text-[0.68rem] font-extrabold uppercase tracking-[0.22em]">
              Built to connect with the tools your system runs on
            </p>
            <div className="cs-hero-logo-strip">
              {TRUST_LOGOS.map((logo) => (
                <IntegrationLogo key={logo} name={logo} />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
