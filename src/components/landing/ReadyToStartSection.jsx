import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PILLS = [
  "No contracts",
  "Live in 48 hrs",
  "Done-for-you",
  "30-day guarantee",
];

export default function ReadyToStartSection() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-8 py-12 text-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1a3a 0%, #050c1f 60%, #050c1f 100%)",
      }}
    >
      {/* Eyebrow */}
      <p
        className="mb-5 text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: "#00a2ff" }}
      >
        Ready to Start?
      </p>

      {/* Headline */}
      <h2 className="mb-6 font-titles text-4xl font-black leading-[1.1] tracking-tight text-white md:text-[2.75rem]">
        You're Already Getting Leads.
        <br />
        <span
          className="text-transparent"
          style={{
            backgroundImage: "linear-gradient(90deg, #005bb5, #00a2ff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          Let's Convert Every One.
        </span>
      </h2>

      {/* Sub-headline */}
      <p className="mb-6 max-w-md text-sm leading-relaxed text-slate-400 md:text-base">
        Book a free 15-minute strategy call. We'll map exactly where your
        business is leaking bookings and show you what the system looks like
        for your specific situation.
      </p>

      {/* Emphasis */}
      <p className="mb-6 text-sm font-bold text-white md:text-base">
        Most clients are live in 48 hours. No contracts. No fluff.
      </p>

      {/* Pills */}
      <div className="mb-8 flex flex-wrap justify-center gap-2.5">
        {PILLS.map((pill) => (
          <span
            key={pill}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70"
            style={{ background: "#1a2035" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "#00a2ff" }}
            />
            {pill}
          </span>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/start"
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(90deg, #005bb5, #00a2ff)",
            boxShadow: "0 4px 20px rgba(0, 92, 181, 0.4)",
          }}
        >
          Get Your Free Audit <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/book"
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white/5"
        >
          Free Lead Audit
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-[11px] text-slate-500">
        Free 15-minute call · no commitment required · live in 24–48 hours
      </p>
    </div>
  );
}