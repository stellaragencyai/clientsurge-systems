import { BarChart3, CheckCircle2, MessageSquareText, Workflow } from "lucide-react";

const proofItems = [
  {
    icon: MessageSquareText,
    label: "Example SMS conversation",
    title: "Missed call becomes an active lead",
    body: "A missed caller gets an immediate text-back, replies with the service they need, and lands in the follow-up queue instead of disappearing.",
    proof: "Sorry we missed your call. What can we help you with today?",
  },
  {
    icon: Workflow,
    label: "Before and after workflow",
    title: "Manual chasing becomes a clear sequence",
    body: "Forms, calls, ad leads, follow-up, booking, reviews, and reactivation move through one mapped system instead of separate inboxes.",
    proof: "Lead captured -> AI follow-up -> booking handoff -> review request",
  },
  {
    icon: BarChart3,
    label: "Dashboard visibility",
    title: "Operators can see what is installed",
    body: "The admin workspace tracks package services, setup blockers, runtime tests, communication events, and go-live readiness.",
    proof: "Paid order -> install workspace -> tested services -> live status",
  },
];

export default function ProofBeforeLaunch() {
  return (
    <section id="proof" className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#f8fbff" }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#005f99" }}>
              Proof before launch
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
              Show visitors what they are buying before they book.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              The site now explains the offer, then backs it up with concrete previews of the automation flow:
              messages, workflow handoffs, dashboard visibility, and the installation path after checkout.
            </p>
            <div className="mt-7 space-y-3">
              {["Sample automation flows", "Example SMS language", "Before and after lead journey", "Admin install visibility"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#005f99" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {proofItems.map(({ icon: Icon, label, title, body, proof }) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                    <Icon className="h-5 w-5" style={{ color: "#005f99" }} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
                </div>
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                <div className="mt-4 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  {proof}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
