import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  HeadphonesIcon,
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  RotateCcw,
  Send,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

const steps = [
  ["01", "Lead Capture", Zap, "Instantly respond to every lead", "The system reacts within seconds so hot leads never wait around for a callback.", "Avg. 2x more bookings", ["Lead enters from form, call, ad, or message", "AI-powered response fires instantly", "Lead stays warm and moves forward"]],
  ["02", "Conversion", MessageSquare, "Turn inquiries into booked appointments", "Replies are written to move someone from interest into action instead of leaving them hanging.", "Saves 3-5 hrs/week", ["Questions come in about pricing or timing", "Response builds trust and adds the right CTA", "More prospects schedule consultations"]],
  ["03", "Missed Calls", PhoneCall, "Recover bookings from missed calls", "Every missed call gets an immediate text-back so high-intent demand does not disappear.", "0 leads lost", ["Call is missed during busy hours", "Auto-text acknowledges and continues the conversation", "Missed-call traffic still becomes revenue"]],
  ["04", "Follow-Up", Send, "Automate follow-up so nothing slips through", "The system keeps following up until the lead books, replies, or clearly goes cold.", "14-day nurture sequence", ["Lead does not book right away", "Timed SMS/email follow-up sequence runs", "More warm leads return to the funnel"]],
  ["05", "Reactivation", RotateCcw, "Reactivate old leads into new revenue", "Older leads are re-opened with the right comeback messaging so stale contacts become fresh opportunities.", "Avg. $4k recovered/mo", ["Dormant leads sit untouched", "Reactivation campaign restarts the conversation", "Old contacts become new consults or quotes"]],
  ["06", "Booking Flow", CalendarCheck, "Route ready prospects into booking", "When someone is ready, the system removes friction and pushes them into a cleaner scheduling path.", "Zero manual scheduling", ["Prospect is ready to move", "System routes them into the booking flow", "Higher completion and fewer drop-offs"]],
  ["07", "Pipeline Control", LayoutDashboard, "Auto-manage the CRM and pipeline", "Statuses, handoffs, and visibility stay updated automatically so you know where each lead stands.", "Full visibility", ["Lead changes stage or replies", "Pipeline updates itself automatically", "Cleaner reporting and handoff visibility"]],
  ["08", "Ongoing Support", HeadphonesIcon, "Keep the system live, tuned, and improving", "This is not a static setup. We continue tuning the system so it stays aligned with your workflow.", "Priority support", ["Live system performance is reviewed", "Messaging and flow updates are applied", "The system improves instead of going stale"]],
];

function ParticleBurst({ trigger }) {
  return (
    <AnimatePresence>
      {trigger &&
        [...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const distance = 70;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x, y, scale: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ background: "linear-gradient(135deg,#a8c4e0,#6d9fc5)" }}
            />
          );
        })}
    </AnimatePresence>
  );
}

function StepModal({ activeStep, onClose, onBook }) {
  const step = useMemo(() => steps.find((s) => s[0] === activeStep), [activeStep]);
  if (!step) return null;
  const [stepNum, lane, StepIcon, title, desc, tag, diagram] = step;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-[2rem]"
          style={{
            background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f1f35 100%)",
            border: "1px solid rgba(100,160,220,0.2)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,160,220,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(100,180,255,0.5), transparent)" }} />

          <button onClick={onClose} className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }} aria-label="Close">
            <X className="h-4 w-4" />
          </button>

          <div className="grid gap-6 p-8 md:grid-cols-[1.2fr_0.9fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ background: "rgba(100,160,255,0.1)", border: "1px solid rgba(100,160,255,0.2)", color: "#93c5fd" }}>
                Step {stepNum} <span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> {lane}
              </div>
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))", border: "1px solid rgba(100,160,255,0.2)" }}>
                  <StepIcon className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold leading-tight text-white md:text-[1.9rem]">{title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-slate-400">{desc}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(100,160,255,0.25)", color: "#93c5fd" }}>
                <TrendingUp className="h-3.5 w-3.5" />
                {tag}
              </div>
            </div>

            <div className="rounded-[1.5rem] p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Step Breakdown</p>
              <div className="space-y-3">
                {diagram.map((item, index) => (
                  <div key={item} className="relative">
                    <div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-400/60 mb-1">{index === 0 ? "Input" : index === 1 ? "Automation" : "Outcome"}</p>
                      <p className="text-sm leading-6 text-slate-300">{item}</p>
                    </div>
                    {index < 2 && <div className="ml-5 mt-1.5 h-3 w-px" style={{ background: "linear-gradient(to bottom, rgba(100,160,255,0.35), transparent)" }} />}
                  </div>
                ))}
              </div>
              <button onClick={onBook} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}>
                Book Your Free Demo <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function EnhancedSystemSteps() {
  const [activeStep, setActiveStep] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [iconHovered, setIconHovered] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 280, damping: 32, mass: 0.8 },
    },
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-6" style={{ background: "linear-gradient(180deg, rgba(248,250,255,0.6) 0%, rgba(255,255,255,0.98) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: "#9a5c2e" }}>Each Automation Explained</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            Inside the 8-Step System
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Every automation runs on its own. Together they form a complete lead-to-booked pipeline — no manual effort required.
          </p>
        </div>
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {steps.map((step, index) => {
          const [stepNum, lane, StepIcon, title, desc, tag, diagram] = step;
          const isFeatured = index === 0;

          return (
            <motion.article
              key={stepNum}
              variants={cardVariants}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: isFeatured
                  ? "linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f1f35 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.98) 100%)",
                border: isFeatured
                  ? "1px solid rgba(100,160,255,0.3)"
                  : "1px solid rgba(200,210,230,0.6)",
                boxShadow: isFeatured
                  ? "0 20px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(100,160,255,0.1)"
                  : "0 4px 20px rgba(15,23,42,0.06)",
              }}
            >
              {/* Left accent bar — color shifts per step group */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-1"
                style={{
                  background: isFeatured
                    ? "linear-gradient(180deg, #60a5fa, #818cf8)"
                    : index % 3 === 1
                    ? "linear-gradient(180deg, #34d399, #059669)"
                    : index % 3 === 2
                    ? "linear-gradient(180deg, #f59e0b, #d97706)"
                    : "linear-gradient(180deg, #60a5fa, #818cf8)",
                }}
              />

              {/* Featured glow */}
              {isFeatured && (
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />
              )}

              {/* Featured badge */}
              {isFeatured && (
                <div className="absolute right-5 top-5 hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(100,160,255,0.3)", color: "#93c5fd" }}>
                  Start Here
                </div>
              )}

              <div className="relative grid gap-5 px-6 py-6 md:grid-cols-[1.4fr_1fr] md:px-8 md:py-7">
                {/* Left: Step info */}
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                      style={{
                        background: isFeatured ? "rgba(100,160,255,0.1)" : "rgba(15,23,42,0.05)",
                        border: isFeatured ? "1px solid rgba(100,160,255,0.2)" : "1px solid rgba(15,23,42,0.08)",
                        color: isFeatured ? "#93c5fd" : "rgba(15,23,42,0.45)",
                      }}
                    >
                      Step {stepNum} <span className="h-1 w-1 rounded-full" style={{ background: isFeatured ? "#60a5fa" : "rgba(15,23,42,0.25)" }} /> {lane}
                    </div>

                    <div className="flex items-start gap-3">
                      <motion.div
                        className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: isFeatured
                            ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.12))"
                            : "rgba(15,23,42,0.05)",
                          border: isFeatured ? "1px solid rgba(100,160,255,0.25)" : "1px solid rgba(15,23,42,0.08)",
                        }}
                        onHoverStart={() => setIconHovered(stepNum)}
                        onHoverEnd={() => setIconHovered(null)}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      >
                        <motion.div
                          animate={iconHovered === stepNum ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.6 }}
                        >
                          <StepIcon className={`h-5 w-5 ${isFeatured ? "text-blue-300" : "text-slate-600"}`} />
                        </motion.div>
                        <ParticleBurst trigger={iconHovered === stepNum} />
                      </motion.div>

                      <div>
                        <h3 className={`font-display text-xl font-semibold leading-tight md:text-2xl ${isFeatured ? "text-white" : "text-slate-900"}`}>
                          {title}
                        </h3>
                        <p className={`mt-2 text-sm leading-6 ${isFeatured ? "text-slate-400" : "text-slate-500"}`}>
                          {desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{
                        background: isFeatured ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.04)",
                        border: isFeatured ? "1px solid rgba(100,160,255,0.2)" : "1px solid rgba(15,23,42,0.07)",
                        color: isFeatured ? "#93c5fd" : "rgba(15,23,42,0.5)",
                      }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {tag}
                    </div>
                  </div>
                </div>

                {/* Right: Flow diagram (consolidated) */}
                <div className="rounded-xl p-4" style={{
                  background: isFeatured ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
                  border: isFeatured ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(15,23,42,0.07)",
                }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isFeatured ? "text-slate-500" : "text-slate-400"}`}>
                      How It Works
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveStep(stepNum)}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all hover:scale-105"
                      style={{
                        background: isFeatured ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.05)",
                        border: isFeatured ? "1px solid rgba(100,160,255,0.2)" : "1px solid rgba(15,23,42,0.08)",
                        color: isFeatured ? "#93c5fd" : "rgba(15,23,42,0.45)",
                      }}
                    >
                      Expand <ArrowRight className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {diagram.map((item, pointIndex) => (
                      <motion.div
                        key={item}
                        className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                        style={{
                          background: isFeatured ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                          border: isFeatured ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.07)",
                        }}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: pointIndex * 0.08, duration: 0.35, ease: "easeOut" }}
                        viewport={{ once: true, amount: 0.5 }}
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                          style={{
                            background: isFeatured ? "rgba(59,130,246,0.2)" : "rgba(15,23,42,0.07)",
                            color: isFeatured ? "#93c5fd" : "rgba(15,23,42,0.45)",
                          }}
                        >
                          {pointIndex + 1}
                        </div>
                        <p className={`text-xs leading-5 font-medium ${isFeatured ? "text-slate-300" : "text-slate-600"}`}>
                          {item}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {activeStep && (
        <StepModal
          activeStep={activeStep}
          onClose={() => setActiveStep(null)}
          onBook={() => { setActiveStep(null); setShowDemoModal(true); }}
        />
      )}
      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
    </div>
    </section>
  );
}