import { motion, useReducedMotion } from "framer-motion";
import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import SectionHeader from "@/components/design-system/SectionHeader";

const AUTOMATION_CARDS = [
  { id: "automation-lead-capture", label: "Lead Capture", description: "Turns forms, calls, ads, and website inquiries into one trackable pipeline — so no lead slips through the cracks.", icon: Zap },
  { id: "automation-missed-call", label: "Missed-Call Recovery", description: "Texts missed callers instantly so the conversation continues — before they call your competitor.", icon: Phone },
  { id: "automation-follow-up", label: "AI Follow-Up", description: "Keeps leads moving with automated multi-step sequences until they reply, book, opt out, or close.", icon: MessageSquare },
  { id: "automation-booking", label: "AI Booking", description: "Moves interested prospects toward a confirmed appointment — no manual back-and-forth needed.", icon: Calendar },
  { id: "automation-reviews", label: "Review Requests", description: "Automatically requests reviews when the customer experience is fresh and the timing is right.", icon: Star },
  { id: "automation-reactivation", label: "Lead Reactivation", description: "Brings old leads, past customers, no-shows, and unclosed quotes back into motion automatically.", icon: RefreshCw },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };

const ICON_PULSE_KEYFRAMES = `
@keyframes csIconPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(53,189,241,0.15); }
  50% { box-shadow: 0 0 14px 1px rgba(53,189,241,0.25); }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes csIconPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(53,189,241,0.15); } }
}
`;
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

export default function SixAutomationsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-20 md:py-32 bg-white" style={{ background: "#ffffff" }} aria-labelledby="six-automations-title">
      <style>{ICON_PULSE_KEYFRAMES}</style>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 md:mb-20"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <SectionHeader
            eyebrow="The Automation Store"
            title="Six Systems That Protect Every Lead"
            subtitle="Browse the automation stack — capture, recover, follow up, book, request reviews, and reactivate. Add individual modules or pick a full system. No demos required."
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
              className="group rounded-xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              style={{ background: "#ffffff", border: "1px solid rgba(0,174,239,0.18)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", scrollMarginTop: "var(--cs-anchor-offset)" }}
            >
              <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ background: "rgba(53,189,241,0.12)", border: "1px solid rgba(53,189,241,0.25)", animation: "csIconPulse 3s ease-in-out infinite" }}>
                <Icon className="w-6 h-6" style={{ color: "#35BDF1" }} aria-hidden="true" />
              </div>
              <h3 className="font-titles font-black text-black mb-2" style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.015em" }}>{label}</h3>
              <p style={{ color: "rgba(10,22,40,0.7)", fontSize: "0.9rem", lineHeight: 1.68 }}>{description}</p>
              <Link
                to="/store"
                onClick={() => trackCTA(`automation_card_${id}`, "six_automations")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}