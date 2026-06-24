import { motion, useReducedMotion } from "framer-motion";
import { X, Check, PhoneOff, Clock, Archive, UserX, Phone, Zap, RefreshCw, CalendarCheck, EyeOff, Eye } from "lucide-react";

const BEFORE_ITEMS = [
  { icon: PhoneOff, text: "Missed calls disappear" },
  { icon: Clock, text: "Leads wait hours or days" },
  { icon: Archive, text: "Old leads sit untouched" },
  { icon: UserX, text: "Staff manually follows up" },
  { icon: EyeOff, text: "No clear booking path" },
];

const AFTER_ITEMS = [
  { icon: Phone, text: "Missed calls trigger instant response" },
  { icon: Zap, text: "New leads get contacted fast" },
  { icon: RefreshCw, text: "Old leads can be reactivated" },
  { icon: CalendarCheck, text: "Booking links sent automatically" },
  { icon: Eye, text: "The owner sees the system working" },
];

export default function BeforeAfterComparison() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#0A0E27" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(0,174,239,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(0,174,239,0.08) 0%, transparent 50%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="cs-eyebrow mb-4" style={{ color: "#00AEEF" }}>The Difference</p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Before ClientSurge vs. After ClientSurge
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before card — muted, problem-focused */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                <X className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white/90" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Before ClientSurge
              </h3>
            </div>
            <ul className="space-y-4">
              {BEFORE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/60" />
                    <span className="text-sm text-white/75 leading-relaxed">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* After card — brighter, solution-focused */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8"
            style={{
              background: "rgba(0,174,239,0.06)",
              border: "1px solid rgba(0,174,239,0.20)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 40px rgba(0,174,239,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.18)" }}>
                <Check className="w-5 h-5" style={{ color: "#00AEEF" }} />
              </div>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                After ClientSurge
              </h3>
            </div>
            <ul className="space-y-4">
              {AFTER_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00AEEF" }} />
                    <span className="text-sm text-white/95 leading-relaxed">{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}