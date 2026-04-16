import { useState, useEffect, useRef } from "react";
import { Wrench, Rocket, Fingerprint, EyeOff, Hammer, BadgeDollarSign, ArrowRight, CheckCircle2, X, TrendingUp } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

const reasons = [
  {
    icon: BadgeDollarSign,
    title: "Built to Book",
    desc: "Every element exists to convert leads into booked appointments. Zero bloat.",
  },
  {
    icon: Rocket,
    title: "Live in Days",
    desc: "Running within 5–7 business days. We handle the entire build.",
  },
  {
    icon: Fingerprint,
    title: "Custom to You",
    desc: "Mapped to your lead sources, workflow, and goals — no templates.",
  },
  {
    icon: EyeOff,
    title: "Invisible to Your Team",
    desc: "Works silently in the background. No training. It just runs.",
  },
  {
    icon: Hammer,
    title: "Zero Feature Bloat",
    desc: "Clean, focused automation that does exactly what it's supposed to.",
  },
  {
    icon: Wrench,
    title: "ROI or We Fix It",
    desc: "We design for clear returns. If results aren't there, we tell you.",
  },
];

const platformItems = [
  "You figure it out yourself",
  "Requires weeks of setup",
  "Depends on your team",
  "No guarantee of results",
];

const systemItems = [
  "Fully built and managed for you",
  "Live within 5–7 days",
  "Runs 24/7 automatically",
  "Designed to increase bookings",
];

const stats = [
  { value: "< 60s", label: "Lead Response Time" },
  { value: "5–7", label: "Days to Go Live" },
  { value: "2–5×", label: "More Bookings" },
  { value: "30 Day", label: "Money-Back Guarantee" },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function AnimatedStat({ value, label, delay }) {
  const [ref, visible] = useInView(0.2);
  return (
    <div
      ref={ref}
      className="text-center"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}
    >
      <div className="font-display text-3xl md:text-4xl font-bold mb-1" style={{ color: "#9a5c2e" }}>{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-foreground/50">{label}</div>
    </div>
  );
}

export default function WhyUs() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [sectionRef, sectionVisible] = useInView(0.1);

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-white to-background overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="max-w-4xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why ClientSurge Systems</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-5">
            Stop Paying for Tools. Start Getting Results.
          </h2>
          <p className="text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed">
            We don't hand you software to figure out. We build, install, and run the system — so you get more bookings without lifting a finger.
          </p>
        </div>

        {/* ── Platform vs Our System ── */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-0 items-stretch max-w-4xl mx-auto mb-14">
          {/* Left — Platform */}
          <div className="rounded-2xl p-7 flex flex-col gap-4" style={{ background: "rgba(180,40,40,0.04)", border: "1.5px solid rgba(180,40,40,0.18)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <p className="text-xs font-black uppercase tracking-widest text-red-500/80">Any Other Platform</p>
            </div>
            {platformItems.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(180,40,40,0.1)" }}>
                  <X className="w-2.5 h-2.5 text-red-500" strokeWidth={3} />
                </div>
                <span className="text-sm text-foreground/65 leading-snug">{t}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center px-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md flex-shrink-0" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)", border: "2px solid white" }}>
              <ArrowRight className="w-4 h-4 text-amber-100" />
            </div>
          </div>

          {/* Right — Our System */}
          <div className="rounded-2xl p-7 flex flex-col gap-4" style={{ background: "rgba(154,92,46,0.06)", border: "1.5px solid rgba(154,92,46,0.28)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#9a5c2e" }} />
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#9a5c2e" }}>ClientSurge Systems</p>
            </div>
            {systemItems.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "rgba(154,92,46,0.14)" }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#9a5c2e" }} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-foreground/80 leading-snug">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Animated Stats Bar ── */}
        <div className="rounded-2xl mb-14 py-8 px-6 grid grid-cols-2 md:grid-cols-4 gap-8" style={{ background: "rgba(154,92,46,0.06)", border: "1px solid rgba(154,92,46,0.2)" }}>
          {stats.map((s, i) => <AnimatedStat key={i} value={s.value} label={s.label} delay={i * 100} />)}
        </div>

        {/* ── 6 Reason Cards (50% smaller) ── */}
        <div ref={sectionRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {reasons.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="group flex flex-col gap-3 p-5 rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1"
                style={{
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(154,92,46,0.12)",
                  opacity: sectionVisible ? 1 : 0,
                  transform: sectionVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms, box-shadow 0.3s ease, border-color 0.3s ease`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.4)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(154,92,46,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(154,92,46,0.12)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: "rgba(154,92,46,0.1)", border: "1.5px solid rgba(154,92,46,0.25)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#9a5c2e" }} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{r.title}</h3>
                  <p className="text-xs text-foreground/60 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Timeline Strip ── */}
        <div className="rounded-2xl overflow-hidden mb-12" style={{ border: "1px solid rgba(154,92,46,0.18)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {["Day 1: Kickoff Call", "Days 2–4: Build & Integrate", "Days 5–7: Test & Launch", "Day 30+: Ongoing Optimization"].map((step, i) => (
              <div key={i} className={`px-5 py-5 text-center relative ${i < 3 ? "border-r border-primary/10" : ""}`} style={{ background: "rgba(154,92,46,0.04)" }}>
                {i < 3 && (
                  <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 rounded-full bg-white border border-primary/20 items-center justify-center">
                    <ArrowRight className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-black" style={{ background: "linear-gradient(135deg,#9a5c2e,#7a4825)", color: "#f5e6d0" }}>{i + 1}</div>
                <p className="text-xs font-semibold text-foreground/80 leading-snug">{step}</p>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 text-center" style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#7a4825 100%)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200/60 mb-0.5">After That</p>
            <p className="text-sm font-bold text-amber-100">Everything Runs on Autopilot</p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground/70 mb-5">Ready to replace guesswork with a system that actually produces results?</p>
          <button
            onClick={() => setShowDemoModal(true)}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer", transition: "box-shadow 0.4s ease" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 32px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Book a Free 15-Min Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
      </div>
    </section>
  );
}