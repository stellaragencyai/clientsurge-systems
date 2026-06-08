import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageSquare, Zap, Calendar, Star, CheckCircle2, ArrowRight, ChevronDown } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: Phone,
    label: "Missed Call",
    color: "#EF4444",
    bgLight: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    title: "Lead calls — you miss it",
    detail: "A prospect calls your business number. No answer. Without automation, they move on to a competitor.",
    sms: null,
  },
  {
    id: 2,
    icon: MessageSquare,
    label: "Instant SMS",
    color: "#00AEEF",
    bgLight: "rgba(0,174,239,0.08)",
    border: "rgba(0,174,239,0.28)",
    title: "AI texts back in under 60s",
    detail: "ClientSurge detects the missed call and fires a personalized SMS within 60 seconds, keeping the lead warm.",
    sms: { from: "ClientSurge AI", text: "Hi! Sorry we missed your call — I'm the AI assistant for [Business]. Are you still looking for help today?" },
  },
  {
    id: 3,
    icon: Zap,
    label: "Lead Replies",
    color: "#8B5CF6",
    bgLight: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    title: "They reply — AI qualifies instantly",
    detail: "The lead replies with their need. The AI reads it, qualifies the intent, and moves them to the next step.",
    sms: { from: "Lead", text: "Yes! I need a quote for my HVAC system — it stopped working this morning." },
  },
  {
    id: 4,
    icon: Calendar,
    label: "Booking Link",
    color: "#10B981",
    bgLight: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    title: "AI sends booking link",
    detail: "Based on the lead's reply, the AI sends a direct booking link for a consultation. No human required.",
    sms: { from: "ClientSurge AI", text: "Got it — sounds urgent! Here's a link to book your HVAC consultation today: [bookinglink.com/hvac] 🗓️" },
  },
  {
    id: 5,
    icon: Star,
    label: "Review Request",
    color: "#F59E0B",
    bgLight: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    title: "After service — review requested",
    detail: "Post-appointment, the system automatically sends a review request to build your online reputation.",
    sms: { from: "ClientSurge AI", text: "Thanks for choosing us! We'd love your feedback — click here to leave a quick Google review ⭐" },
  },
  {
    id: 6,
    icon: CheckCircle2,
    label: "Booked & Live",
    color: "#003B8F",
    bgLight: "rgba(0,59,143,0.08)",
    border: "rgba(0,59,143,0.25)",
    title: "Appointment confirmed — revenue recovered",
    detail: "What was a missed call is now a confirmed booking, a happy client, and a 5-star review — fully automated.",
    sms: null,
  },
];

export default function LeadJourneyDiagram() {
  const [activeStep, setActiveStep] = useState(2);

  const current = steps[activeStep];
  const Icon = current.icon;

  return (
    <section id="lead-journey" className="px-4 py-16 md:px-6 md:py-24" style={{ background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" }}>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: "#005f99" }}>
            Lead Journey Diagram
          </p>
          <h2 className="font-bold text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>
            From Missed Call to Booked Appointment
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every step automated. No manual follow-up required. See exactly how a lead moves through the ClientSurge system.
          </p>
        </div>

        {/* Step pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200"
                style={{
                  background: isActive ? step.bgLight : "rgba(15,23,42,0.04)",
                  border: `1.5px solid ${isActive ? step.border : "rgba(15,23,42,0.08)"}`,
                  color: isActive ? step.color : "rgba(15,23,42,0.55)",
                  boxShadow: isActive ? `0 4px 16px ${step.bgLight}` : "none",
                }}
              >
                <StepIcon style={{ width: 13, height: 13 }} />
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Main diagram */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: step flow */}
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute left-5 top-6 bottom-6 w-0.5 hidden md:block"
              style={{ background: "linear-gradient(180deg, rgba(0,174,239,0.15) 0%, rgba(0,174,239,0.5) 50%, rgba(0,59,143,0.2) 100%)" }}
            />
            <div className="space-y-3">
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === activeStep;
                const isPast = i < activeStep;
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    className="w-full text-left"
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200"
                      style={{
                        background: isActive ? step.bgLight : isPast ? "rgba(16,185,129,0.04)" : "transparent",
                        border: `1px solid ${isActive ? step.border : isPast ? "rgba(16,185,129,0.15)" : "transparent"}`,
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative z-10"
                        style={{
                          background: isActive ? step.color : isPast ? "#10B981" : "rgba(15,23,42,0.06)",
                          boxShadow: isActive ? `0 4px 16px ${step.bgLight}` : "none",
                        }}
                      >
                        {isPast && !isActive ? (
                          <CheckCircle2 style={{ width: 18, height: 18, color: "#fff" }} />
                        ) : (
                          <StepIcon style={{ width: 18, height: 18, color: isActive ? "#fff" : "rgba(15,23,42,0.35)" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold leading-snug"
                          style={{ color: isActive ? step.color : isPast ? "#10B981" : "rgba(15,23,42,0.5)" }}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{step.title}</p>
                      </div>
                      {isActive && <ChevronDown style={{ width: 14, height: 14, color: step.color, flexShrink: 0 }} />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right: active step detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-2xl border p-6 md:p-8"
              style={{
                background: current.bgLight,
                border: `1.5px solid ${current.border}`,
                boxShadow: `0 16px 48px ${current.bgLight}`,
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: current.color, boxShadow: `0 6px 20px ${current.bgLight}` }}
                >
                  <Icon style={{ width: 22, height: 22, color: "#fff" }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: current.color }}>
                    Step {current.id} of {steps.length}
                  </p>
                  <h3 className="text-lg font-bold text-foreground leading-snug">{current.title}</h3>
                </div>
              </div>

              <p className="text-sm leading-7 text-muted-foreground mb-6">{current.detail}</p>

              {current.sms && (
                <div className="rounded-xl border border-white/60 bg-white p-4 space-y-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Live SMS Preview</p>
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
                      current.sms.from === "Lead"
                        ? "bg-slate-100 text-slate-800 mr-auto"
                        : "ml-auto text-white"
                    }`}
                    style={current.sms.from !== "Lead" ? { background: "linear-gradient(135deg, #0088CC, #003B8F)" } : {}}
                  >
                    <p className="text-[10px] font-bold mb-1 opacity-60">{current.sms.from}</p>
                    {current.sms.text}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-6">
                {activeStep > 0 && (
                  <button
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border border-border bg-white text-foreground hover:bg-muted transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                {activeStep < steps.length - 1 && (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white transition-all"
                    style={{ background: current.color }}
                  >
                    Next Step <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}