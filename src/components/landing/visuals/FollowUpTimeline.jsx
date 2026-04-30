/**
 * Visual 2: Follow-Up Timeline Cascade
 * A vertical animated timeline showing a lead entering and each automated
 * touchpoint firing in sequence — each step "lights up" in turn, conveying
 * speed and inevitability. Designed to be embedded in a feature section.
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  { time: "0 sec",  label: "Lead submits form",          icon: "📋", color: "#22c55e", channel: "Web" },
  { time: "< 60s",  label: "Instant SMS fired",           icon: "💬", color: "#9a5c2e", channel: "SMS" },
  { time: "10 min", label: "Follow-up email sent",        icon: "✉️", color: "#3b82f6", channel: "Email" },
  { time: "1 hr",   label: "Second SMS — urgency nudge",  icon: "⚡", color: "#f59e0b", channel: "SMS" },
  { time: "24 hr",  label: "Booking prompt delivered",    icon: "📅", color: "#a855f7", channel: "Email" },
  { time: "Day 3",  label: "Nurture sequence begins",     icon: "🔁", color: "#c8965c", channel: "Auto" },
];

function Step({ step, index, inView }) {
  const isLast = index === STEPS.length - 1;
  return (
    <motion.div
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.18, ease: "easeOut" }}
    >
      {/* Left: time + connector line */}
      <div className="flex flex-col items-center" style={{ minWidth: 52 }}>
        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{step.time}</span>
        {!isLast && (
          <motion.div
            className="w-px mt-1 rounded-full"
            style={{ background: `${step.color}55`, minHeight: 32 }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.35, delay: 0.35 + index * 0.18 }}
          />
        )}
      </div>

      {/* Icon dot */}
      <motion.div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 shadow-md"
        style={{ background: `${step.color}18`, border: `1.5px solid ${step.color}55` }}
        animate={inView ? { boxShadow: [`0 0 0px ${step.color}00`, `0 0 14px ${step.color}66`, `0 0 0px ${step.color}00`] } : {}}
        transition={{ duration: 1.8, delay: 0.5 + index * 0.18, repeat: Infinity }}
      >
        {step.icon}
      </motion.div>

      {/* Label + channel badge */}
      <div className="pb-5 pt-0.5 flex-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
          style={{ background: `${step.color}15`, color: step.color }}
        >
          {step.channel}
        </span>
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
      className="rounded-3xl px-6 pt-7 pb-3 max-w-sm"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(250,243,232,0.85) 100%)",
        border: "1.5px solid rgba(154,92,46,0.18)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
      aria-label="Automated follow-up timeline"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary mb-0.5">Automation Sequence</p>
          <p className="text-base font-semibold text-foreground">Every lead, every time</p>
        </div>
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-green-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </div>

      <div>
        {STEPS.map((step, i) => (
          <Step key={step.label} step={step} index={i} inView={inView} />
        ))}
      </div>
    </div>
  );
}