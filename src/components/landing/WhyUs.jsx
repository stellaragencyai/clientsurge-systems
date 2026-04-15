import { useState } from "react";
import { Wrench, Rocket, Fingerprint, EyeOff, Hammer, BadgeDollarSign } from "lucide-react";

const reasons = [
  {
    icon: BadgeDollarSign,
    title: "Every part of the system is built to increase bookings",
    desc: "No feature bloat. No distractions. Every element exists to convert more leads into booked appointments.",
  },
  {
    icon: Rocket,
    title: "Set up in days, not months",
    desc: "Live within 5–7 business days. We handle the entire build — you don't need to be technical.",
  },
  {
    icon: Fingerprint,
    title: "Custom-built for how your business actually works",
    desc: "We map your lead sources, workflow, and goals — then build exactly what you need. No templates.",
  },
  {
    icon: EyeOff,
    title: "No disruption to your team",
    desc: "Works silently in the background. Your staff doesn't learn anything new. It just runs.",
  },
  {
    icon: Hammer,
    title: "No unnecessary features — only what drives results",
    desc: "Clean, focused automation that does exactly what it's supposed to do — and nothing more.",
  },
  {
    icon: Wrench,
    title: "Built to generate more revenue than it costs",
    desc: "We design systems with clear ROI. If the results aren't there, we'll tell you upfront.",
  },
];

const WhyUsCard = ({ reason }) => {
  const Icon = reason.icon;
  return (
    <div className="group p-8 md:p-10 rounded-2xl bg-white border-2 border-black hover:shadow-lg transition-all duration-300 cursor-default" style={{boxShadow: "0 4px 16px rgba(0,0,0,0.06)"}}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300" style={{backgroundColor: "rgba(154,92,46,0.12)", border: "2px solid rgba(154,92,46,0.3)"}}>
        <Icon className="w-6 h-6" style={{color: "#9a5c2e"}} strokeWidth={1.75} />
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">{reason.title}</h3>
      <p className="text-base text-foreground/70 leading-relaxed">{reason.desc}</p>
    </div>
  );
};

export default function WhyUs() {
  return (
    <section className="py-28 md:py-40 px-6 bg-gradient-to-b from-white to-background">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why ClientSurge Systems</p>
          <p className="text-base font-semibold text-foreground/70 mb-5">
            If your leads are slipping through the cracks, this is why — and how we fix it.
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
            You Don't Need Another Platform — You Need Something That Actually Works
          </h2>
          <p className="mt-6 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed font-semibold">
            We don't give you tools to figure out. We build and run the system so it actually produces results.
          </p>
        </div>

        {/* Platform vs Partner contrast */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-6 mb-16 max-w-3xl mx-auto">
          <div className="flex-1 p-8 rounded-2xl bg-destructive/8 border-2 border-destructive/30">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive/80 mb-4">A Platform Gives You</p>
            {["You're left to figure it out", "Requires constant setup", "Takes time to learn", "Doesn't guarantee results"].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-base text-foreground/70 mb-2.5">
                <span className="text-destructive/70 text-lg leading-none">✕</span> {t}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center text-2xl font-bold px-4 hidden sm:flex" style={{color: "rgba(154,92,46,0.5)"}}>→</div>
          <div className="flex-1 p-8 rounded-2xl border-2" style={{backgroundColor: "rgba(154,92,46,0.08)", borderColor: "rgba(154,92,46,0.3)"}}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color: "#9a5c2e"}}>Our System Gives You</p>
            {["Fully built for you", "Runs automatically", "Designed to increase bookings", "Live in days"].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-base text-foreground/80 mb-2.5">
                <span className="text-lg leading-none" style={{color: "#9a5c2e"}}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Implementation timeline strip */}
        <div className="text-center mb-16">
          <p className="text-lg font-semibold text-foreground/80 mb-6">
            Live in 5–7 days — without disrupting your business
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {["Day 1: Kickoff call", "Days 2–4: Build & integrate", "Day 5–7: Test & launch", "Day 30+: Optimize"].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="px-6 py-2.5 border-2 border-black rounded-full text-sm font-semibold text-foreground" style={{backgroundColor: "rgba(154,92,46,0.1)", borderColor: "#000000"}}>
                  {step}
                </span>
                {i < 3 && <span className="text-foreground/40 text-base">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14">
          {reasons.map((r, i) => (
            <WhyUsCard key={i} reason={r} />
          ))}
        </div>

        {/* Risk reduction & CTA */}
        <div className="text-center max-w-2xl mx-auto border-t border-border pt-12">
          <p className="text-base text-foreground/70 mb-3">
            No complicated setup. No ongoing management required.
          </p>
          <p className="text-lg font-semibold text-foreground mb-8">
            You don't need to learn anything. It just works.
          </p>
          <p className="text-lg font-semibold text-foreground">
            Want us to set this up for your business?
          </p>
        </div>

      </div>
    </section>
  );
}