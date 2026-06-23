import { motion, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, FileText, Users } from "lucide-react";

const LEAKS = [
  {
    icon: PhoneOff,
    title: "Missed Calls",
    desc: "Every unanswered call is a customer who calls your competitor instead.",
  },
  {
    icon: Clock,
    title: "Slow Replies",
    desc: "Leads cool fast. A 5-minute delay can mean a lost booking.",
  },
  {
    icon: FileText,
    title: "Forgotten Quotes",
    desc: "Quotes sent but never followed up on sit in a pipeline forever.",
  },
  {
    icon: Users,
    title: "Unworked Old Leads",
    desc: "Past inquiries that never closed represent hidden revenue sitting idle.",
  },
];

export default function RevenueLeakSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      style={{ background: "#0A0E27" }}
    >
      {/* Subtle glow accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 50%, rgba(0,174,239,0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 50%, rgba(124,58,237,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="cs-eyebrow mb-4" style={{ color: "#00AEEF" }}>
            Stop Losing Revenue
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            The Revenue Leak Most Businesses Don't See
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            These everyday gaps create lost appointments and lost revenue — quietly, every single day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {LEAKS.map((leak, i) => {
            const Icon = leak.icon;
            return (
              <motion.div
                key={leak.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(0,174,239,0.12)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#00AEEF" }} />
                </div>
                <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {leak.title}
                </h3>
                <p className="text-sm text-white/55 leading-relaxed">{leak.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}