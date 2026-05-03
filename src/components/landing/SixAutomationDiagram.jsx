const AUTOMATIONS = [
  {
    number: "01",
    title: "Instant Lead Response",
    summary: "New leads get an immediate first touch by SMS or email so speed is no longer manual.",
  },
  {
    number: "02",
    title: "Missed Call Text-Back",
    summary: "If a call is missed, the system texts back automatically and recovers the conversation.",
  },
  {
    number: "03",
    title: "14-Day Nurture Sequence",
    summary: "Warm leads stay in motion with scheduled follow-up instead of quietly going cold.",
  },
  {
    number: "04",
    title: "AI Booking Agent",
    summary: "Ready leads get moved toward booking with less back-and-forth and a clearer next step.",
  },
  {
    number: "05",
    title: "Lead Reactivation",
    summary: "Older leads can be re-engaged so past ad spend still has a chance to produce revenue.",
  },
  {
    number: "06",
    title: "Review Request Automation",
    summary: "Completed customer experiences turn into review requests that help build trust publicly.",
  },
];

export default function SixAutomationDiagram() {
  return (
    <section className="px-4 md:px-6" aria-labelledby="six-automation-diagram-heading">
      <div className="max-w-6xl mx-auto rounded-[32px] border border-[rgba(154,92,46,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,246,240,0.92))] shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="px-6 md:px-10 pt-8 md:pt-12 pb-6 border-b border-[rgba(154,92,46,0.1)]">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-primary mb-4">System Truth</p>
          <h2 id="six-automation-diagram-heading" className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            The company runs on <span className="text-primary">6 real automations</span>, not vague marketing steps.
          </h2>
          <p className="mt-4 max-w-3xl text-sm md:text-lg text-foreground/75 leading-relaxed">
            This is the actual operating model underneath the storefront, install queue, and admin workspace. Twilio and Resend act as the communication rails, while the install flow turns purchased automations into a live configured system.
          </p>
        </div>

        <div className="px-6 md:px-10 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {AUTOMATIONS.map((automation) => (
                <article
                  key={automation.number}
                  className="rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white/88 p-5 md:p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"
                >
                  <div className="inline-flex items-center justify-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-primary">
                    {automation.number}
                  </div>
                  <h3 className="mt-4 text-lg md:text-xl font-semibold text-foreground leading-snug">{automation.title}</h3>
                  <p className="mt-3 text-sm md:text-[15px] text-foreground/72 leading-relaxed">{automation.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(154,92,46,0.12)] bg-[rgba(255,249,240,0.9)] p-5 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/80">How the workflow connects</p>
            <div className="mt-5 space-y-4">
              {[
                "Lead or caller comes in",
                "Twilio and Resend carry the first response",
                "Automation stack runs the matching workflow",
                "Paid orders move through install and admin visibility",
                "Completed customer journeys feed reputation growth",
              ].map((step, index) => (
                <div key={step} className="flex gap-4 items-start">
                  <div className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-[0_8px_20px_rgba(154,92,46,0.25)]">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-semibold text-foreground">{step}</p>
                    <p className="mt-1 text-sm text-foreground/68 leading-relaxed">
                      {index === 0 && "Forms, calls, and inquiry sources create the demand signal."}
                      {index === 1 && "Messaging providers deliver the outbound touchpoints and confirmations."}
                      {index === 2 && "The six automations decide what happens next based on lead state and timing."}
                      {index === 3 && "The install queue and admin workspace show what was purchased, configured, blocked, or live."}
                      {index === 4 && "Review requests and successful customer experiences create trust for the next buyer."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
