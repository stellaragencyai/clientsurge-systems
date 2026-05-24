import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Globe, MessageSquare, Mail, Zap, CalendarCheck, RefreshCw } from "lucide-react";

// Unified brand palette — electric blue family
const BRAND = {
  blue:    "#00AEEF",
  navy:    "#003B8F",
  midblue: "#006BB0",
  cyan:    "#00D4FF",
  teal:    "#00B8CC",
  indigo:  "#0055CC",
};

const STEPS = [
  { time: "0 sec",  label: "Lead submits form",          Icon: Globe,         color: BRAND.blue,    channel: "Web",   bg: "rgba(0,174,239,0.10)" },
  { time: "< 60s",  label: "Instant SMS fired",           Icon: MessageSquare, color: BRAND.cyan,    channel: "SMS",   bg: "rgba(0,212,255,0.10)" },
  { time: "10 min", label: "Follow-up email sent",        Icon: Mail,          color: BRAND.midblue, channel: "Email", bg: "rgba(0,107,176,0.10)" },
  { time: "1 hr",   label: "Second SMS — urgency nudge",  Icon: Zap,           color: BRAND.teal,    channel: "SMS",   bg: "rgba(0,184,204,0.10)" },
  { time: "24 hr",  label: "Booking prompt delivered",    Icon: CalendarCheck, color: BRAND.navy,    channel: "Email", bg: "rgba(0,59,143,0.10)"  },
  { time: "Day 3",  label: "Nurture sequence begins",     Icon: RefreshCw,     color: BRAND.indigo,  channel: "Auto",  bg: "rgba(0,85,204,0.10)"  },
];

function Step({ step, index, inView }) {
  const isLast = index === STEPS.length - 1;
  const { Icon } = step;

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={false}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.12 + index * 0.15, ease: "easeOut" }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 36 }}>
        {/* Icon circle */}
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: step.bg,
            border: `1.5px solid ${step.color}40`,
            boxShadow: `0 0 0 0px ${step.color}00`,
          }}
          animate={inView ? {
            boxShadow: [
              `0 0 0px ${step.color}00`,
              `0 0 12px ${step.color}55`,
              `0 0 0px ${step.color}00`,
            ]
          } : {}}
          transition={{ duration: 2.2, delay: 0.5 + index * 0.15, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon style={{ width: 16, height: 16, color: step.color }} strokeWidth={2} />
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <motion.div
            style={{
              width: 1.5,
              minHeight: 28,
              flex: 1,
              background: `linear-gradient(to bottom, ${step.color}50, ${STEPS[index + 1].color}30)`,
              borderRadius: 999,
              marginTop: 3,
            }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.15 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{ background: step.bg, color: step.color, border: `1px solid ${step.color}30` }}
          >
            {step.channel}
          </span>
          <span className="text-[10px] font-semibold tabular-nums" style={{ color: step.color }}>
            {step.time}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function FollowUpTimeline() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="rounded-2xl max-w-xs w-full overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #ffffff 0%, #f0f8ff 100%)",
        border: "1.5px solid rgba(0,174,239,0.18)",
        boxShadow: "0 20px 60px rgba(0,59,143,0.10), 0 4px 16px rgba(0,174,239,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
      aria-label="Automated follow-up timeline"
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #003B8F 0%, #006BB0 50%, #00AEEF 100%)",
          borderBottom: "1px solid rgba(0,174,239,0.2)",
        }}
      >
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-blue-200 mb-0.5">ClientSurge AI</p>
          <p className="text-sm font-bold text-white leading-tight">Automation Sequence</p>
          <p className="text-[10px] text-blue-200 mt-0.5">Every lead, every time — automatically</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="text-[8px] text-green-300 font-bold uppercase tracking-wide">Live</span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 pt-5 pb-2">
        {STEPS.map((step, i) => (
          <Step key={step.label} step={step} index={i} inView={inView} />
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(0,174,239,0.1)", background: "rgba(0,174,239,0.03)" }}
      >
        <span className="text-[10px] text-muted-foreground font-medium">Fully automated · No manual work</span>
        <span className="text-[10px] font-bold text-primary">6 touchpoints</span>
      </div>
    </div>
  );
}
