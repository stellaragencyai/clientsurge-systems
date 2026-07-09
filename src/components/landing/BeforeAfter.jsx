import { useState } from "react";
import { X, Check } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

const scenarios = [
  {
    label: "After-Hours Call",
    without: "Phone rings, no answer. Lead Googles your competitor and books with them instead.",
    withCS: "Missed call triggers an instant text: 'Hey! Thanks for calling. We're closed right now — can I help you book a time?' Lead replies. Appointment set.",
  },
  {
    label: "Website Form",
    without: "Email lands in inbox. You see it Monday morning. Lead has already moved on.",
    withCS: "Lead gets a prompt text and the follow-up plan stays active if they do not book.",
  },
  {
    label: "Cold Lead",
    without: "You followed up once. No reply. You move on and forget about them.",
    withCS: "System automatically sends scheduled follow-ups so dormant leads keep getting routed toward the next step.",
  },
  {
    label: "Busy Season",
    without: "Phones ringing, staff overwhelmed, leads falling through. You hire more front desk staff just to keep up.",
    withCS: "AI handles every new inquiry simultaneously. No missed calls, no delays, no extra hires. Scales automatically.",
  },
];

export default function BeforeAfter() {
  const [active, setActive] = useState(0);
  const demoBooking = useDemoBooking();

  return (
    <section id="problem-solution" className="py-20 md:py-28 px-6" style={{ background: "transparent" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: "#00AEEF" }}>
            The Difference
          </p>
          <h2 className="font-bold tracking-tight text-foreground" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontFamily: "Montserrat, sans-serif" }}>
            What Changes When You Install ClientSurge
          </h2>
          <p className="mt-4 text-muted-foreground text-base max-w-2xl mx-auto">
            Same leads. Same business. Completely different outcome.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {scenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className="px-4 py-2 min-h-[44px] rounded-full text-sm font-semibold transition-all duration-200 relative"
              style={{
                background: active === i
                  ? "linear-gradient(135deg, #0088CC 0%, #00AEEF 100%)"
                  : "rgba(0,174,239,0.08)",
                color: active === i ? "#ffffff" : "#0088CC",
                border: active === i ? "1px solid transparent" : "1px solid rgba(0,174,239,0.2)",
                boxShadow: active === i ? "0 4px 14px rgba(0,174,239,0.35)" : "none",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-7 border border-slate-200" style={{ background: "#f8fafc" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-bold text-sm text-slate-600 uppercase tracking-wider">Without ClientSurge</span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-base">{scenarios[active].without}</p>
          </div>

          <div className="rounded-2xl p-7 border border-sky-100" style={{ background: "#f3fbff" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100">
                <Check className="w-4 h-4 text-[#006BB0]" />
              </div>
              <span className="font-bold text-sm text-[#006BB0] uppercase tracking-wider">With ClientSurge</span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-base">{scenarios[active].withCS}</p>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => demoBooking?.openDemoBooking?.()}
            aria-label="See this system in action — start a free automation audit"
            className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #00AEEF 100%)",
              boxShadow: "0 4px 18px rgba(0,174,239,0.4)",
            }}
          >
            See This System in Action — Free Audit
          </button>
          <p className="mt-3 text-xs text-muted-foreground">15 minutes · no obligation · built for your industry</p>
        </div>
      </div>
    </section>
  );
}
