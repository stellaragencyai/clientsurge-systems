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
    <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/8 hover:shadow-lg transition-all duration-300 cursor-default">
      <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-5 group-hover:bg-primary/30 transition-colors duration-300">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-background mb-2">{reason.title}</h3>
      <p className="text-sm text-background/55 leading-relaxed">{reason.desc}</p>
    </div>
  );
};

export default function WhyUs() {
  return (
    <section className="py-24 md:py-32 px-6 bg-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-6">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why ClientSurge Systems</p>
          <p className="text-base font-semibold text-background/70 mb-4">
            If your leads are slipping through the cracks, this is why — and how we fix it.
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-background mb-5">
            You Don't Need Another Platform — You Need Something That Actually Works
          </h2>
          <p className="mt-4 text-lg text-background/70 max-w-2xl mx-auto leading-relaxed font-semibold">
            We don't give you tools to figure out. We build and run the system so it actually produces results.
          </p>
        </div>

        {/* Platform vs Partner contrast */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-14 max-w-2xl mx-auto">
          <div className="flex-1 p-5 rounded-2xl bg-destructive/10 border border-destructive/20">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive/80 mb-3">A Platform Gives You</p>
            {["You're left to figure it out", "Requires constant setup", "Takes time to learn", "Doesn't guarantee results"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-background/60 mb-1.5">
                <span className="text-destructive/60 text-base leading-none">✕</span> {t}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center text-xl font-bold text-primary/40 px-2 hidden sm:flex">→</div>
          <div className="flex-1 p-5 rounded-2xl bg-primary/10 border border-primary/25">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Our System Gives You</p>
            {["Fully built for you", "Runs automatically", "Designed to increase bookings", "Live in days"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-background/80 mb-1.5">
                <span className="text-primary text-base leading-none">✓</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Implementation timeline strip */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-background/70 mb-3">
            Live in 5–7 days — without disrupting your business
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["Day 1: Kickoff call", "Days 2–4: Build & integrate", "Day 5–7: Test & launch", "Day 30+: Optimize"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="px-4 py-1.5 bg-primary/15 border border-primary/30 rounded-full text-xs font-semibold text-primary">
                  {step}
                </span>
                {i < 3 && <span className="text-primary/30 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {reasons.map((r, i) => (
            <WhyUsCard key={i} reason={r} />
          ))}
        </div>

        {/* Risk reduction & CTA */}
        <div className="text-center max-w-2xl mx-auto border-t border-background/10 pt-10">
          <p className="text-sm text-background/60 mb-2">
            No complicated setup. No ongoing management required.
          </p>
          <p className="text-sm font-semibold text-background mb-6">
            You don't need to learn anything. It just works.
          </p>
          <p className="text-base font-semibold text-background/80">
            Want us to set this up for your business?
          </p>
        </div>

      </div>
    </section>
  );
}