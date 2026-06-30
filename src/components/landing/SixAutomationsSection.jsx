import { motion, useReducedMotion } from "framer-motion";
import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";

const AUTOMATION_CARDS = [
  { id: "automation-lead-capture", label: "Lead Capture", description: "Turns forms, calls, ads, and website inquiries into one trackable pipeline.", icon: Zap },
  { id: "automation-missed-call", label: "Missed-Call Recovery", description: "Texts missed callers quickly so the conversation can continue.", icon: Phone },
  { id: "automation-follow-up", label: "Follow-Up", description: "Keeps leads moving until they reply, book, opt out, or become closed.", icon: MessageSquare },
  { id: "automation-booking", label: "AI Booking", description: "Moves interested prospects toward a confirmed appointment or handoff.", icon: Calendar },
  { id: "automation-reviews", label: "Reviews", description: "Requests reviews when the customer experience is fresh and the timing is right.", icon: Star },
  { id: "automation-reactivation", label: "Reactivation", description: "Brings old leads, past customers, no-shows, and unclosed quotes back into motion.", icon: RefreshCw },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

export default function SixAutomationsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-20 md:py-32 bg-white" style={{ background: "#ffffff" }} aria-labelledby="six-automations-title">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 md:mb-20"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <SectionHeader
            eyebrow="Core Automation Stack"
            title="The Systems That Protect Your Lead Flow"
            subtitle="ClientSurge packages the front-end workflows your business needs: capture, recover, follow up, book, request reviews, and reactivate opportunities before they go quiet."
            align="center"
            variant="light"
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: "-100px" }}
        >
          {AUTOMATION_CARDS.map(({ id, label, description, icon: Icon }) => (
            <motion.div
              key={id}
              id={id}
              variants={shouldReduceMotion ? {} : cardVariants}
              className="group rounded-xl p-6 md:p-8 transition-all duration-300"
              style={{ background: "#ffffff", border: "1px solid rgba(0,174,239,0.18)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", scrollMarginTop: "var(--cs-anchor-offset)" }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ background: "rgba(53,189,241,0.12)", border: "1px solid rgba(53,189,241,0.25)" }}>
                <Icon className="w-6 h-6" style={{ color: "#35BDF1" }} aria-hidden="true" />
              </div>
              <h3 className="font-titles font-black text-black mb-2" style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.015em" }}>{label}</h3>
              <p style={{ color: "rgba(10,22,40,0.7)", fontSize: "0.9rem", lineHeight: 1.68 }}>{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
