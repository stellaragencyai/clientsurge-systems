import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { motion } from "framer-motion";

const FEATURE_CHIPS = [
  "Lead Capture",
  "Missed-Call Recovery",
  "AI Follow-Up",
  "Booking Automation",
  "Review Requests",
  "Lead Reactivation",
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="hero-section relative flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "100svh",
        paddingTop: "var(--cs-nav-height)",
        background: "#0A0A0A",
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

        {/* Headline with glow backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="absolute inset-0 pointer-events-none"
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
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.08] tracking-tight relative"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          The Business AI Automation Store — Pick Your System, We Install It Remotely
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed"
        >
          ClientSurge helps businesses browse, choose, and activate AI automation systems for lead capture, missed-call recovery, follow-up, booking, reviews, reactivation, and operations — through a guided AI-powered remote setup process.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
        >
          <button
            onClick={() => {
              trackCTA("browse_automation_systems", "hero");
              navigate("/store");
            }}
            className="cs-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-bold text-white transition-all duration-300 hover:scale-105"
            style={{
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            Browse AI Automation Systems <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              trackCTA("start_remote_setup", "hero");
              navigate("/book");
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white transition-all duration-300 hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(4px)",
              minHeight: "unset",
              minWidth: "unset",
            }}
          >
            Start Remote Setup <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm text-white/60 mb-6"
        >
          Built for service businesses, clinics, contractors, agencies, and local operators that need faster response, better follow-up, and fewer lost opportunities.
        </motion.p>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {FEATURE_CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}