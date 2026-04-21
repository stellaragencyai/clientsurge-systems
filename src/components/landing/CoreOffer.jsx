import { useState } from 'react';
import { ArrowRight, Zap, MessageSquare, PhoneCall, CalendarCheck, RotateCcw, LayoutDashboard, HeadphonesIcon, TrendingUp, CheckCircle2, Send, X } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";
import AutomationPipelineSection from "./AutomationPipelineSection";

const coreAutomation = [
  { icon: Zap, step: "01", title: "Instantly respond to every lead", desc: "Before your competitors do - personalized replies within seconds.", tag: "Avg. 2x more bookings" },
  { icon: MessageSquare, step: "02", title: "Turn inquiries into booked appointments", desc: "Guided booking flow that converts more leads into confirmed bookings.", tag: "Saves 3-5 hrs/week" },
  { icon: PhoneCall, step: "03", title: "Recover bookings from missed calls", desc: "Every missed call gets an immediate text-back - zero leads disappear.", tag: "0 leads lost" },
  { icon: Send, step: "04", title: "Automate follow-up so nothing slips through", desc: "Multi-step sequences keep leads warm and moving toward booking.", tag: "14-day nurture sequence" },
  { icon: RotateCcw, step: "05", title: "Reactivate old leads into new revenue", desc: "Turn dormant contacts into fresh opportunities with proven campaigns.", tag: "Avg. $4k recovered/mo" },
];

const doneForYou = [
  { icon: CalendarCheck, step: "06", title: "Booking Flow", desc: "Leads guided directly to your calendar. No phone tag, no friction.", tag: "Zero manual scheduling" },
  { icon: LayoutDashboard, step: "07", title: "CRM Pipeline Automation", desc: "Auto-tagging, status updates, and task creation - your pipeline runs itself.", tag: "Full visibility" },
  { icon: HeadphonesIcon, step: "08", title: "Ongoing Support", desc: "Continuous optimization and priority support from our team post-launch.", tag: "Priority access" },
];

const aspects = {
  "01": ["Responds instantly to all inquiries", "Personalized by lead details", "Works 24/7 - even at 2am"],
  "02": ["Guides prospects directly to booking", "Eliminates phone tag friction", "Confirmation sent automatically"],
  "03": ["SMS sent within 60 seconds of missed call", "Recovers leads before they dial a competitor", "Works while you're with other clients"],
  "04": ["Multi-step SMS & email sequences", "Smart timing based on lead behaviour", "14-day automated nurture window"],
  "05": ["Reactivates dormant leads", "Proven re-engagement sequences", "Turn old contacts into fresh revenue"],
  "06": ["Zero manual scheduling", "Frictionless booking experience", "Direct calendar integration"],
  "07": ["Auto-tagging & status updates", "Full visibility dashboard", "Task creation on autopilot"],
  "08": ["Priority support access", "Continuous post-launch optimization", "Monthly performance reviews"],
};

const blueprints = {
  "01": {
    trigger: "A new lead submits a form, ad inquiry, or direct message.",
    system: "The system sends a personalized first response in seconds based on lead source and context.",
    visibleToLead: "They hear from you immediately instead of waiting for a callback.",
    businessOutcome: "You win more conversations before competitors even respond.",
  },
  "02": {
    trigger: "A prospect asks questions or shows interest but has not booked yet.",
    system: "The automation answers, qualifies, and routes the conversation toward a booking decision.",
    visibleToLead: "The interaction feels guided, helpful, and responsive.",
    businessOutcome: "More warm inquiries turn into booked appointments.",
  },
  "03": {
    trigger: "A call comes in and your team misses it while busy or after hours.",
    system: "A text-back fires automatically and keeps the lead engaged while your team catches up.",
    visibleToLead: "They still get an immediate response instead of feeling ignored.",
    businessOutcome: "Missed calls stop turning into lost revenue.",
  },
  "04": {
    trigger: "A lead goes quiet after the first touchpoint or does not book right away.",
    system: "Timed SMS and email follow-up keeps the lead warm with the right spacing and next step.",
    visibleToLead: "They experience steady follow-up without feeling chased.",
    businessOutcome: "More leads come back and convert instead of dying silently.",
  },
  "05": {
    trigger: "Your CRM already contains older leads that never converted.",
    system: "Reactivation campaigns reopen dormant conversations with proven messaging.",
    visibleToLead: "They receive a relevant reconnect message rather than being forgotten forever.",
    businessOutcome: "Old contacts become fresh opportunities and recovered revenue.",
  },
  "06": {
    trigger: "A lead is qualified and ready to move into scheduling.",
    system: "The automation pushes them into a cleaner booking path with less back-and-forth.",
    visibleToLead: "Scheduling feels easy, direct, and frictionless.",
    businessOutcome: "More ready prospects actually complete the booking step.",
  },
  "07": {
    trigger: "A lead replies, changes stage, or requires internal follow-through.",
    system: "Statuses, tags, and pipeline actions update automatically behind the scenes.",
    visibleToLead: "They experience a coordinated business that seems on top of everything.",
    businessOutcome: "Your team gets cleaner visibility and fewer workflow gaps.",
  },
  "08": {
    trigger: "The system is live and handling real lead flow.",
    system: "We review results, tune messaging, and improve performance over time.",
    visibleToLead: "They keep experiencing a polished follow-up flow instead of a stale setup.",
    businessOutcome: "The automation gets stronger instead of degrading after launch.",
  },
};

function FeatureCard({ item, onSelect }) {
  const Icon = item.icon;
  const stepNum = parseInt(item.step);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative cursor-pointer group"
      onClick={() => onSelect(item.step)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: hovered ? "1px solid rgba(154,92,46,0.55)" : "1px solid rgba(154,92,46,0.2)",
          boxShadow: hovered ? "0 12px 36px rgba(154,92,46,0.2), 0 2px 8px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "all 0.25s ease",
        }}
      >
        {/* TOP */}
        <div className="px-6 pt-5 pb-4" style={{ background: "rgba(154,92,46,0.05)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(154,92,46,0.6)" }}>
              Step {stepNum < 10 ? `0${stepNum}` : stepNum}
            </span>
            <div className="flex items-center gap-2">
              {/* Click hint */}
              <span
                className="text-[9px] font-semibold uppercase tracking-wider transition-all duration-200"
                style={{
                  color: "rgba(154,92,46,0.5)",
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? "translateX(0)" : "translateX(4px)",
                }}
              >
                <span className="sm:hidden">Tap to expand</span>
                <span className="hidden sm:inline">Click to expand</span>
              </span>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: hovered ? "rgba(154,92,46,0.18)" : "rgba(154,92,46,0.1)",
                  border: "1px solid rgba(154,92,46,0.2)",
                  transform: hovered ? "scale(1.12)" : "scale(1)",
                }}
              >
                <Icon className="w-4 h-4" style={{ color: "#9a5c2e" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(154,92,46,0.15)" }} />

        {/* BOTTOM - dark gradient */}
        <div
          className="px-6 py-5 flex flex-col gap-2"
          style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
        >
          <h3 className="text-sm font-semibold leading-snug" style={{ color: "#f5e6d0" }}>{item.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(245,230,208,0.65)" }}>{item.desc}</p>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase w-fit mt-1"
            style={{
              background: "rgba(245,230,208,0.12)",
              color: "#f5d9a8",
              border: "1px solid rgba(245,230,208,0.2)",
            }}
          >
            {item.tag}
          </span>
        </div>
      </div>
    </div>
  );
}

function StepModal({ stepId, onClose, onBookDemo }) {
  const itemData = [...coreAutomation, ...doneForYou].find(i => i.step === stepId);
  if (!itemData) return null;
  const Icon = itemData.icon;
  const cardAspects = aspects[stepId] || [];
  const blueprint = blueprints[stepId];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: "coreModalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            border: "2px solid rgba(200,150,92,0.4)",
          }}
        >
          {/* Warm gradient header strip */}
          <div
            className="px-10 pt-8 pb-6"
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(245,230,208,0.55)" }}>
                  Step {itemData.step}
                </p>
                <h2 className="font-display text-xl font-bold leading-snug" style={{ color: "#f5e6d0" }}>
                  {itemData.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-10 py-8">
            <p className="text-foreground/70 mb-7 leading-relaxed">{itemData.desc}</p>

            <div className="grid gap-3 mb-8 md:grid-cols-2">
              {[
                { label: "Trigger", value: blueprint?.trigger },
                { label: "System Action", value: blueprint?.system },
                { label: "Lead Experiences", value: blueprint?.visibleToLead },
                { label: "Business Outcome", value: blueprint?.businessOutcome },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[rgba(154,92,46,0.15)] bg-[rgba(154,92,46,0.05)] px-4 py-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-2">{item.label}</p>
                  <p className="text-sm leading-6 text-foreground/80">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Key points */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">What This Includes</p>
            <div className="space-y-3 mb-8">
              {cardAspects.map((aspect, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{
                    background: "rgba(154,92,46,0.06)",
                    border: "1px solid rgba(154,92,46,0.15)",
                    animation: `slideInPoint 0.4s ease-out ${0.1 + idx * 0.1}s both`,
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#9a5c2e" }} />
                  <span className="text-sm font-semibold text-foreground">{aspect}</span>
                </div>
              ))}
            </div>

            {/* Tag pill */}
            <div className="mb-8 flex">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)", color: "#f5d9a8" }}
              >
                <TrendingUp className="w-3 h-3" />
                {itemData.tag}
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={() => { onClose(); onBookDemo(); }}
              style={{ display: "block", width: "100%", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(161,120,35,0.6)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"; }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem" }}>
                Book Your Free Demo
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>

          <style>{`
            @keyframes coreModalIn {
              from { transform: scale(0.85) translateY(16px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes slideInPoint {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

export default function CoreOffer() {
  const [selectedStep, setSelectedStep] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <section id="services" className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card via-white to-background">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-foreground">
            How the{" "}
            <span style={{ color: "#9a5c2e", textShadow: "0 0 28px rgba(154,92,46,0.35)" }}>8-System</span>
            {" "}Flow Works
          </h2>
          {/* Gold accent divider */}
          <div className="flex items-center justify-center gap-3 mt-5 mb-5">
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to right, transparent, rgba(154,92,46,0.5))" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a5c2e" }} />
            <div style={{ height: "1px", width: "48px", background: "linear-gradient(to left, transparent, rgba(154,92,46,0.5))" }} />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Every system works together - capturing leads, responding instantly, following up automatically, and booking appointments without you lifting a finger.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Click any system card to open its automation blueprint
          </div>
        </div>

        {/* ROI Callout + Step count pill */}
        <div className="mb-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/25 bg-primary/6">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground">Most clients recover their investment within the first 30 days - often sooner.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)", boxShadow: "0 2px 10px rgba(120,70,20,0.3)" }}>
            <span className="text-xs font-bold" style={{ color: "#f5d9a8" }}>8 systems included</span>
          </div>
        </div>

        {/* 8-Step Clickable Cards */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-5 text-center">Core Automation — Steps 1–5</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {coreAutomation.map((item) => (
              <FeatureCard key={item.step} item={item} onSelect={setSelectedStep} />
            ))}
          </div>
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-5 text-center">Done-For-You — Steps 6–8</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {doneForYou.map((item) => (
              <FeatureCard key={item.step} item={item} onSelect={setSelectedStep} />
            ))}
          </div>
        </div>

        <AutomationPipelineSection />

        {/* 3-step timeline */}
        <div className="mb-8 mt-12 rounded-2xl border border-primary/15 overflow-hidden">
          <div className="grid grid-cols-3 bg-primary/5">
            {[
              { num: "1", label: "Onboarding Call", sub: "One 15-min call with our team" },
              { num: "2", label: "We Build Everything", sub: "Full system built & tested for you" },
              { num: "3", label: "You Go Live", sub: "Automated & running in 7 days" },
            ].map((step, i) => (
              <div key={i} className={`px-5 py-5 text-center relative ${i < 2 ? "border-r border-primary/15" : ""}`}>
                {i < 2 && (
                  <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 rounded-full bg-white border border-primary/20 items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)", color: "#f5e6d0" }}
                >
                  {step.num}
                </div>
                <p className="text-xs font-bold text-foreground mb-1">{step.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{step.sub}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-5 text-center border-t border-primary/15" style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}>
            <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">The Complete System</p>
            <p className="text-lg font-bold text-amber-100">Installed For You. Running in 7 Days.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-border text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-1">
            The Complete System.{" "}
            <span style={{ color: "#9a5c2e" }}>Installed For You.</span>{" "}
            Running in 7 Days.
          </p>
          <p className="text-xs text-muted-foreground mb-3 mt-2">Click any card above to explore what each system does.</p>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See plans and pricing below
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {selectedStep && (
        <StepModal
          stepId={selectedStep}
          onClose={() => setSelectedStep(null)}
          onBookDemo={() => setShowBookingModal(true)}
        />
      )}
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </section>
  );
}
