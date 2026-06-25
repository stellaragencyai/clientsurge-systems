import { ArrowRight, Phone, MessageSquare, Zap, Calendar, Star, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { motion, useReducedMotion } from "framer-motion";

const AUTOMATIONS = [
  { title: "AI Voice Agents", desc: "Answer calls 24/7 instantly", icon: Phone },
  { title: "Missed-Call Recovery", desc: "Auto text-back every missed call", icon: MessageSquare },
  { title: "Lead Follow-Up", desc: "Smart multi-channel sequences", icon: Zap },
  { title: "Appointment Booking", desc: "Converts conversations to bookings", icon: Calendar },
  { title: "Review Requests", desc: "Trigger automatic review campaigns", icon: Star },
  { title: "Lead Reactivation", desc: "Win back cold leads on autopilot", icon: RotateCcw },
];

export default function Hero() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="hero-section relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "100svh",
        paddingTop: "var(--cs-nav-height)",
        background: "radial-gradient(ellipse at 50% -20%, #172554 0%, #0A0F1E 50%, #020617 100%)",
        isolation: "isolate",
      }}
    >
      {/* Subtle orbital rings + particle dots background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Faint orbit rings */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: "400px",
            height: "400px",
            border: "1px solid rgba(0, 174, 239, 0.08)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: "600px",
            height: "600px",
            border: "1px solid rgba(0, 174, 239, 0.04)",
          }}
        />
        {/* Particle dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: "2px",
              height: "2px",
              background: "rgba(0, 174, 239, 0.3)",
              top: `${20 + (i % 4) * 20}%`,
              left: `${15 + (i % 3) * 25}%`,
              opacity: 0.4 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full px-6 py-12 md:py-20 text-center">
        {/* Eyebrow */}
         <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="mb-6"
           style={{
             fontSize: "0.75rem",
             fontWeight: 700,
             letterSpacing: "0.25em",
             color: "#00AEEF",
             textTransform: "uppercase",
             fontFamily: "'Inter', sans-serif",
           }}
         >
           READY TO START?
         </motion.div>

        {/* Cyan glow backdrop */}
        {!shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "250px",
              background: "radial-gradient(ellipse at center, rgba(0,174,239,0.12), transparent 60%)",
              filter: "blur(50px)",
              zIndex: -1,
            }}
          />
        )}
        <motion.h1
           initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.1 }}
           className="mb-6 leading-[1.1] tracking-tight relative max-w-5xl mx-auto"
           style={{
             fontFamily: "'Montserrat', sans-serif",
             fontSize: "clamp(2.2rem, 6.8vw, 4rem)",
             fontWeight: 900,
             letterSpacing: "-0.035em",
           }}
         >
           <span style={{ color: "#FFFFFF" }}>You're Already Getting Leads.<br /></span>
           <span
             style={{
               color: "#00AEEF",
               textShadow: "0 0 20px rgba(0,174,239,0.3)",
             }}
           >
             Let's Convert Every One.
           </span>
         </motion.h1>

        {/* Subheadline */}
         <motion.p
           initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="max-w-2xl mx-auto mb-6 leading-relaxed"
           style={{
             fontSize: "clamp(1rem, 1.9vw, 1.15rem)",
             fontWeight: 400,
             color: "#D4D8E0",
             fontFamily: "'Inter', sans-serif",
           }}
         >
           Book a free 15-minute strategy call. We'll map exactly where your business is leaking bookings and show you what the system looks like for your specific situation.
         </motion.p>

        {/* Trust Signals + Extra Info */}
         <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.25 }}
           className="mb-8 flex flex-col items-center gap-3"
         >
           <p style={{ color: "#D4D8E0", fontSize: "0.9rem", fontWeight: 600 }}>
             Most clients are live in 48 hours. No contracts. No fluff.
           </p>
           <p style={{ color: "#7C8A9D", fontSize: "0.85rem" }}>
             Free 15-minute call · no commitment required · live in 24–48 hours
           </p>
           <div className="flex flex-wrap items-center justify-center gap-2">
             {["No contracts", "Live in 48 hrs", "Done-for-you", "30-day guarantee"].map((badge) => (
               <span
                 key={badge}
                 className="inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border"
                 style={{
                   background: "rgba(0,174,239,0.1)",
                   border: "1px solid rgba(0,174,239,0.3)",
                   color: "#38BDF8",
                 }}
               >
                 ✓ {badge}
               </span>
             ))}
           </div>
         </motion.div>

        {/* CTAs */}
         <motion.div
           initial={{ opacity: 0, y: 16 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.35 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
         >
           <button
             onClick={() => {
               trackCTA("compare_packages", "hero");
               navigate("/pricing");
             }}
             className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-base font-bold text-white transition-all duration-300 hover:scale-105"
             style={{
               background: "linear-gradient(135deg, #0079c1 0%, #005691 100%)",
               boxShadow: "0 0 20px rgba(0, 174, 239, 0.45)",
               minHeight: "unset",
               minWidth: "unset",
               height: "auto",
             }}
           >
             Get Your Free Audit <ArrowRight className="w-5 h-5" />
           </button>
           <button
             onClick={() => {
               trackCTA("view_automations", "hero");
               navigate("/store");
             }}
             className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-base font-semibold transition-all duration-300 hover:border-sky-300"
             style={{
               background: "transparent",
               border: "1px solid rgba(53, 189, 241, 0.4)",
               color: "#F0F4F8",
               backdropFilter: "blur(8px)",
               minHeight: "unset",
               minWidth: "unset",
               height: "auto",
             }}
           >
             Free Lead Audit
           </button>
         </motion.div>

        {/* Feature Pills Grid */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.45 }}
           className="hidden"
         >
          {AUTOMATIONS.map((auto, idx) => {
            const Icon = auto.icon;
            return (
              <motion.div
                key={auto.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                className="group rounded-lg p-3 transition-all duration-300 border backdrop-blur-md cursor-default hover:border-cyan-400/60 hover:bg-cyan-900/10"
                style={{
                  background: "rgba(30, 30, 40, 0.6)",
                  border: "1px solid rgba(0, 174, 239, 0.2)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-md p-2 flex-shrink-0 transition-transform"
                    style={{
                      background: "rgba(0,174,239,0.15)",
                      border: "1px solid rgba(0,174,239,0.3)",
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#00AEEF" }} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">{auto.title}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}