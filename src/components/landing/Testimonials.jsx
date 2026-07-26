import { useDemoBooking } from "./DemoBookingContext";
import StardustOverlay from "./StardustOverlay";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const scenarios = [
  {
    name: "Med spa lead flow",
    businessType: "Med Spa",
    location: "Scottsdale, AZ",
    before: "Online consult requests wait for manual follow-up",
    after: "New inquiries get an immediate response and booking path",
    result: "Target outcome: faster consult capture",
    quote: "Workflow preview: lead captured, SMS sent, conversion handoff started.",
    initials: "MS",
    color: "#00AEEF",
  },
  {
    name: "HVAC missed-call flow",
    businessType: "HVAC Contractor",
    location: "Phoenix, AZ",
    before: "Missed calls end without a callback or text thread",
    after: "Missed callers receive a prompt text-back and routing step",
    result: "Target outcome: fewer dropped calls",
    quote: "Workflow preview: missed call logged, reply captured, next step assigned.",
    initials: "HV",
    color: "#003B8F",
  },
  {
    name: "Dental follow-up flow",
    businessType: "Dental & Orthodontics",
    location: "Tempe, AZ",
    before: "Manual follow-up depends on front desk availability",
    after: "Follow-up sequence keeps qualified patients moving",
    result: "Target outcome: cleaner follow-up queue",
    quote: "Workflow preview: inquiry qualified, nurture started, conversion prompt sent.",
    initials: "DE",
    color: "#009DFF",
  },
];

export default function Testimonials() {
  const demoBooking = useDemoBooking();
  return (
    <section id="testimonials" className="nebula-testimonials py-16 md:py-24 px-6 relative overflow-hidden">
      <StardustOverlay seed={21} opacity={0.4} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-16">
          <CSSectionHeader
            eyebrow="Workflow Scenarios"
            title="What the Lead Experience Can Look Like"
            subtitle="Three example industry workflows. These are system previews and target outcomes, not verified customer testimonials or guaranteed results."
            as="h1"
          />
        </div>

        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 leading-relaxed">
          <strong>Proof label:</strong> The cards below are workflow scenarios. Verified customer quotes, revenue metrics, or live case studies should only appear here after they are backed by source evidence.
        </div>

        <div className="testimonial-grid grid md:grid-cols-3 gap-6">
          {scenarios.map((scenario, idx) => (
            <article
              key={scenario.name}
              className="flex flex-col rounded-2xl p-6 testimonial-card"
              style={{
                background: "rgba(240,249,255,0.95)",
                border: "1.5px solid rgba(0,174,239,0.22)",
                boxShadow: "0 4px 24px rgba(0,174,239,0.07)",
                animationDelay: `${idx * 120}ms`,
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex text-xs font-semibold text-primary/90 bg-primary/10 px-3 py-1 rounded-full">
                  {scenario.businessType}
                </span>
                <span className="text-xs text-muted-foreground">{scenario.location}</span>
              </div>

              <div className="mb-5 space-y-3 pb-5 border-b border-border/80">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                  <p className="text-sm text-foreground/70">{scenario.before}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{scenario.after}</p>
                </div>
              </div>

              <div className="mb-5 mt-5">
                <span className="inline-flex items-center text-sm font-bold text-white px-4 py-2 rounded-full bg-gradient-to-r from-[#0088CC] to-[#00AEEF]">
                  {scenario.result}
                </span>
              </div>

              <div className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary/80">Scenario note</p>
                &ldquo;{scenario.quote}&rdquo;
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 shadow-md text-white text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${scenario.color} 0%, ${scenario.color}cc 100%)` }}
                  aria-label={`${scenario.name} scenario`}
                >
                  {scenario.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground">{scenario.businessType}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div
          className="mx-auto mt-16 flex w-full max-w-2xl flex-col items-center border-t border-border pt-10 text-center"
          data-clientsurge-testimonials-cta-align="centered"
        >
          <p className="mb-4 text-center text-lg font-semibold text-foreground">
            Ready to plan this system for your business?
          </p>
          {demoBooking ? (
            <button type="button" onClick={demoBooking.openDemoBooking} className="cs-btn-primary mx-auto">
              Plan My System
            </button>
          ) : (
            <a href="/book" className="cs-btn-primary mx-auto">
              Plan My System
            </a>
          )}
        </div>
      </div>

      <style>{`
        .testimonial-card {
          animation: fadeInUp 0.6s ease-out both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
