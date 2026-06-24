import { motion, useReducedMotion } from "framer-motion";
import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw } from "lucide-react";

const AUTOMATION_CARDS = [
  {
    id: "automation-lead-capture",
    label: "Lead Capture",
    description: "Turn website visitors and form submissions into structured lead records.",
    icon: Zap,
  },
  {
    id: "automation-missed-call",
    label: "Missed-Call Recovery",
    description: "Send an instant response when a prospect calls and no one answers.",
    icon: Phone,
  },
  {
    id: "automation-follow-up",
    label: "Instant Follow-Up",
    description: "Trigger fast SMS and email follow-up while the lead is still warm.",
    icon: MessageSquare,
  },
  {
    id: "automation-booking",
    label: "AI Booking",
    description: "Guide qualified prospects toward the right booking path automatically.",
    icon: Calendar,
  },
  {
    id: "automation-reviews",
    label: "Review Requests",
    description: "Prompt happy customers to leave reviews after the right trigger.",
    icon: Star,
  },
  {
    id: "automation-reactivation",
    label: "Lead Reactivation",
    description: "Bring old leads back into motion with clean follow-up sequences.",
    icon: RefreshCw,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function SixAutomationsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative py-20 md:py-32"
      style={{ background: "#061025" }}
      aria-labelledby="six-automations-title"
    >
      {/* Subtle accent background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(53,189,241,0.03), transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2
            id="six-automations-title"
            className="font-titles font-black text-white mb-5"
            style={{ fontSize: "clamp(2rem, 4.8vw, 3.25rem)", lineHeight: 1.15, letterSpacing: "-0.025em" }}
          >
            Six Automations. One Lead-Response System.
          </h2>
          <p
            className="mx-auto"
            style={{
              maxWidth: "660px",
              color: "#AEB8C8",
              fontSize: "clamp(1rem, 1.5vw, 1.08rem)",
              lineHeight: 1.72,
            }}
          >
            ClientSurge connects the critical pieces of your front-end sales flow so new
            leads, missed calls, old leads, and booking requests do not sit untouched.
          </p>
        </motion.div>

        {/* Cards Grid */}
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
              style={{
                background: "rgba(8,20,44,0.6)",
                border: "1px solid rgba(53,189,241,0.15)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                scrollMarginTop: "var(--cs-anchor-offset)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(53,189,241,0.35)";
                e.currentTarget.style.boxShadow =
                  "0 0 24px rgba(53,189,241,0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(53,189,241,0.15)";
                e.currentTarget.style.boxShadow =
                  "inset 0 1px 0 rgba(255,255,255,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Icon Container */}
              <div
                className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                style={{
                  background: "rgba(53,189,241,0.12)",
                  border: "1px solid rgba(53,189,241,0.25)",
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: "#35BDF1" }}
                  aria-hidden="true"
                />
              </div>

              {/* Title */}
              <h3
                className="font-titles font-black text-white mb-2"
                style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.015em" }}
              >
                {label}
              </h3>

              {/* Description */}
              <p
                style={{
                  color: "#AEB8C8",
                  fontSize: "0.9rem",
                  lineHeight: 1.68,
                }}
              >
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}