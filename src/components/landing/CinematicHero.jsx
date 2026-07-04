import { ShoppingCart, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import { Link } from "react-router-dom";

const AUTOMATION_PILLS = ["Lead Capture", "Missed-Call Recovery", "Follow-Up", "AI Booking", "Reviews", "Reactivation", "Optional AI Phone Receptionist"];
const HOST = "https://www.vectorlogo.zone/logos/";
const TRUST_LOGOS = [
  { name: "Twilio", src: `${HOST}twilio/twilio-ar21.svg` },
  { name: "Stripe", src: `${HOST}stripe/stripe-ar21.svg` },
  { name: "Cloudflare", src: `${HOST}cloudflare/cloudflare-ar21.svg` },
  { name: "Asana", src: `${HOST}asana/asana-ar21.svg` },
];
function IntegrationLogo({ logo }) {
  return (
    <img
      src={logo.src}
      alt={`${logo.name} logo`}
      width="120"
      height="32"
      loading="eager"
      decoding="async"
      className="cs-real-logo"
      style={{ width: "150px", height: "40px", objectFit: "contain", display: "block" }}
    />
  );
}

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();
  const logoTrack = [...TRUST_LOGOS, ...TRUST_LOGOS, ...TRUST_LOGOS];
  const scrollToSection = (id, eventName) => { trackCTA(eventName, "hero"); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <section className="cs-hero-shield relative flex items-center justify-center overflow-hidden" style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#ffffff" }} aria-label="ClientSurge AI automation storefront">
      <style>{`
        .cs-hero-shield,.cs-hero-shield h1,.cs-hero-shield p,.cs-hero-shield span,.cs-hero-shield div,.cs-hero-shield button{color:#000!important;-webkit-text-fill-color:#000!important}
        .cs-hero-eyebrow{color:#006BB0!important;-webkit-text-fill-color:#006BB0!important}
        .cs-hero-subcopy{color:#3a3d47!important;-webkit-text-fill-color:#3a3d47!important}
        .cs-hero-content{min-height:calc(100svh - var(--cs-nav-height));display:flex;flex-direction:column;justify-content:center}
        .cs-hero-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%}
        .cs-logo-anchor{width:100%;padding-top:40px;padding-bottom:0;margin-top:auto}
        .cs-hero-logo-shell{position:relative;width:min(1180px,calc(100vw - 32px));margin:0 auto;overflow:hidden;padding:16px 0 14px;border-top:1px solid rgba(53,189,241,.18);background:linear-gradient(90deg,rgba(53,189,241,.02),rgba(255,255,255,.03),rgba(53,189,241,.02));-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 10%,#000 90%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0%,#000 10%,#000 90%,transparent 100%)}
        .cs-hero-logo-track{display:flex;align-items:center;width:max-content;gap:64px;animation:cs-logo-marquee 32s linear infinite;will-change:transform}
        .cs-hero-logo-item{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;height:48px;width:150px;opacity:.85;transition:opacity .2s ease}
        .cs-hero-logo-item:hover{opacity:1}
        .cs-real-logo{filter:drop-shadow(0 0 10px rgba(53,189,241,.10))}
        .cs-logo-kicker{margin-bottom:10px;opacity:.95}
        @keyframes cs-logo-marquee{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-33.333%,0,0)}}
        @media(prefers-reduced-motion:reduce){.cs-hero-logo-track{animation:none;width:100%;justify-content:center;flex-wrap:wrap}.cs-logo-repeat{display:none}}
        @media(max-width:720px){.cs-hero-content{min-height:auto}.cs-logo-anchor{padding-bottom:0}.cs-hero-logo-shell{width:calc(100vw - 24px);padding:12px 0 10px}.cs-hero-logo-track{gap:48px;animation-duration:22s}.cs-hero-logo-item{height:40px;width:120px}.cs-real-logo{width:120px!important;height:32px!important}}
      `}</style>

      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f8fbfe 70%, #f0f5fa 100%)" }} />
        {!shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full"
            style={{ top: "15%", left: "10%", width: 340, height: 340, background: "radial-gradient(circle, rgba(53,189,241,0.10), transparent 70%)", filter: "blur(80px)" }}
            animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="cs-hero-content relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center pt-20 md:pt-24 pb-5">
        <div className="cs-hero-main">
          <motion.div
            className="cs-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ fontSize: "clamp(0.7rem, 1vw, 0.8rem)", fontWeight: 800, letterSpacing: "0.25em", textShadow: "0 0 16px rgba(53,189,241,0.4)", textTransform: "uppercase", margin: "0 0 16px 0", fontFamily: "'Inter', sans-serif" }}
          >
            The Amazon of AI Services for Business
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{ fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif", fontSize: "clamp(1.5rem, 3.6vw, 3rem)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.015em", margin: "0 0 32px 0", textTransform: "uppercase", maxWidth: "1100px" }}
          >
            Browse AI Systems. Add to Cart. Check Out.
          </motion.h1>

          <motion.p
            className="cs-hero-subcopy"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(1rem, 1.9vw, 1.15rem)", lineHeight: 1.7, maxWidth: "680px", margin: "0 auto 20px auto" }}
          >
            Pick a packaged AI system for missed calls, slow follow-up, booking friction, reviews, and lead reactivation.
            No demos, no sales calls — just add your system to the cart and check out. We configure, test, and install it for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl"
          >
            {AUTOMATION_PILLS.map((pill) => (
              <span key={pill} className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "rgba(53,189,241,0.28)", background: "rgba(8,20,44,0.72)" }}>{pill}</span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-8"
          >
            <button
              onClick={() => scrollToSection("pricing", "hero_browse_systems_click")}
              type="button"
              className="cs-btn-primary"
              style={{ width: "100%", maxWidth: "300px", height: "54px", padding: "0 32px" }}
            >
              <ShoppingCart className="w-4 h-4" /> Browse AI Systems
            </button>
            <Link
              to="/store"
              onClick={() => trackCTA("hero_visit_store", "hero")}
              className="inline-flex items-center justify-center rounded-full border text-sm font-bold transition-all"
              style={{ width: "100%", maxWidth: "300px", height: "54px", borderColor: "rgba(53, 189, 241, 0.4)", background: "rgba(8, 20, 44, 0.7)" }}
            >
              <Zap className="w-4 h-4" /> Visit the Store
            </Link>
          </motion.div>

          <p className="cs-hero-subcopy text-xs font-semibold">
            No demos required · Add to cart and check out · Done-for-you setup included
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="cs-logo-anchor"
          aria-label="ClientSurge integration logos"
        >
          <p className="cs-hero-eyebrow cs-logo-kicker text-[0.68rem] font-extrabold uppercase tracking-[0.22em]">
            Built to connect with the tools your system runs on
          </p>
          <div className="cs-hero-logo-shell">
            <div className="cs-hero-logo-track">
              {logoTrack.map((logo, index) => (
                <div
                  className={index >= TRUST_LOGOS.length ? "cs-hero-logo-item cs-logo-repeat" : "cs-hero-logo-item"}
                  data-logo={logo.name}
                  key={`${logo.name}-${index}`}
                  aria-hidden={index >= TRUST_LOGOS.length ? "true" : undefined}
                >
                  <IntegrationLogo logo={logo} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}