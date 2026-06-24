import { motion, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, FileText, Users } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";

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
      style={{ background: "#ffffff" }}
    >
      {/* Subtle glow accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 50%, rgba(0,174,239,0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 50%, rgba(0,174,239,0.04) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Stop Losing Revenue"
          title="The Revenue Leak You Don't See"
          subtitle="These everyday gaps create lost appointments and lost revenue — quietly, every single day."
          align="center"
        />

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
                className="rounded-2xl p-6 cs-card-shadow"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,174,239,0.12)",
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {leak.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{leak.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}