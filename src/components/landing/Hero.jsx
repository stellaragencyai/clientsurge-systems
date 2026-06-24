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
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 md:py-20 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#00AEEF", boxShadow: "0 0 8px rgba(0,174,239,0.8)" }}
          />
          <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
            Business AI Automation Store
          </span>
        </motion.div>

        {/* Headline with glow backdrop — skipped when prefers-reduced-motion */}
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
              width: "120%",
              height: "200px",
              background: "radial-gradient(ellipse at center, rgba(0,174,239,0.15), transparent 70%)",
              filter: "blur(40px)",
              zIndex: -1,
            }}
          />
        )}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 leading-[1.02] tracking-tight relative"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            background: "linear-gradient(to right, #FFFFFF 0%, #FFFFFF 60%, #7DD3FC 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          You're Already Getting Leads. Let's Convert Every One.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg font-normal max-w-3xl mx-auto mb-6 leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          Book a free 15-minute strategy call. We'll map exactly where your business is leaking bookings and show you what the system looks like for your specific situation.
        </motion.p>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-8"
        >
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #0079c1 0%, #005691 100%)",
              boxShadow: "0 0 20px rgba(0, 174, 239, 0.45)",
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            Compare Packages <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              trackCTA("view_automations", "hero");
              navigate("/store");
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 hover:border-sky-300"
            style={{
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#F0F4F8",
              backdropFilter: "blur(8px)",
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            View Automations <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Automation Showcase Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full"
        >
          {AUTOMATIONS.map((auto, idx) => {
            const Icon = auto.icon;
            return (
              <motion.div
                key={auto.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                className="group rounded-lg p-4 transition-all duration-300 border backdrop-blur-md cursor-default hover:border-sky-400/50"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2.5 flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{
                      background: "rgba(0,174,239,0.12)",
                      border: "1px solid rgba(0,174,239,0.25)",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#00AEEF" }} />
                  </div>
                  <div className="text-left min-w-0">
                    <h4 className="text-sm font-semibold text-white leading-snug">{auto.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{auto.desc}</p>
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