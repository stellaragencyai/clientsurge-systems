import { useState } from "react";
import { Wrench, Rocket, Fingerprint, EyeOff, Hammer, BadgeDollarSign } from "lucide-react";

const reasons = [
  {
    icon: BadgeDollarSign,
    title: "We Focus on Revenue, Not Features",
    desc: "We don't sell software. We build systems designed to fill your calendar and increase what you earn. Every component has one job: drive bookings.",
  },
  {
    icon: Rocket,
    title: "Implemented in Days, Not Months",
    desc: "Most clients are live within 5–7 business days. We handle every detail of the setup — you don't need to be technical or carve out weeks of your schedule.",
  },
  {
    icon: Fingerprint,
    title: "Custom-Built for Your Business",
    desc: "There's no template. We map your lead sources, your workflow, and your goals — then build a system that fits how your business actually operates.",
  },
  {
    icon: EyeOff,
    title: "Zero Disruption to Your Team",
    desc: "Our systems work in the background. Your staff doesn't need to learn new tools or change how they work. It just runs.",
  },
  {
    icon: Hammer,
    title: "We Only Build What Works",
    desc: "No bloated platforms. No feature overload. Clean, reliable automation that does exactly what it's supposed to — and nothing more.",
  },
  {
    icon: Wrench,
    title: "You Keep Every Dollar It Generates",
    desc: "Our systems are built to return far more than they cost. If the ROI isn't clear, we'll tell you that before you sign anything.",
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
        <div className="max-w-2xl mx-auto text-center mb-6">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Why ApexFlow</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-background">
            We're Not a Platform.<br />We're Your Implementation Partner.
          </h2>
          <p className="mt-5 text-base text-background/60 max-w-xl mx-auto leading-relaxed">
            Platforms give you tools and leave you to figure it out. We show up, build the system end-to-end, and make sure it works — so you never have to touch it.
          </p>
        </div>

        {/* Platform vs Partner contrast */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-14 max-w-2xl mx-auto">
          <div className="flex-1 p-5 rounded-2xl bg-destructive/10 border border-destructive/20">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive/80 mb-3">A Platform Gives You</p>
            {["A login and a dashboard", "Hours of setup videos", "Ongoing technical work", "You figure out what works"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-background/60 mb-1.5">
                <span className="text-destructive/60 text-base leading-none">✕</span> {t}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center text-xl font-bold text-primary/40 px-2 hidden sm:flex">→</div>
          <div className="flex-1 p-5 rounded-2xl bg-primary/10 border border-primary/25">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">ApexFlow Gives You</p>
            {["A fully built system", "One onboarding call", "We handle everything", "Live in 5–7 days"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-background/80 mb-1.5">
                <span className="text-primary text-base leading-none">✓</span> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Implementation timeline strip */}
        <div className="flex items-center justify-center gap-2 mb-14 flex-wrap">
          {["Day 1: Kickoff call", "Days 2–4: Build & integrate", "Day 5–7: Test & launch", "Day 30+: Optimize"].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="px-4 py-1.5 bg-primary/15 border border-primary/30 rounded-full text-xs font-semibold text-primary">
                {step}
              </span>
              {i < 3 && <span className="text-primary/30 text-xs">→</span>}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <WhyUsCard key={i} reason={r} />
          ))}
        </div>

      </div>
    </section>
  );
}