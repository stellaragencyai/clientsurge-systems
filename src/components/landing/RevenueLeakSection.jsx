import { motion, useReducedMotion } from "framer-motion";
import { PhoneOff, Clock, FileText, Users } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";

const LEAKS = [
  { icon: PhoneOff, title: "Missed Calls", desc: "A prospect calls with intent. If nobody responds, the opportunity can disappear." },
  { icon: Clock, title: "Slow Replies", desc: "Lead interest drops fast when the next step waits on manual follow-up." },
  { icon: FileText, title: "Forgotten Quotes", desc: "Quotes and estimates stall when nobody has a structured follow-up path." },
  { icon: Users, title: "Unworked Old Leads", desc: "Past inquiries, no-shows, and dormant contacts often still have buying intent." },
];

export default function RevenueLeakSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#ffffff" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(0,174,239,0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 50%, rgba(0,174,239,0.04) 0%, transparent 50%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Lead Flow Gaps"
          title="Your Business Is Losing Bookings at the Delay Points"
          subtitle="Most teams do not need another dashboard. They need the first response, follow-up, booking handoff, review request, and reactivation path to stop depending on memory."
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
                style={{ background: "#ffffff", border: "1px solid rgba(0,174,239,0.12)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2" style={{ fontSize: "1.05rem", lineHeight: 1.3, color: "#111318" }}>{leak.title}</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "#3a3d47" }}>{leak.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
