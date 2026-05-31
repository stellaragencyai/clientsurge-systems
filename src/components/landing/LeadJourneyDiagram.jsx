import { motion } from "framer-motion";
import { useState } from "react";
import {
  PhoneIncoming,
  MessageSquare,
  Clock,
  UserCheck,
  CalendarCheck,
  Star,
  ArrowDown,
  CheckCircle2,
  Zap,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: PhoneIncoming,
    title: "Lead Comes In",
    subtitle: "< 0 seconds",
    description:
      "A prospect calls, texts, fills a form, or clicks an ad. The trigger fires instantly — 24/7, including evenings and weekends.",
    tag: "Trigger",
    tagColor: "#0088CC",
    smsPreview: null,
    color: "#0088CC",
    bg: "rgba(0,136,204,0.08)",
    border: "rgba(0,136,204,0.22)",
  },
  {
    id: 2,
    icon: MessageSquare,
    title: "Instant SMS Fires",
    subtitle: "< 90 seconds",
    description:
      "Before any competitor can respond, your lead receives a personalized SMS with your business name and a direct booking link.",
    tag: "Automation",
    tagColor: "#00AEEF",
    smsPreview:
      'Hi [Name], thanks for reaching out to [Business]! We\'d love to help. Reply here or book directly: [link]. — [Team]',
    color: "#00AEEF",
    bg: "rgba(0,174,239,0.08)",
    border: "rgba(0,174,239,0.22)",
  },
  {
    id: 3,
    icon: Clock,
    title: "Smart Follow-Up Sequence",
    subtitle: "2 min → 1 hr → 24 hr",
    description:
      "If they don't reply, the system follows up automatically at timed intervals — SMS then email — until there's a response or they opt out.",
    tag: "Nurture",
    tagColor: "#006BB0",
    smsPreview:
      "Just checking in — did you get a chance to look at our booking link? We have availability this week. 📅",
    color: "#006BB0",
    bg: "rgba(0,107,176,0.08)",
    border: "rgba(0,107,176,0.22)",
  },
  {
    id: 4,
    icon: UserCheck,
    title: "Lead Qualified by AI",
    subtitle: "Instant classification",
    description:
      "When the lead replies, AI reads intent — pricing interest, booking readiness, objections — and routes them to the right next step.",
    tag: "AI",
    tagColor: "#003B8F",
    smsPreview: null,
    color: "#003B8F",
    bg: "rgba(0,59,143,0.07)",
    border: "rgba(0,59,143,0.2)",
  },
  {
    id: 5,
    icon: CalendarCheck,
    title: "Booking Confirmed",
    subtitle: "Automated",
    description:
      "The system sends a booking link, confirms the appointment, and schedules a reminder SMS/email 24 hours and 1 hour before the appointment.",
    tag: "Booking",
    tagColor: "#0077B6",
    smsPreview:
      "✅ You're confirmed for [Date] at [Time] with [Business]! We'll send a reminder before your appointment.",
    color: "#0077B6",
    bg: "rgba(0,119,182,0.08)",
    border: "rgba(0,119,182,0.22)",
  },
  {
    id: 6,
    icon: Star,
    title: "Review Request Sent",
    subtitle: "After appointment",
    description:
      "After the job or appointment is complete, the system automatically requests a Google review — turning happy clients into new leads.",
    tag: "Reputation",
    tagColor: "#F59E0B",
    smsPreview:
      "Hope everything went great! Would you mind leaving us a quick review? It helps our small business a lot: [review link] ⭐",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.22)",
  },
];

function SMSBubble({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-4 rounded-2xl rounded-tl-sm px-4 py-3 text-xs leading-relaxed text-white/95 max-w-xs"
      style={{
        background: "linear-gradient(135deg, #0088CC 0%, #006BB0 100%)",
        boxShadow: "0 4px 16px rgba(0,136,204,0.3)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        letterSpacing: "0.01em",
      }}
    >
      {text}
      <div className="mt-1.5 text-right opacity-60 text-[10px]">✓✓ Delivered</div>
    </motion.div>
  );
}

function StepCard({ step, isActive, onClick, index }) {
  const Icon = step.icon;
  return (
    <motion.button
      type="button"
      onClick={() => onClick(step.id)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -3 }}
      className="w-full text-left relative"
    >
      <div
        className="relative rounded-2xl p-5 transition-all duration-300 cursor-pointer"
        style={{
          background: isActive ? step.bg : "rgba(255,255,255,0.9)",
          border: isActive
            ? `2px solid ${step.border}`
            : "1.5px solid rgba(0,0,0,0.07)",
          boxShadow: isActive
            ? `0 8px 32px ${step.color}22, 0 2px 8px rgba(0,0,0,0.06)`
            : "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Step number + tag row */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isActive ? step.color : "rgba(0,136,204,0.1)",
              transition: "background 0.3s",
            }}
          >
            <Icon
              className="w-4.5 h-4.5"
              style={{ color: isActive ? "#fff" : step.color, width: "18px", height: "18px" }}
            />
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
            style={{
              background: `${step.color}15`,
              color: step.color,
              border: `1px solid ${step.color}30`,
            }}
          >
            {step.tag}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-0.5">
          {step.title}
        </h3>
        <p className="text-[11px] font-semibold mb-2" style={{ color: step.color }}>
          {step.subtitle}
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>

        {/* SMS preview when active */}
        {isActive && step.smsPreview && <SMSBubble text={step.smsPreview} />}

        {/* Active indicator dot */}
        {isActive && (
          <div
            className="absolute top-4 right-4 w-2 h-2 rounded-full"
            style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }}
          />
        )}
      </div>
    </motion.button>
  );
}

function ConnectorArrow({ color }) {
  return (
    <div className="flex justify-center my-1">
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="w-5 h-5" style={{ color: color || "#0088CC", opacity: 0.5 }} />
      </motion.div>
    </div>
  );
}

function TimelineRail() {
  return (
    <div
      className="hidden lg:block absolute left-1/2 top-8 bottom-8 -translate-x-1/2 w-px pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,136,204,0.18), rgba(0,174,239,0.38), rgba(0,59,143,0.18))",
      }}
    />
  );
}

export default function LeadJourneyDiagram() {
  const [activeStep, setActiveStep] = useState(1);

  const handleClick = (id) => {
    setActiveStep((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="lead-journey"
      className="px-4 py-16 md:px-6 md:py-24 overflow-hidden"
      style={{ background: "#f8fbff" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ background: "linear-gradient(to right, transparent, rgba(0,174,239,0.6))" }} />
            <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: "#0088CC" }}>
              What happens after a lead comes in
            </p>
            <div className="h-px w-8" style={{ background: "linear-gradient(to left, transparent, rgba(0,174,239,0.6))" }} />
          </div>
          <h2
            className="font-bold tracking-tight leading-tight text-slate-900 mb-4"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontFamily: "Montserrat, sans-serif" }}
          >
            From First Contact to{" "}
            <span style={{ color: "#00AEEF" }}>Booked Appointment</span>
            <br />in Under 90 Seconds
          </h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Click any step to see exactly what your lead receives — and when. Every message is automated, personalized, and sent without any manual effort from your team.
          </p>
        </motion.div>

        {/* 2-col layout: steps + visual panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-start">
          {/* Step Cards */}
          <div className="relative">
            <div className="space-y-3">
              {STEPS.map((step, index) => (
                <div key={step.id}>
                  <StepCard
                    step={step}
                    isActive={activeStep === step.id}
                    onClick={handleClick}
                    index={index}
                  />
                  {index < STEPS.length - 1 && (
                    <ConnectorArrow color={step.color} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel — sticky visual */}
          <div className="lg:sticky lg:top-28 self-start">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(0,136,204,0.14)",
                boxShadow: "0 24px 64px rgba(0,59,143,0.10), 0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              {/* Panel header */}
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,136,204,0.06) 0%, rgba(0,174,239,0.04) 100%)",
                  borderBottom: "1px solid rgba(0,136,204,0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #0088CC, #00AEEF)",
                      boxShadow: "0 4px 12px rgba(0,136,204,0.3)",
                    }}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ClientSurge</p>
                    <p className="text-sm font-bold text-slate-800">Lead Journey Timeline</p>
                  </div>
                </div>
              </div>

              {/* Steps summary list */}
              <div className="p-5 space-y-2">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = activeStep === step.id;
                  const isPast = step.id < (activeStep || 0);
                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      onClick={() => handleClick(step.id)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                      style={{
                        background: isActive
                          ? `${step.color}12`
                          : "transparent",
                        border: isActive
                          ? `1.5px solid ${step.color}35`
                          : "1.5px solid transparent",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isPast
                            ? "#22c55e"
                            : isActive
                            ? step.color
                            : "rgba(0,0,0,0.06)",
                        }}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Icon
                            style={{
                              width: "14px",
                              height: "14px",
                              color: isActive ? "#fff" : "#94a3b8",
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{
                            color: isActive ? step.color : isPast ? "#22c55e" : "#64748b",
                          }}
                        >
                          {step.title}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-semibold flex-shrink-0"
                        style={{ color: isActive ? step.color : "#94a3b8" }}
                      >
                        {step.subtitle}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Active step detail */}
              {activeStep && (() => {
                const step = STEPS.find((s) => s.id === activeStep);
                if (!step) return null;
                const Icon = step.icon;
                return (
                  <motion.div
                    key={`detail-${activeStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mx-4 mb-4 rounded-2xl p-4"
                    style={{
                      background: step.bg,
                      border: `1.5px solid ${step.border}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon style={{ width: "14px", height: "14px", color: step.color }} />
                      <span
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: step.color }}
                      >
                        Step {step.id} — {step.tag}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-1">{step.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                    {step.smsPreview && (
                      <div
                        className="mt-3 rounded-xl px-3 py-2.5 text-xs text-white leading-relaxed"
                        style={{
                          background: "linear-gradient(135deg, #0088CC, #003B8F)",
                          fontSize: "11px",
                        }}
                      >
                        {step.smsPreview}
                      </div>
                    )}
                  </motion.div>
                );
              })()}

              {/* Bottom CTA */}
              <div
                className="px-5 py-4 text-center"
                style={{ borderTop: "1px solid rgba(0,136,204,0.1)" }}
              >
                <p className="text-[11px] text-slate-400 mb-3">
                  This entire flow runs without your team lifting a finger.
                </p>
                <a
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
                    boxShadow: "0 4px 14px rgba(0,136,204,0.35)",
                  }}
                >
                  See It For Your Business →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}