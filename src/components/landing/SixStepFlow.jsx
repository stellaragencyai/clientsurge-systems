import { motion, useReducedMotion } from "framer-motion";
import { Target, Zap, Filter, CalendarCheck, Star, RefreshCw } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Target,
    title: "Capture",
    desc: "Website lead capture forms turn visitors into pipeline leads instantly.",
    service: "Website Lead Capture",
  },
  {
    num: "02",
    icon: Zap,
    title: "Respond",
    desc: "Instant lead response sends a personalized SMS within seconds.",
    service: "Instant Lead Response",
  },
  {
    num: "03",
    icon: Filter,
    title: "Qualify",
    desc: "AI lead qualification scores intent and routes hot leads first.",
    service: "AI Lead Qualification",
  },
  {
    num: "04",
    icon: CalendarCheck,
    title: "Book",
    desc: "AI booking agent sends scheduling links and confirms appointments.",
    service: "AI Booking Agent",
  },
  {
    num: "05",
    icon: Star,
    title: "Review",
    desc: "Automated review requests follow up after completed jobs.",
    service: "Review Automation",
  },
  {
    num: "06",
    icon: RefreshCw,
    title: "Reactivate",
    desc: "Lead reactivation campaigns bring old inquiries back to life.",
    service: "Lead Reactivation",
  },
];

export default function SixStepFlow() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#0A0E27" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="cs-eyebrow mb-4" style={{ color: "#00AEEF" }}>The ClientSurge Flow</p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Six Steps From Lead to Revenue
          </h2>
          <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
            Every step is tied to an existing ClientSurge automation — working together as one system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative rounded-2xl p-6 transition-colors duration-300"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Step number */}
                <span
                  className="absolute top-4 right-4 text-3xl font-black opacity-10"
                  style={{ fontFamily: "'Montserrat', sans-serif", color: "#00AEEF" }}
                >
                  {step.num}
                </span>

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(0,174,239,0.10)" }}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                {/* Title */}
                <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/80 leading-relaxed mb-3">{step.desc}</p>

                {/* Service tag */}
                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(0,174,239,0.08)", color: "#00AEEF" }}
                >
                  {step.service}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}