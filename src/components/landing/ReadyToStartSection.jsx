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
      className="cs-contact-dark-panel flex h-full flex-col items-center justify-center px-8 py-12 text-center text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1a3a 0%, #050c1f 60%, #050c1f 100%)",
        color: "#ffffff",
        isolation: "isolate",
      }}
    >
      <style>{`
        .cs-contact-dark-panel,
        .cs-contact-dark-panel :where(p, h1, h2, h3, h4, h5, h6, a, strong, small, li) {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }

        .cs-contact-dark-panel__gradient {
          background-image: linear-gradient(90deg, #005bb5, #00a2ff) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: #00a2ff !important;
        }

        .cs-contact-dark-panel__pill {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>

      {/* Eyebrow */}
      <p
        className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white"
        style={{ color: "#ffffff", position: "relative", zIndex: 1 }}
      >
        Ready to Start?
      </p>

      {/* Headline */}
      <h2 className="mb-6 font-titles text-4xl font-black leading-[1.1] tracking-tight text-white md:text-[2.75rem]" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
        You're Already Getting Leads.
        <br />
        <span className="cs-contact-dark-panel__gradient">
          Let's Convert Every One.
        </span>
      </h2>

      {/* Sub-headline */}
      <p className="mb-6 max-w-md text-sm leading-relaxed text-white md:text-base" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
        Book a free 15-minute strategy call. We'll map exactly where your
        business is leaking bookings and show you what the system looks like
        for your specific situation.
      </p>

      {/* Emphasis */}
      <p className="mb-6 text-sm font-bold text-white md:text-base" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
        Most clients are live in 48 hours. No contracts. No fluff.
      </p>

      {/* Pills */}
      <div className="mb-8 flex flex-wrap justify-center gap-2.5" style={{ position: "relative", zIndex: 1 }}>
        {PILLS.map((pill) => (
          <span
            key={pill}
            className="cs-contact-dark-panel__pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold text-white"
            style={{ background: "#1a2035", borderColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}
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
      <p className="mt-6 text-[11px] text-white" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
        Free 15-minute call · no commitment required · live in 24–48 hours
      </p>
    </div>
  );
}
