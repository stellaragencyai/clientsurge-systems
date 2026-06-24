import { motion, useReducedMotion } from "framer-motion";
import { Phone, Zap, Calendar, Clock, Star, RefreshCw } from "lucide-react";

const CARDS = [
  {
    id: "card-missed-call",
    label: "Missed Call Text-Back",
    description: "Recover missed calls automatically.",
    icon: Phone,
  },
  {
    id: "card-instant-response",
    label: "Instant Lead Response",
    description: "Respond to new inquiries in seconds.",
    icon: Zap,
  },
  {
    id: "card-booking",
    label: "AI Booking Agent",
    description: "Turn inquiries into appointments.",
    icon: Calendar,
  },
  {
    id: "card-14day",
    label: "14-Day Follow-Up",
    description: "Keep leads warm automatically.",
    icon: Clock,
  },
  {
    id: "card-reviews",
    label: "Review Requests",
    description: "Trigger review requests after service.",
    icon: Star,
  },
  {
    id: "card-reactivation",
    label: "Lead Reactivation",
    description: "Bring old leads back into the pipeline.",
    icon: RefreshCw,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function PremiumHeroAutomationCards() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : containerVariants}
      initial={shouldReduceMotion ? {} : "hidden"}
      animate={shouldReduceMotion ? {} : "visible"}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-6xl mt-12 sm:mt-16"
    >
      {CARDS.map(({ id, label, description, icon: Icon }) => (
        <motion.div
          key={id}
          id={id}
          variants={shouldReduceMotion ? {} : cardVariants}
          className="group rounded-lg p-5 md:p-6 transition-all duration-300 cursor-pointer"
          style={{
            background: "rgba(8, 20, 44, 0.4)",
            border: "1px solid rgba(53, 189, 241, 0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.5)";
            e.currentTarget.style.boxShadow =
              "0 0 20px rgba(53, 189, 241, 0.25), inset 0 1px 0 rgba(255,255,255,0.08)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(53, 189, 241, 0.2)";
            e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Icon */}
          <div className="mb-3 flex items-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(53, 189, 241, 0.1)",
                border: "1px solid rgba(53, 189, 241, 0.2)",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: "#35BDF1" }} aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-sm md:text-base mb-1"
            style={{ color: "#FFFFFF", fontFamily: "'Montserrat', sans-serif" }}
          >
            {label}
          </h3>

          {/* Description */}
          <p
            className="text-xs md:text-sm leading-relaxed"
            style={{ color: "#AEB8C8" }}
          >
            {description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}