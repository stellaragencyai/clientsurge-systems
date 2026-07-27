import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw, ShoppingCart, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const AUTOMATION_CARDS = [
  { id: "automation-lead-capture", label: "Lead Capture", description: "Turns forms, calls, ads, and website inquiries into one trackable pipeline — so no lead slips through the cracks.", icon: Zap, metric: "< 60 sec", metricLabel: "to first response" },
  { id: "automation-missed-call", label: "Missed-Call Recovery", description: "Texts missed callers instantly so the conversation continues — before they call your competitor.", icon: Phone, metric: "78%", metricLabel: "recovery rate" },
  { id: "automation-follow-up", label: "AI Follow-Up", description: "Keeps leads moving with automated multi-step sequences until they reply, book, opt out, or close.", icon: MessageSquare, metric: "14-day", metricLabel: "nurture sequence" },
  { id: "automation-booking", label: "AI Booking", description: "Moves interested prospects toward a confirmed appointment — no manual back-and-forth needed.", icon: Calendar, metric: "24/7", metricLabel: "booking availability" },
  { id: "automation-reviews", label: "Review Requests", description: "Automatically requests reviews when the customer experience is fresh and the timing is right.", icon: Star, metric: "3x", metricLabel: "more reviews" },
  { id: "automation-reactivation", label: "Lead Reactivation", description: "Brings old leads, past customers, no-shows, and unclosed quotes back into motion automatically.", icon: RefreshCw, metric: "30-90 days", metricLabel: "dormant re-engaged" },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };

const ICON_PULSE_KEYFRAMES = `
@keyframes csIconPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.15); }
  50% { box-shadow: 0 0 14px 1px rgba(0,212,255,0.25); }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes csIconPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.15); } }
}
`;
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

export default function SixAutomationsSection() {
  const shouldReduceMotion = useReducedMotion();
  const [showAll, setShowAll] = useState(false);
  const visibleCards = showAll ? AUTOMATION_CARDS : AUTOMATION_CARDS.slice(0, 3);
  const hiddenCount = AUTOMATION_CARDS.length - visibleCards.length;

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
          <CSSectionHeader
            eyebrow="The Automation Store"
            title="Six Systems That Protect Every Lead"
            subtitle="Browse the automation stack — capture, recover, follow up, book, request reviews, and reactivate. Add individual modules or pick a full system. No demos required."
            align="center"
            theme="light"
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: "-100px" }}
        >
          {visibleCards.map(({ id, label, description, icon: Icon, metric, metricLabel }) => (
            <motion.div
              key={id}
              id={id}
              variants={shouldReduceMotion ? {} : cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -8, boxShadow: "0 18px 42px rgba(0,212,255,0.18), 0 0 0 1px rgba(0,212,255,0.12)" }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="cs-feature-card p-5 md:p-6"
              style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", animation: "csIconPulse 3s ease-in-out infinite" }}
                  whileHover={shouldReduceMotion ? {} : { rotate: -6, scale: 1.12 }}
                  transition={{ type: "spring", stiffness: 320, damping: 16 }}
                >
                  <Icon className="w-6 h-6" style={{ color: "#00D4FF" }} aria-hidden="true" />
                </motion.div>
                <div className="text-right">
                  <p className="font-titles font-black" style={{ fontSize: "1.1rem", color: "#002D62", lineHeight: 1 }}>{metric}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{metricLabel}</p>
                </div>
              </div>
              <h3 className="font-titles font-black text-black mb-2" style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.015em" }}>{label}</h3>
              <p style={{ color: "#1e293b", fontSize: "0.9rem", lineHeight: 1.68 }}>{description}</p>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  to={`/store?focus=${encodeURIComponent(id)}`}
                  onClick={() => trackCTA(`automation_card_${id}`, "six_automations")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </Link>
                <span className="text-[10px] font-semibold text-gray-300">ID: {id.replace("automation-", "")}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {hiddenCount > 0 && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="cs-btn-outline inline-flex items-center gap-2"
              style={{ padding: "0.7rem 1.4rem", fontSize: "0.88rem" }}
            >
              Show all {AUTOMATION_CARDS.length} automations
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
            <p className="text-xs font-semibold text-muted-foreground">
              {hiddenCount} more system{hiddenCount > 1 ? "s" : ""} — reactivation, reviews &amp; booking
            </p>
          </div>
        )}
        {showAll && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="text-xs font-bold text-primary hover:text-primary/70 transition-colors"
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </section>
  );
}