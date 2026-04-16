import { useState } from 'react';
import { ArrowRight, Zap, MessageSquare, PhoneCall, CalendarCheck, RotateCcw, LayoutDashboard, HeadphonesIcon, TrendingUp, CheckCircle2 } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";
import { useRef } from 'react';

const coreAutomation = [
  { icon: Zap, step: "01", title: "Instantly respond to every lead", desc: "Before your competitors do — personalized replies within seconds.", tag: "Avg. 2× more bookings" },
  { icon: MessageSquare, step: "02", title: "Turn inquiries into booked appointments", desc: "Guided booking flow that converts more leads into confirmed bookings.", tag: "Saves 3–5 hrs/week" },
  { icon: PhoneCall, step: "03", title: "Recover bookings from missed calls", desc: "Every missed call gets an immediate text-back — zero leads disappear.", tag: "0 leads lost" },
  { icon: ArrowRight, step: "04", title: "Automate follow-up so nothing slips through", desc: "Multi-step sequences keep leads warm and moving toward booking.", tag: "14-day nurture sequence" },
  { icon: RotateCcw, step: "05", title: "Reactivate old leads into new revenue", desc: "Turn dormant contacts into fresh opportunities with proven campaigns.", tag: "Avg. $4k recovered/mo" },
];

const doneForYou = [
  { icon: CalendarCheck, step: "06", title: "Booking Flow", desc: "Leads guided directly to your calendar. No phone tag, no friction.", tag: "Zero manual scheduling" },
  { icon: LayoutDashboard, step: "07", title: "CRM Pipeline Automation", desc: "Auto-tagging, status updates, and task creation — your pipeline runs itself.", tag: "Full visibility" },
  { icon: HeadphonesIcon, step: "08", title: "Ongoing Support", desc: "Continuous optimization and priority support from our team post-launch.", tag: "Priority access" },
];

function FeatureCard({ item, onSelect, isSelected }) {
  const Icon = item.icon;
  const stepNum = parseInt(item.step);

  return (
    <div
      className="relative cursor-pointer group"
      onClick={() => onSelect(item.step)}
    >
      <div
        className="flex flex-col rounded-2xl border transition-all duration-400 min-h-[160px] relative overflow-hidden"
        style={{
          borderColor: "rgba(0,0,0,0.08)",
          backgroundColor: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 12px 36px rgba(154,92,46,0.12), 0 2px 8px rgba(0,0,0,0.06)";
          e.currentTarget.style.borderColor = "rgba(154,92,46,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
        }}
      >
        {/* Warm top accent line */}
        <div className="h-[2px] w-full rounded-t-2xl" style={{ background: "linear-gradient(90deg, #c8965c 0%, rgba(200,150,92,0.2) 100%)" }} />

        <div className="p-6">
          {/* Step + Icon row */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(154,92,46,0.55)" }}
            >
              Step {stepNum < 10 ? `0${stepNum}` : stepNum}
            </span>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.12)" }}
            >
              <Icon className="w-4 h-4" style={{ color: "#9a5c2e" }} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-foreground mb-1.5 leading-snug">{item.title}</h3>

          {/* Desc */}
          <p className="text-xs text-foreground/55 leading-relaxed mb-4">{item.desc}</p>

          {/* Tag */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase"
            style={{
              background: "rgba(154,92,46,0.06)",
              color: "#9a5c2e",
              border: "1px solid rgba(154,92,46,0.15)",
              letterSpacing: "0.05em",
            }}
          >
            {item.tag}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CoreOffer() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-card via-white to-background">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            The Complete System. Installed For You. Running in 7 Days.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            We build, install, and run the system — so you get more bookings without doing the work.
          </p>
        </div>

        {/* ROI Callout */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/25 bg-primary/6">
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground">Most clients recover their investment within the first 30 days — often sooner.</p>
          </div>
        </div>

        {/* Backdrop blur when card is selected */}
        {selectedStep && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedStep(null)}
          />
        )}

        {/* Selected card modal */}
        {selectedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStep(null)}>
            <div
              className="bg-white rounded-3xl p-12 max-w-2xl w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: "expandAndCenter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                border: "2px solid #000000",
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedStep(null)}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="flex items-start gap-6">
                {(() => {
                  const itemData = [...coreAutomation, ...doneForYou].find(i => i.step === selectedStep);
                  const Icon = itemData?.icon;
                  const aspects = {
                    "01": ["Responds instantly to all inquiries", "Personalized by lead details"],
                    "02": ["Guides prospects directly to booking", "Eliminates phone tag friction"],
                    "03": ["SMS + email touchpoints", "Timed for optimal engagement"],
                    "04": ["Smart booking flow", "Direct calendar integration"],
                    "05": ["Reactivates dormant leads", "Proven re-engagement sequences"],
                    "06": ["Zero manual scheduling", "Frictionless experience"],
                    "07": ["Auto-tagging & status updates", "Full visibility dashboard"],
                    "08": ["Priority support access", "Continuous optimization"],
                  };
                  const cardAspects = aspects[selectedStep] || [];

                  return (
                    <>
                      <div className="flex-shrink-0">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: "rgba(200,150,92,0.15)",
                            border: "2px solid #c8965c",
                            boxShadow: "0 0 24px rgba(200,150,92,0.2)",
                          }}
                        >
                          {Icon && <Icon className="w-8 h-8" style={{ color: "#c8965c" }} />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-4xl font-black" style={{ color: "#c8965c", fontFamily: "var(--font-display)" }}>
                            {itemData?.step}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">{itemData?.title}</h2>
                        <p className="text-foreground/70 mb-6 leading-relaxed">{itemData?.desc}</p>

                        {/* Golden arrow animation */}
                        <div className="mb-6 relative h-8">
                          <svg
                            className="absolute left-0 top-0"
                            width="40"
                            height="32"
                            viewBox="0 0 40 32"
                            style={{
                              animation: "arrowSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                              opacity: 0,
                            }}
                          >
                            <defs>
                              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#c8965c", stopOpacity: 0 }} />
                                <stop offset="100%" style={{ stopColor: "#c8965c", stopOpacity: 1 }} />
                              </linearGradient>
                            </defs>
                            <line x1="0" y1="16" x2="35" y2="16" stroke="url(#arrowGradient)" strokeWidth="3" strokeLinecap="round" />
                            <polygon points="40,16 30,10 30,22" fill="#c8965c" />
                          </svg>
                        </div>

                        {/* Key points */}
                        <div className="space-y-3">
                          {cardAspects.map((aspect, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 rounded-lg"
                              style={{
                                backgroundColor: "rgba(200,150,92,0.08)",
                                animation: `slideInPoint 0.5s ease-out ${0.3 + idx * 0.15}s forwards`,
                                opacity: 0,
                                border: "1px solid rgba(200,150,92,0.2)",
                              }}
                            >
                              <span className="text-lg font-black mt-0.5 flex-shrink-0" style={{ color: "#c8965c" }}>
                                →
                              </span>
                              <span className="text-sm font-semibold text-foreground">{aspect}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <style>{`
                @keyframes expandAndCenter {
                  from {
                    transform: scale(0.8) translateY(20px);
                    opacity: 0;
                  }
                  to {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                  }
                }
                @keyframes arrowSlide {
                  from {
                    opacity: 0;
                    transform: translateX(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
                @keyframes slideInPoint {
                  from {
                    opacity: 0;
                    transform: translateX(-12px);
                  }
                  to {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* TIER 1 — Core Automation */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-full">Core Automation</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent pointer-events-none" />
          {coreAutomation.map((item, i) => (
            <FeatureCard key={i} item={item} onSelect={setSelectedStep} isSelected={selectedStep === item.step} />
          ))}
        </div>

        {/* TIER 2 — Done-For-You Support */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest px-3 py-1.5 bg-primary/8 border border-primary/20 rounded-full">Done-For-You Support</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {doneForYou.map((item, i) => (
            <FeatureCard key={i} item={item} onSelect={setSelectedStep} isSelected={selectedStep === item.step} />
          ))}
        </div>

        {/* Upgraded 3-step timeline */}
        <div className="mb-8 rounded-2xl border border-primary/15 overflow-hidden">
          <div className="grid grid-cols-3 bg-primary/5">
            {[
              { num: "1", label: "Onboarding Call", sub: "One 30-min call with our team" },
              { num: "2", label: "We Build Everything", sub: "Full system built & tested for you" },
              { num: "3", label: "You Go Live", sub: "Automated & running in 7 days" },
            ].map((step, i) => (
              <div key={i} className={`px-5 py-5 text-center relative ${i < 2 ? "border-r border-primary/15" : ""}`}>
                {/* Arrow between steps */}
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
          {/* Payoff row */}
          <div className="px-6 py-5 text-center border-t border-primary/15" style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}>
            <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Everything Else</p>
            <p className="text-lg font-bold text-amber-100">Automated Entirely</p>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-foreground text-sm font-semibold mb-6">
            If you're getting leads but not converting them, this is the fix.
          </p>
          <button onClick={() => setShowDemoModal(true)} style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer", transition: "box-shadow 0.5s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"; }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "52px", padding: "0 36px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Book a 10-Min Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
      </div>
    </section>
  );
}