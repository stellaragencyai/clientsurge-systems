import { PhoneCall, UserPlus, MessageSquare, CalendarCheck, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const PROOF_CARDS = [
  { title: "Missed Call Recovered", desc: "AI answered after hours.", icon: PhoneCall },
  { title: "Lead Captured", desc: "New inquiry added to pipeline.", icon: UserPlus },
  { title: "SMS Sent", desc: "Follow-up delivered in seconds.", icon: MessageSquare },
  { title: "Booking Created", desc: "Appointment link sent automatically.", icon: CalendarCheck },
  { title: "Revenue Leak Closed", desc: "Old lead reactivated.", icon: TrendingUp },
];

// Desktop absolute positions — closer to center, balanced framing
const DESKTOP_POSITIONS = [
  { top: "20%", left: "4%" },
  { top: "22%", right: "5%" },
  { top: "50%", left: "3%" },
  { top: "52%", right: "4%" },
  { bottom: "18%", left: "5%" },
];

const GLASS_CARD = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 14px",
  borderRadius: "10px",
  background: "rgba(6, 16, 37, 0.75)",
  backdropFilter: "blur(12px) saturate(1.3)",
  WebkitBackdropFilter: "blur(12px) saturate(1.3)",
  border: "1px solid rgba(53, 189, 241, 0.28)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(53, 189, 241, 0.08)",
  minWidth: "180px",
};

const ICON_WRAPPER = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "rgba(53, 189, 241, 0.14)",
  border: "1px solid rgba(53, 189, 241, 0.32)",
  flexShrink: 0,
};

/**
 * FloatingAutomationProofCards
 * variant="desktop" — absolutely positioned dark glassmorphism cards with gentle float
 * variant="mobile"  — compact inline strip of 3 cards below hero CTAs
 *
 * All animation respects prefers-reduced-motion.
 */
export default function FloatingAutomationProofCards({ variant = "desktop" }) {
  const shouldReduceMotion = useReducedMotion();

  if (variant === "mobile") {
    return (
      <div className="xl:hidden flex flex-wrap justify-center gap-2 mt-8 relative z-10">
        {PROOF_CARDS.slice(0, 3).map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(6, 16, 37, 0.75)",
                backdropFilter: "blur(12px) saturate(1.3)",
                WebkitBackdropFilter: "blur(12px) saturate(1.3)",
                border: "1px solid rgba(53, 189, 241, 0.26)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.30)",
              }}
            >
              <div
                style={{
                  ...ICON_WRAPPER,
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                }}
              >
                <Icon style={{ width: 14, height: 14, color: "#35BDF1" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                {card.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Desktop variant — absolute positioned floating cards around hero edges
  return (
    <div className="hidden xl:block absolute inset-0 pointer-events-none z-[5]">
      {PROOF_CARDS.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            className="absolute"
            style={DESKTOP_POSITIONS[i]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.5 }}
          >
            <motion.div
              style={GLASS_CARD}
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            >
              <div style={ICON_WRAPPER}>
                <Icon style={{ width: 18, height: 18, color: "#35BDF1" }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, margin: 0 }}>
                  {card.title}
                </p>
                <p style={{ fontSize: "10px", color: "#AEB8C8", lineHeight: 1.3, margin: "2px 0 0" }}>
                  {card.desc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}