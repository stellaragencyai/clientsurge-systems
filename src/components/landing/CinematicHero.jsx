import { ArrowRight, ShoppingCart, Zap } from "lucide-react";
import { createElement } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import { Link } from "react-router-dom";

const AUTOMATION_PILLS = ["Lead Capture", "Missed-Call Recovery", "Follow-Up", "AI Booking", "Reviews", "Reactivation", "Optional AI Phone Receptionist"];
const HOST = "https://www.vectorlogo.zone/logos/";
const TRUST_LOGOS = [
  { name: "Asana", src: `${HOST}asana/asana-ar21.svg` },
  { name: "Cloudflare", src: `${HOST}cloudflare/cloudflare-ar21.svg` },
  { name: "OpenAI", src: `${HOST}openai/openai-ar21.svg` },
  { name: "Twilio", src: `${HOST}twilio/twilio-ar21.svg` },
  { name: "Stripe", src: `${HOST}stripe/stripe-ar21.svg` },
  { name: "Resend", src: `${HOST}resend/resend-ar21.svg` },
];
function IntegrationLogo({ logo }) { return createElement('span', { role: 'img', 'aria-label': `${logo.name} logo`, className: 'cs-real-logo', style: { backgroundImage: `url(${logo.src})` } }); }

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();
  const logoTrack = [...TRUST_LOGOS, ...TRUST_LOGOS, ...TRUST_LOGOS];
  const scrollToSection = (id, eventName) => { trackCTA(eventName, "hero"); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <section className="cs-hero-shield relative flex items-center justify-center overflow-hidden" style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }} aria-label="ClientSurge AI automation storefront">
      <style>{`
        .cs-hero-shield,.cs-hero-shield h1,.cs-hero-shield p,.cs-hero-shield span,.cs-hero-shield div,.cs-hero-shield button{color:#fff!important;-webkit-text-fill-color:#fff!important}
        .cs-hero-eyebrow{color:#35BDF1!important;-webkit-text-fill-color:#35BDF1!important}
        .cs-hero-subcopy{color:#D4D8E0!important;-webkit-text-fill-color:#D4D8E0!important}
        .cs-hero-content{min-height:calc(100svh - var(--cs-nav-height));display:flex;flex-direction:column;justify-content:center}
        .cs-hero-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%}
        .cs-logo-anchor{width:100%;padding-bottom:clamp(10px,2.5vh,26px)}
        .cs-hero-logo-shell{position:relative;width:min(1180px,calc(100vw - 32px));margin:0 auto;overflow:hidden;padding:18px 0 10px;border-top:1px solid rgba(53,189,241,.20);border-bottom:1px solid rgba(53,189,241,.10);background:linear-gradient(90deg,rgba(53,189,241,.025),rgba(255,255,255,.035),rgba(53,189,241,.025));box-shadow:0 -18px 60px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.03);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 7%,#000 93%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0%,#000 7%,#000 93%,transparent 100%)}
        .cs-hero-logo-shell:before{content:"";position:absolute;left:50%;top:0;width:58%;height:1px;transform:translateX(-50%);background:linear-gradient(90deg,transparent,rgba(53,189,241,.65),transparent)}
        .cs-hero-logo-track{display:flex;align-items:center;width:max-content;gap:clamp(82px,8vw,142px);animation:cs-logo-marquee 42s linear infinite;will-change:transform}
        .cs-hero-logo-shell:hover .cs-hero-logo-track{animation-play-state:paused}
        .cs-hero-logo-item{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;height:58px;min-width:168px;opacity:.98;transition:opacity .18s ease,transform .18s ease}
        .cs-hero-logo-item:hover{opacity:1;transform:translateY(-1px)}
        .cs-real-logo{display:block;width:178px;height:43px;background-repeat:no-repeat;background-position:center;background-size:contain;filter:drop-shadow(0 0 16px rgba(53,189,241,.12))}
        .cs-hero-logo-item[data-logo="Cloudflare"] .cs-real-logo,.cs-hero-logo-item[data-logo="OpenAI"] .cs-real-logo,.cs-hero-logo-item[data-logo="Asana"] .cs-real-logo{width:194px;height:45px}
        .cs-hero-logo-item[data-logo="Resend"] .cs-real-logo{width:156px;height:36px}
        .cs-logo-kicker{margin-bottom:12px;opacity:.95}
        @keyframes cs-logo-marquee{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-33.333%,0,0)}}
        @media(prefers-reduced-motion:reduce){.cs-hero-logo-track{animation:none;width:100%;justify-content:center;flex-wrap:wrap}.cs-logo-repeat{display:none}}
        @media(max-width:720px){.cs-hero-content{min-height:auto}.cs-logo-anchor{padding-bottom:10px}.cs-hero-logo-shell{width:calc(100vw - 24px);padding:14px 0 8px}.cs-hero-logo-track{gap:52px;animation-duration:26s}.cs-hero-logo-item{min-width:132px;height:44px}.cs-real-logo{width:136px;height:31px}}
      `}</style>

      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, #0A1B38 0%, #061025 70%, #040C1C 100%)" }} />
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
            style={{ fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif", fontSize: "clamp(1.5rem, 3.6vw, 3rem)", fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.015em", margin: "0 0 20px 0", textTransform: "uppercase", maxWidth: "1100px" }}
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