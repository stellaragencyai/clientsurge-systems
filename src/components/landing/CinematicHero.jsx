import { ArrowRight, PhoneCall, UserPlus, MessageSquare, CalendarCheck, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import HeroBackground from "./HeroBackground.jsx";

const PROOF_CARDS = [
  { title: "Missed Call Recovered", desc: "AI answered after hours.", icon: PhoneCall, pos: { top: "13%", left: "1.5%" } },
  { title: "Lead Captured", desc: "New inquiry added to pipeline.", icon: UserPlus, pos: { top: "20%", right: "1.5%" } },
  { title: "SMS Sent", desc: "Follow-up delivered in seconds.", icon: MessageSquare, pos: { top: "50%", left: "1%" } },
  { title: "Booking Created", desc: "Appointment link sent automatically.", icon: CalendarCheck, pos: { top: "56%", right: "1%" } },
  { title: "Revenue Leak Closed", desc: "Old lead reactivated.", icon: TrendingUp, pos: { bottom: "12%", left: "2%" } },
];

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
      <HeroBackground videoUrl={videoUrl} posterUrl={posterUrl} />

      {/* Floating proof cards — 2xl+ only so they never block CTAs */}
      <div className="hidden 2xl:block absolute inset-0 pointer-events-none">
        {PROOF_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              className="absolute"
              style={card.pos}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
            >
              <motion.div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  minWidth: 200,
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,174,239,0.18)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#00AEEF" }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{card.title}</p>
                  <p className="text-[10px] text-white/60">{card.desc}</p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
        {/* Accent line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs md:text-sm font-semibold text-white/70 mb-6 leading-relaxed max-w-2xl mx-auto"
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
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            View Automations <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}