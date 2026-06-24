import { motion, useReducedMotion } from "framer-motion";
import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw } from "lucide-react";

const PILLS = [
  { id: "pill-capture", label: "Lead Capture", icon: Zap },
  { id: "pill-missed-call", label: "Missed-Call Recovery", icon: Phone },
  { id: "pill-follow-up", label: "Instant Follow-Up", icon: MessageSquare },
  { id: "pill-booking", label: "AI Booking", icon: Calendar },
  { id: "pill-reviews", label: "Review Requests", icon: Star },
  { id: "pill-reactivation", label: "Lead Reactivation", icon: RefreshCw },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.35 },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function CompactAutomationPills() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : containerVariants}
      initial={shouldReduceMotion ? {} : "hidden"}
      animate={shouldReduceMotion ? {} : "visible"}
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-5xl mt-10 sm:mt-12"
    >
      {PILLS.map(({ id, label, icon: Icon }) => (
        <motion.button
          key={id}
          id={id}
          type="button"
          variants={shouldReduceMotion ? {} : pillVariants}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 hover:border-[rgba(53,189,241,0.6)] hover:bg-[rgba(53,189,241,0.08)] hover:shadow-[0_0_16px_rgba(53,189,241,0.25)]"
          style={{
            background: "rgba(8, 20, 44, 0.5)",
            border: "1px solid rgba(53, 189, 241, 0.25)",
            color: "#FFFFFF",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            minHeight: "44px",
            whiteSpace: "nowrap",
          }}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#35BDF1" }} aria-hidden="true" />
          <span>{label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}