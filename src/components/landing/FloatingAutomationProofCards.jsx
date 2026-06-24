import { PhoneCall, UserPlus, MessageSquare, CalendarCheck, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const PROOF_CARDS = [
  { title: "Missed Call Recovered", desc: "AI answered after hours.", icon: PhoneCall },
  { title: "Lead Captured", desc: "New inquiry added to pipeline.", icon: UserPlus },
  { title: "SMS Sent", desc: "Follow-up delivered in seconds.", icon: MessageSquare },
  { title: "Booking Created", desc: "Appointment link sent automatically.", icon: CalendarCheck },
  { title: "Revenue Leak Closed", desc: "Old lead reactivated.", icon: TrendingUp },
];

// Desktop absolute positions — distributed around hero edges, never blocking center content
const DESKTOP_POSITIONS = [
  { top: "15%", left: "2%" },
  { top: "24%", right: "2%" },
  { top: "47%", left: "1.5%" },
  { top: "55%", right: "1.5%" },
  { bottom: "14%", left: "3%" },
];

const GLASS_CARD = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderRadius: "12px",
  background: "rgba(12, 28, 56, 0.72)",
  backdropFilter: "blur(16px) saturate(1.4)",
  WebkitBackdropFilter: "blur(16px) saturate(1.4)",
  border: "1px solid rgba(0, 174, 239, 0.22)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  minWidth: "200px",
};

const ICON_WRAPPER = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "rgba(0, 174, 239, 0.18)",
  border: "1px solid rgba(0, 174, 239, 0.28)",
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
                background: "rgba(12, 28, 56, 0.72)",
                backdropFilter: "blur(12px) saturate(1.3)",
                WebkitBackdropFilter: "blur(12px) saturate(1.3)",
                border: "1px solid rgba(0, 174, 239, 0.20)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
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
                <Icon style={{ width: 14, height: 14, color: "#00AEEF" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>
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
                <Icon style={{ width: 18, height: 18, color: "#00AEEF" }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, margin: 0 }}>
                  {card.title}
                </p>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", lineHeight: 1.3, margin: "2px 0 0" }}>
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