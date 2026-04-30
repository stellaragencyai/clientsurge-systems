import { useMemo, useState } from "react";
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

// Particle burst component for hover effect
function ParticleBurst({ trigger }) {
  return (
    <AnimatePresence>
      {trigger &&
        [...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const distance = 80;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x, y, scale: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ background: "linear-gradient(135deg,#f0cf9b,#b77b47)" }}
            />
          );
        })}
    </AnimatePresence>
  );
}

// SVG connector with animated path
function FlowConnector() {
  return (
    <svg
      className="absolute left-1/2 w-full max-w-xs -translate-x-1/2"
      style={{ height: "60px", top: "-30px", pointerEvents: "none" }}
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M 100 0 Q 100 30 100 60"
        stroke="url(#gradient)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.5 }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(240,207,155,0.6)" />
          <stop offset="100%" stopColor="rgba(183,123,71,0.2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StepModal({ activeStep, onClose, onBook }) {
  const step = useMemo(() => steps.find((s) => s[0] === activeStep), [activeStep]);
  if (!step) return null;
  const stepNum = step[0];
  const lane = step[1];
  const StepIcon = step[2];
  const title = step[3];
  const desc = step[4];
  const tag = step[5];
  const diagram = step[6];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#d3b08b]/55 bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(255,247,236,0.96))] shadow-[0_40px_100px_rgba(15,23,42,0.2)]" onClick={(event) => event.stopPropagation()}>
          <button onClick={onClose} className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/90 text-slate-600 shadow-sm transition-colors hover:bg-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <div className="grid gap-6 px-7 pb-7 pt-8 md:grid-cols-[1.15fr_0.9fr] md:px-10 md:pb-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c8965c]/25 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a684a] shadow-sm">
                Step {stepNum}
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8965c]" />
                {lane}
              </div>
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#c8965c]/25 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(248,235,214,0.95))]">
                  <StepIcon className="h-7 w-7 text-[#8a5a32]" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-semibold leading-tight text-slate-900 md:text-[2.15rem]">{title}</h3>
                  <p className="mt-3 text-base leading-7 text-slate-600">{desc}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#6b3f1f,#9a5c2e)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-100 shadow-[0_10px_26px_rgba(122,72,37,0.22)]">
                <TrendingUp className="h-3.5 w-3.5" />
                {tag}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#d6c2ab] bg-[linear-gradient(180deg,rgba(109,67,33,0.98),rgba(139,91,52,0.98))] p-6 text-amber-50 shadow-[0_24px_50px_rgba(107,63,31,0.22)]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Expanded Step Diagram</p>
              <div className="space-y-4">
                {diagram.map((item, index) => (
                  <div key={item} className="relative">
                    <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 backdrop-blur">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">{index === 0 ? "Input" : index === 1 ? "Automation" : "Outcome"}</p>
                      <p className="mt-2 text-sm leading-6 text-amber-50">{item}</p>
                    </div>
                    {index < 2 && <div className="ml-6 mt-2 flex items-center gap-2 text-amber-200/70"><div className="h-8 w-px bg-gradient-to-b from-amber-200/50 to-transparent" /><ArrowRight className="h-4 w-4 rotate-90" /></div>}
                  </div>
                ))}
              </div>
              <button onClick={onBook} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#f0d4a5_0%,#e4b875_50%,#c8965c_100%)] px-5 py-3 text-sm font-semibold text-[#5d371d] shadow-[0_14px_30px_rgba(240,212,165,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(240,212,165,0.24)]">
                Book Your Free Demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
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
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, rotateX: -15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 30,
        mass: 0.8,
      },
    },
  };

  return (
    <>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {steps.map((step, index) => {
          const stepNum = step[0];
          const lane = step[1];
          const StepIcon = step[2];
          const title = step[3];
          const desc = step[4];
          const tag = step[5];
          const diagram = step[6];
          return (
            <motion.article key={stepNum} variants={cardVariants} className="group relative overflow-hidden rounded-[2rem] border border-[#b98b61]/40 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#9a6c45]/70 hover:shadow-[0_36px_90px_rgba(15,23,42,0.12)]" style={{ background: "linear-gradient(180deg,#7a4825 0%,#9a5c2e 18%,#ffffff 38%,#fffaf5 100%)", perspective: "1200px" }}>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#f0cf9b_0%,#b77b47_55%,#7a4f2e_100%)]" />
              <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[#f7dfb8]/45 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(201,156,110,0.08),transparent_40%)] opacity-80" />

              <div className="relative grid gap-6 px-7 py-7 md:grid-cols-[1.1fr_1.2fr_0.9fr] md:px-9 md:py-9">
                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-sm backdrop-blur">
                      Step {stepNum}
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                      {lane}
                    </div>
                    <div className="mb-4 flex items-start gap-4">
                      <motion.div
                           className="relative mt-1 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/30 bg-white/20 backdrop-blur"
                           onHoverStart={() => setIconHovered(stepNum)}
                           onHoverEnd={() => setIconHovered(null)}
                           whileHover={{
                             scale: 1.12,
                             boxShadow: "0 0 20px rgba(240,207,155,0.4)",
                           }}
                           transition={{ type: "spring", stiffness: 300, damping: 20 }}
                         >
                           <motion.div
                             animate={iconHovered === stepNum ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                             transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
                           >
                             <StepIcon className="h-6 w-6 text-amber-100" />
                           </motion.div>
                           <ParticleBurst trigger={iconHovered === stepNum} />
                         </motion.div>
                      <div>
                        <h3 className="font-display text-2xl font-semibold leading-tight text-white md:text-[1.95rem]">{title}</h3>
                        <p className="mt-3 max-w-xl text-[15px] leading-7 text-amber-100/80">{desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/20 border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {tag}
                  </div>
                </div>

                <div className="relative rounded-[1.75rem] border border-white/70 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur">
                   <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a684a]">What This Step Does</p>
                   <div className="space-y-3">
                     {diagram.map((item, pointIndex) => (
                       <motion.div
                         key={item}
                         className="relative flex items-start gap-3 rounded-2xl border border-[#e6d6c0] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,250,243,0.92))] px-4 py-3 shadow-sm"
                         initial={{ opacity: 0, x: -10 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         transition={{ delay: (pointIndex * 0.1), duration: 0.4, ease: "easeOut" }}
                         viewport={{ once: true, amount: 0.5 }}
                       >
                         {pointIndex < diagram.length - 1 && <FlowConnector />}
                         <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#f5e0c2] text-[#8a5a32]">
                           <CheckCircle2 className="h-3.5 w-3.5" />
                         </div>
                         <p className="text-sm font-medium leading-6 text-slate-700">{item}</p>
                       </motion.div>
                     ))}
                   </div>
                 </div>

                <div className="rounded-[1.75rem] border border-[#d6c2ab] bg-[linear-gradient(180deg,rgba(109,67,33,0.98),rgba(139,91,52,0.98))] p-5 text-amber-50 shadow-[0_24px_50px_rgba(107,63,31,0.22)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Mini Flow Diagram</p>
                    <button type="button" onClick={() => setActiveStep(stepNum)} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100 transition-colors hover:bg-white/15">
                      Expand
                    </button>
                  </div>
                  <div className="space-y-3">
                    {diagram.map((item, itemIndex) => (
                      <div key={item} className="relative">
                        <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 backdrop-blur">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">{itemIndex === 0 ? "Input" : itemIndex === 1 ? "Automation" : "Outcome"}</p>
                          <p className="mt-1 text-sm leading-6 text-amber-50">{item}</p>
                        </div>
                        {itemIndex < 2 && <div className="ml-5 mt-2 flex items-center gap-2 text-amber-200/70"><div className="h-6 w-px bg-gradient-to-b from-amber-200/50 to-transparent" /><ArrowRight className="h-3.5 w-3.5 rotate-90" /></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              </motion.article>
              );
              })}
              </motion.div>

      {activeStep && <StepModal activeStep={activeStep} onClose={() => setActiveStep(null)} onBook={() => { setActiveStep(null); setShowDemoModal(true); }} />}
      {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}

      <style>{`
        @keyframes slidePointIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}